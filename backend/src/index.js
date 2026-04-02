const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") }); // Loads from src/.env locally; on Render, env vars are injected by the platform
const express = require("express");
const cors = require("cors");
const User = require("./models/User");
const authMiddleware = require("./middleware/auth");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./db");
const jwt = require("jsonwebtoken");
const authRoutes = require("./routes/auth.routes");
const matchRoutes = require("./routes/match.routes");
const submissionRoutes = require("./routes/submission.routes");
const leaderboardRoutes = require("./routes/leaderboard.routes");
const practiceRoutes = require("./routes/practice.routes");
const { getUserBySocket } = require("./store/sockets");
const { getRoom } = require("./store/rooms");
const redis = require("./redis");
const { fetchSolvedProblems } = require("./utils/codeforces");

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000"
}));
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/match", authMiddleware, matchRoutes);
app.use("/submission", authMiddleware, submissionRoutes);
app.use("/leaderboard", leaderboardRoutes);
app.use("/practice", practiceRoutes);

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

app.get("/stats", async (req, res) => {
  try {
    const Problem = require("./models/Problem");
    const Match = require("./models/Match");
    
    // Efficient countDocuments overrides everything
    const [players, battles, problems] = await Promise.all([
      User.countDocuments(),
      Match.countDocuments(),
      Problem.countDocuments()
    ]);

    res.json({ players, battles, problems });
  } catch(e) {
    res.status(500).json({ error: "Stats error"});
  }
});


app.post("/cf/fetch-solved", authMiddleware, async (req, res) => {
  const userId = req.user.username;
  try {
    const user = await User.findOne({ username: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const solved = await fetchSolvedProblems(user.cfHandle);
    const solvedArray = Array.from(solved);

    // Merge CF solved problems without overwriting match-related entries
    await User.updateOne(
      { username: userId },
      { $addToSet: { solvedProblems: { $each: solvedArray }, attemptedProblems: { $each: solvedArray } } }
    );

    return res.json({
      status: "ok",
      solvedCount: solvedArray.length,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: "Failed to fetch from Codeforces",
    });
  }
});


// Match routes are mounted above
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
  
  // Reconnection Handling
  (async () => {
    try {
      const activeRoomId = await redis.get(`activeMatch:${userId}`);
      if (activeRoomId) {
        const room = getRoom(activeRoomId);
        if (room && !room.finished) {
          socket.join(activeRoomId);
          socket.emit("match_reconnect", {
             roomId: activeRoomId,
             problem: room.problem,
             chat: room.chat || []
          });
          console.log(`User ${userId} reconnected to ${activeRoomId}`);
        } else {
          // Cleanup stale room state
          await redis.del(`activeMatch:${userId}`);
        }
      }
    } catch(err) {
      console.error("Reconnection fetch error", err);
    }
  })();

  socket.on("chat_message", ({ roomId, message }) => {
    const sender = getUserBySocket(socket.id);

    if (!sender) return;
    
    // Persist chat in memory
    const room = getRoom(roomId);
    const msgObj = {
      userId: sender,
      message,
      time: Date.now(),
    };
    if (room && room.chat) {
        room.chat.push(msgObj);
    }

    io.to(roomId).emit("chat_message", msgObj);
  });
  socket.on("join_room", ({ roomId }) => {
    socket.join(roomId);
    console.log("JOIN ROOM", roomId, socket.id);
  });

  socket.on("leave_room", async ({ roomId }) => {
    const userId = getUserBySocket(socket.id);

    socket.leave(roomId);

    socket.to(roomId).emit("user_left", {
      userId,
    });

    console.log(`User ${userId} left room ${roomId}`);

    try {
        const room = getRoom(roomId);
        if (room && !room.finished) {
           const { finishRoom } = require("./store/rooms");
           finishRoom(roomId, "FORFEIT");
           const winnerUserId = room.participants.find(p => p !== userId);
           if (winnerUserId) {
              const { applyMatchResult } = require("./controllers/submission.controller");
              await applyMatchResult(room, winnerUserId, io, roomId);
              console.log(`User ${userId} forfeited match to ${winnerUserId}`);
           }
        }
    } catch(e) { console.error("Forfeit Error:", e); }
  });
  socket.on("disconnect", () => {
    const userId = getUserBySocket(socket.id);
    console.log(`Socket disconnected: ${socket.id}, User: ${userId}`);

    if (userId) {
      // Free from local mapping
      unbindSocket(socket.id);
      
      // Cleanup ghost socket from ALL rate queues aggressively
      (async () => {
         try {
            // Note: Explicitly NOT auto-forfeiting here to allow Graceful Reconnects!
         } catch(e) {}
      })();
    }
  });
});

connectDB();

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend + WebSocket running on port ${PORT}`);
});
