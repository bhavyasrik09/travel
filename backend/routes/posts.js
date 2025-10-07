const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Post = require("../models/Post");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const mongoose = require("mongoose");
const Notification = require("../models/Notification"); // notifications
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// ---------------- MULTER CLOUDINARY SETUP ----------------
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "postImages",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 1200, crop: "limit" }],
  },
});
const upload = multer({ storage });

// ---------------- CREATE POST ----------------
router.post("/", auth, upload.single("images"), async (req, res) => {
  try {
    const { title, content, location, tags } = req.body;

    if (!title || !content)
      return res.status(400).json({ msg: "Title and content are required" });

    // Use Cloudinary URL if file uploaded, else keep old local path (if provided)
    const images = req.file
      ? [req.file.path] // cloudinary URL
      : []; // old posts already have local paths stored

    const newPost = new Post({
      user: req.user.id,
      title,
      content,
      images,
      location: location || "",
      tags: tags ? tags.split(",").map((t) => t.trim()) : [],
      likes: [],
      comments: [],
      savedBy: [],
    });

    const savedPost = await newPost.save();
    await savedPost.populate("user", "name profilePic");

    res.status(201).json({ post: savedPost });
  } catch (err) {
    console.error("Error creating post:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ---------------- GET ALL POSTS ----------------
router.get("/", auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name profilePic")
      .populate("comments.user", "name profilePic")
      .sort({ createdAt: -1 });

    res.json({ posts });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------------- GET CURRENT USER POSTS ----------------
router.get("/mine", auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user.id })
      .populate("user", "name profilePic")
      .populate("comments.user", "name profilePic")
      .sort({ createdAt: -1 });

    res.json({ posts });
  } catch (err) {
    console.error("Error fetching user's posts:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ---------------- EDIT POST ----------------
router.put("/:id", auth, upload.single("images"), async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });
    if (post.user.toString() !== req.user.id)
      return res.status(401).json({ msg: "Not authorized" });

    const { title, content, location, tags } = req.body;

    post.title = title || post.title;
    post.content = content || post.content;
    post.location = location || post.location;
    post.tags = tags ? tags.split(",").map((t) => t.trim()) : post.tags;
    post.date = Date.now();

    if (req.file) {
      // Keep old images intact if they exist; add new Cloudinary URL
      post.images.push(req.file.path);
    }

    const updatedPost = await post.save();
    await updatedPost.populate("user", "name profilePic");
    res.json({ post: updatedPost });
  } catch (err) {
    console.error("Error editing post:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ---------------- DELETE POST ----------------
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });
    if (post.user.toString() !== req.user.id)
      return res.status(401).json({ msg: "Not authorized" });

    // No need to delete old uploads; keep them for deployment
    await post.deleteOne();
    res.json({ msg: "Post deleted successfully" });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ---------------- LIKE / UNLIKE POST ----------------
router.post("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ msg: "Invalid user ID" });

    if (!Array.isArray(post.likes)) post.likes = [];

    if (post.likes.some((id) => id.toString() === userId)) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.json({ likes: post.likes.map((id) => id.toString()) });
  } catch (err) {
    console.error("Error liking post:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ---------------- COMMENT ON POST (WITH NOTIFICATIONS) ----------------
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const { text } = req.body;
    if (!text || !text.trim())
      return res.status(400).json({ msg: "Comment cannot be empty" });

    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ msg: "Invalid user ID" });

    if (!Array.isArray(post.comments)) post.comments = [];

    const comment = {
      user: userId,
      text: text.trim(),
      createdAt: Date.now(),
    };

    post.comments.push(comment);
    await post.save();
    await post.populate("comments.user", "name profilePic");

    if (post.user.toString() !== userId) {
      const notification = new Notification({
        user: post.user,
        sender: userId,
        type: "comment",
        post: post._id,
      });
      await notification.save();

      const io = req.app.get("io");
      io?.to(post.user.toString()).emit("newNotification", notification);
    }

    const commentsStr = post.comments.map((c) => ({
      ...c._doc,
      user: c.user
        ? { ...c.user._doc, _id: c.user._id.toString() }
        : { _id: userId, name: "Unknown", profilePic: "" },
    }));

    res.json({ comments: commentsStr });
  } catch (err) {
    console.error("Error commenting on post:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ---------------- SAVE / UNSAVE POST ----------------
// ---------------- SAVE / UNSAVE POST ----------------
router.post("/:id/save", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (!Array.isArray(post.savedBy)) post.savedBy = [];
    if (!Array.isArray(user.savedPosts)) user.savedPosts = [];

    let action;
    if (post.savedBy.some((id) => id.toString() === userId)) {
      // Unsave
      post.savedBy = post.savedBy.filter((id) => id.toString() !== userId);
      user.savedPosts = user.savedPosts.filter((id) => id.toString() !== post._id.toString());
      action = "unsaved";
    } else {
      // Save
      post.savedBy.push(userId);
      user.savedPosts.push(post._id);
      action = "saved";
    }

    await post.save();
    await user.save();

    res.json({ action, savedBy: post.savedBy.map((id) => id.toString()) });
  } catch (err) {
    console.error("Error saving post:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ---------------- GET SAVED POSTS ----------------
router.get("/saved", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const savedPosts = await Post.find({ savedBy: userId })
      .populate("user", "name profilePic")
      .populate("comments.user", "name profilePic")
      .sort({ createdAt: -1 });

    res.json({ posts: savedPosts });
  } catch (err) {
    console.error("Error fetching saved posts:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
