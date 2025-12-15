const express = require("express");
const cors = require("cors");

const matchRoutes = require("./routes/match.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/match", matchRoutes);

app.listen(4000, () => {
  console.log("Backend running on port 4000");
});
