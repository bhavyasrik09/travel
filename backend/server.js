// ------------------- Requires -------------------
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

const postsRoute = require("./routes/posts");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const bucketRoutes = require("./routes/travel");
const notificationRoutes = require("./routes/notifications");

// ------------------- App Setup -------------------
const app = express();

// ------------------- Allowed Origins -------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.FRONTEND_URL, // your deployed frontend URL
].filter(Boolean);

// ------------------- HTTP & Socket.io Setup -------------------
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  socket.on("joinUserRoom", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ------------------- Middleware -------------------
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static("uploads")); // Serve profile pictures

// ------------------- API Routes -------------------
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/posts", postsRoute);
app.use("/api/travel", bucketRoutes);
app.use("/api/diary", require("./routes/diary"));
app.use("/api/notifications", notificationRoutes);

// ------------------- Serve React Frontend -------------------
const frontendBuildPath = path.join(__dirname, "../frontend/build");
app.use(express.static(frontendBuildPath));

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

// ------------------- MongoDB Connection -------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ------------------- Export io -------------------
app.set("io", io);

// ------------------- Start Server -------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
