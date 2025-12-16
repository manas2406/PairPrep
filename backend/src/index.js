const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const matchRoutes = require("./routes/match.routes");
const { createUser } = require("./store/users");
const { getUser, setSolvedProblems } = require("./store/users");
const { fetchSolvedProblems } = require("./utils/codeforces");
const { getUserBySocket } = require("./store/sockets");
const submissionRoutes = require("./routes/submission.routes");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use("/submission", submissionRoutes);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});
app.set("io", io);


app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/auth/signup", (req, res) => {
  const { userId, cfHandle } = req.body;

  if (!userId || !cfHandle) {
    return res.status(400).json({ error: "userId and cfHandle required" });
  }

  createUser(userId, cfHandle);

  return res.json({ status: "created" });
});

app.post("/cf/fetch-solved", async (req, res) => {
  const { userId } = req.body;

  const user = getUser(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const solved = await fetchSolvedProblems(user.cfHandle);
    setSolvedProblems(userId, solved);

    return res.json({
      status: "ok",
      solvedCount: solved.size,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Failed to fetch from Codeforces",
    });
  }
});

app.use("/match", matchRoutes);

const {
  bindSocket,
  unbindSocket,
} = require("./store/sockets");

io.on("connection", (socket) => {
  const { userId } = socket.handshake.query;

  if (!userId) {
    socket.disconnect();
    return;
  }

  bindSocket(socket.id, userId);

  socket.on("join_room", ({ roomId }) => {
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
  });

  socket.on("chat_message", ({ roomId, message }) => {
    const sender = getUserBySocket(socket.id);

    if (!sender) return;

    io.to(roomId).emit("chat_message", {
      userId: sender,
      message,
      time: Date.now(),
    });
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


server.listen(4000, () => {
  console.log("Backend + WebSocket running on port 4000");
});
