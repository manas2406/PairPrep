const express = require("express");
const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "i am goated" });
});

app.listen(4000, () => {
  console.log("Backend running on port 4000");
});
