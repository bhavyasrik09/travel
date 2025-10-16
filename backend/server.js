const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const postsRoute = require("./routes/posts");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const bucketRoutes = require("./routes/travel");
const notificationRoutes = require("./routes/notifications");

const passport = require("passport");
const cookieSession = require("cookie-session");
require('./config/passport'); // your passport.js file for Google OAuth

const app = express();

// Create HTTP server for Socket.io
const http = require("http");
const server = http.createServer(app);

// Socket.io setup
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*", // adjust this in production to your frontend URL
    methods: ["GET", "POST"],
  },
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("New client connected: ", socket.id);

  // Join a room for each user (userId will be sent from frontend)
  socket.on("joinUserRoom", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected: ", socket.id);
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // serve profile pictures

// ----------------------
// Passport & Session Setup
// ----------------------
app.use(
  cookieSession({
    name: "session",
    keys: [process.env.SESSION_KEY || "some_random_key"], // set in .env
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/posts", postsRoute);
app.use("/api/travel", bucketRoutes);
app.use("/api/diary", require("./routes/diary"));
app.use("/api/notifications", notificationRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Export io so other routes can emit notifications
app.set("io", io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
