import express from "express";

const app = express();
const PORT = 3000;

app.get("/", (_req, res) => {
  res.send("backend running");
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
