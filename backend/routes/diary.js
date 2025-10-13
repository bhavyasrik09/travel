const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // your existing auth middleware
const multer = require("multer");
const DiaryPage = require("../models/DiaryPage");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// ---------------- MULTER CLOUDINARY SETUP ----------------
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "diaryImages",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 1200, crop: "limit" }],
  },
});
const upload = multer({ storage });

// ---------------- GET all diary pages ----------------
router.get("/", auth, async (req, res) => {
  try {
    const pages = await DiaryPage.find({ user: req.user.id }).sort({ pageIndex: 1 });
    res.json(pages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ---------------- CREATE / UPDATE diary page ----------------
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, pageIndex } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ msg: "Title is required" });
    }

    const image = req.file ? req.file.path : req.body.image || "";

    let page = await DiaryPage.findOne({ user: req.user.id, pageIndex });

    if (page) {
      page.title = title;
      if (image) page.image = image;
      await page.save();
    } else {
      page = await DiaryPage.create({
        user: req.user.id,
        title,
        image,
        pageIndex,
      });
    }

    res.json(page);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


// ---------------- DELETE a diary page ----------------
router.delete("/:id", auth, async (req, res) => {
  try {
    const page = await DiaryPage.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id, // ensure user can delete only their pages
    });

    if (!page) {
      return res.status(404).json({ msg: "Page not found" });
    }

    // ✅ Optional: delete image from Cloudinary too
    if (page.image) {
      try {
        const publicId = page.image.split("/").pop().split(".")[0]; // extract public ID
        await cloudinary.uploader.destroy(`diaryImages/${publicId}`);
      } catch (err) {
        console.warn("Cloudinary deletion failed:", err.message);
      }
    }

    res.json({ msg: "Page deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});


module.exports = router;
