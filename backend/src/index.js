const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());  
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/match/start", (req, res) => {
  console.log("Matchmaking started");

  res.json({
    status: "searching"
  });
});

app.listen(4000, () => {
  console.log("Backend running on port 4000");
});
