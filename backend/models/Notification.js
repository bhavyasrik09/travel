const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // user who receives the notification
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // user who triggered it
  type: { type: String, enum: ["comment", "follow"], required: true }, // type of notification
  post: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // if related to a post
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
