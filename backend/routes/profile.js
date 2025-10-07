const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const User = require("../models/User");
const Post = require("../models/Post"); // to fetch user posts

// Multer setup
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profilePics",
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

const upload = multer({ storage });


// ------------------ Create / Update Profile ------------------
router.post("/", auth, upload.single("profilePic"), async (req, res) => {
  try {
    const { name, bio } = req.body;
    const profilePic = req.file ? req.file.path : "";

    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.name = name;
    user.bio = bio;
    if (profilePic) user.profilePic = profilePic;

    await user.save();
    res.json({ msg: "Profile updated", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------ Get current user's profile ------------------
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------ Get public profile by ID ------------------
router.get("/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "name profilePic")
      .populate("following", "name profilePic");
    if (!user) return res.status(404).json({ msg: "User not found" });

    // Get user's posts
    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 }) // newest first
      .select("title createdAt location");

    res.json({ user, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ------------------ Follow / Unfollow ------------------
router.post("/:id/follow", auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser) return res.status(404).json({ msg: "User not found" });
    if (targetUser._id.equals(currentUser._id))
      return res.status(400).json({ msg: "Cannot follow yourself" });

    const isFollowing = currentUser.following.includes(targetUser._id);

    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUser._id);
      targetUser.followers.pull(currentUser._id);
    } else {
      // Follow
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      msg: isFollowing ? "Unfollowed user" : "Followed user",
      following: currentUser.following,
      followers: targetUser.followers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});


// ------------------ User Analytics ------------------
router.get("/analytics/data", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user info
    const user = await User.findById(userId)
      .populate("followers", "name")
      .populate("following", "name");

    if (!user) return res.status(404).json({ msg: "User not found" });

    // Fetch posts of the current user
    const posts = await Post.find({ user: userId });

    // Calculate total likes
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);

    // Prepare analytics data
    const analytics = {
      totalPosts: posts.length,
      totalLikes,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      posts: posts.map((p) => ({
        title: p.title,
        likes: p.likes?.length || 0,
        createdAt: p.createdAt,
      })),
    };

    res.json(analytics);
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ msg: "Server error while fetching analytics" });
  }
});


module.exports = router;
