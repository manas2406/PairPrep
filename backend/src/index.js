require("dotenv").config(); // MUST be first line
const express = require("express");
const cors = require("cors");
const User = require("./models/User");
const authMiddleware = require("./middleware/auth");
const http = require("http");
const { Server } = require("socket.io");
const matchRoutes = require("./routes/match.routes");
const connectDB = require("./db");
const jwt = require("jsonwebtoken");
const authRoutes = require("./routes/auth.routes");
const { fetchSolvedProblems } = require("./utils/codeforces");
const { getUserBySocket } = require("./store/sockets");
const submissionRoutes = require("./routes/submission.routes");

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000"
}));
app.use(express.json());
app.use("/submission", authMiddleware, submissionRoutes);
app.use("/auth", authRoutes);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  },
});
app.set("io", io);


app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


app.post("/cf/fetch-solved", authMiddleware, async (req, res) => {
  const userId = req.user.username;
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
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.warn("Socket auth failed:", err.message);
    socket.disconnect(true);
    return;
  }
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
    const userId = getUserBySocket(socket.id);
    console.log(`Socket disconnected: ${socket.id}, User: ${userId}`);

    if (userId) {
      // Find if user is in any active room to clean it up.
      // Easiest global check: emit user_left to all rooms this socket was previously joined to.
      // Socket.io automatically leaves rooms on disconnect, so rooms Set is empty. But we can track via logic if needed.
      // For now, ensuring we unbind the socket prevents ghost matchmaking queues.
      unbindSocket(socket.id);
    }
  });
});

connectDB();

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend + WebSocket running on port ${PORT}`);
});
