const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const matchRoutes = require("./routes/match.routes");
const { createUser } = require("./store/users");
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

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

app.use("/match", matchRoutes);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(4000, () => {
  console.log("Backend + WebSocket running on port 4000");
});
