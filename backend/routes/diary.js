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
    const { title, date, content, pageIndex } = req.body;

    // Use new Cloudinary image URL if uploaded, else keep old image
    const image = req.file ? req.file.path : req.body.image || "";

    let page = await DiaryPage.findOne({ user: req.user.id, pageIndex });

    if (page) {
      page.title = title;
      page.date = date;
      page.content = content;
      if (image) page.image = image; // only update if new image uploaded or old image path provided
      await page.save();
    } else {
      page = await DiaryPage.create({
        user: req.user.id,
        title,
        date,
        content,
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

module.exports = router;
