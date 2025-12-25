const express = require("express");
const cors = require("cors");
const User = require("./models/User");
const authMiddleware = require("./middleware/auth");
const http = require("http");
const { Server } = require("socket.io");
const matchRoutes = require("./routes/match.routes");
const { createUser } = require("./store/users");
const connectDB = require("./db");
const jwt = require("jsonwebtoken");
const { getUser, setSolvedProblems } = require("./store/users");
const authRoutes = require("./routes/auth.routes");
const { fetchSolvedProblems } = require("./utils/codeforces");
const { getUserBySocket } = require("./store/sockets");
const submissionRoutes = require("./routes/submission.routes");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use("/submission", authMiddleware, submissionRoutes);
app.use("/auth", authRoutes);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});
app.set("io", io);


app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const bcrypt = require("bcryptjs");
const { generateToken } = require("./utils/auth");

app.post("/auth/signup", async (req, res) => {
  const { userId, cfHandle, password } = req.body;

  if (!userId || !cfHandle || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    const existingUser = await User.findOne({ username: userId });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: userId,
      cfHandle,
      password: hashedPassword,
    });

    const token = generateToken(user.username);

    return res.json({
      token,
      user: {
        username: user.username,
        cfHandle: user.cfHandle,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Signup failed" });
  }
});

app.post("/auth/login", async (req, res) => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    const user = await User.findOne({ username: userId });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.username);

    return res.json({
      token,
      user: {
        username: user.username,
        cfHandle: user.cfHandle,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Login failed" });
  }
});


app.post("/cf/fetch-solved", async (req, res) => {
  const { userId } = req.body;
  try {
    const user = await User.findOne({ username: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const solved = await fetchSolvedProblems(user.cfHandle);

    user.solvedProblems = Array.from(solved);
    await user.save();

    return res.json({
      status: "ok",
      solvedCount: user.solvedProblems.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Failed to fetch from Codeforces",
    });
  }
});


app.use("/match", authMiddleware, matchRoutes);

const {
  bindSocket,
  unbindSocket,
} = require("./store/sockets");

io.on("connection", (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    socket.disconnect();
    return;
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId;

  bindSocket(socket.id, userId);

  console.log(`User ${userId} connected via socket ${socket.id}`);

  socket.on("chat_message", ({ roomId, message }) => {
    const sender = getUserBySocket(socket.id);

    if (!sender) return;
    console.log("CHAT:", roomId, message);
    console.log("EMITTING to room:", roomId, io.sockets.adapter.rooms.get(roomId));
    io.to(roomId).emit("chat_message", {
      userId: sender,
      message,
      time: Date.now(),
    });
  });
  socket.on("join_room", ({ roomId }) => {
    socket.join(roomId);
    console.log("JOIN ROOM", roomId, socket.id);
  });

  socket.on("leave_room", ({ roomId }) => {
    const userId = getUserBySocket(socket.id);

    socket.leave(roomId);

    socket.to(roomId).emit("user_left", {
      userId,
    });

    console.log(`User ${userId} left room ${roomId}`);
  });
  socket.on("disconnect", () => {
    unbindSocket(socket.id);
    console.log(`User ${userId} disconnected`);
  });
});

connectDB();

server.listen(4000, () => {
  console.log("Backend + WebSocket running on port 4000");
});
