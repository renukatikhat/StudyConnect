const path = require("path");
const postRoutes = require("./routes/posts");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const userRoutes = require("./routes/users");
const connectDB = require("./db");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 5000;
app.use("/api/notifications", require("./routes/notifications"));
app.use(cors());
app.use(
  "/uploads",
  require("express").static(path.join(__dirname, "uploads"))
);
app.use(express.json({ limit: "10kb" }));
app.use("/api/users", userRoutes);
app.get("/", (req, res) => {
  res.send("Welcome to StudyConnect Backend!");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "StudyConnect server is running!"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
async function startServer() {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `StudyConnect server running on port ${PORT}`
  );
});
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
