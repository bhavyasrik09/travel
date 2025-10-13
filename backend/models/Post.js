const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  images: { type: [String], default: [] },
  date: { type: Date, default: Date.now },
  location: { type: String, default: "" },
  tags: { type: [String], default: [] },

  // Likes: store IDs of users who liked the post
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Comments: each comment has user, text, and timestamp
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    },
  ],

  // Saved posts: store IDs of users who saved the post
  savedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

module.exports = mongoose.model("Post", postSchema);

