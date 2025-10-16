const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const passport = require("passport"); // Added for Google login

// ----------------- MULTER SETUP -----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ----------------- SIGNUP -----------------
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    let existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.isDeleted) {
        // Reactivate user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        existingUser.name = name;
        existingUser.password = hashedPassword;
        existingUser.isDeleted = false;
        await existingUser.save();

        const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });

        return res.status(200).json({ token, msg: "Account reactivated successfully" });
      }
      return res.status(400).json({ msg: "User already exists" });
    }

    // Create new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({ token, msg: "User created successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ----------------- LOGIN -----------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User does not exist" });

    if (user.isDeleted) {
      return res.status(403).json({ msg: "This account is deleted. Please sign up again to reactivate." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token, msg: "Login successful" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ----------------- GET CURRENT USER -----------------
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// ----------------- UPDATE PROFILE -----------------
router.put("/update", auth, upload.single("profilePic"), async (req, res) => {
  try {
    const { name, bio, email } = req.body;
    const updateData = { name, bio, email };

    if (req.file) {
      updateData.profilePic = req.file.filename; // save filename in DB
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
    }).select("-password");

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Delete current user (Soft delete)
router.delete("/delete", auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isDeleted: true },
      { new: true }
    );
    res.json({ msg: "Account deleted successfully (soft delete)" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ----------------- GOOGLE LOGIN -----------------

// Initiate Google login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    // Redirect to frontend after successful login
    res.redirect(process.env.FRONTEND_URL || "http://localhost:3000");
  }
);// ----------------- GOOGLE LOGIN (POST for One Tap) -----------------
router.post("/google", async (req, res) => {
  try {
    const { name, email, profilePic, googleId } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new Google user WITHOUT password
      user = new User({
        name,
        email,
        profilePic,
        googleId: googleId || null,
        isGoogleUser: true, // ✅ mark as Google user
      });

      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token, msg: "Google login/signup successful" });
  } catch (err) {
    console.error("Google login error:", err);

    // Check if it's a validation error (e.g., password required)
    if (err.name === "ValidationError") {
      return res
        .status(400)
        .json({ msg: "Validation failed: make sure password is optional" });
    }

    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
