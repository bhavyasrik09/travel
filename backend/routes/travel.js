const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const TravelItem = require("../models/TravelItem");

// GET all items for current user
router.get("/", auth, async (req, res) => {
  try {
    const items = await TravelItem.find({ user: req.user.id }).sort({ dateAdded: -1 });
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// POST add a new item
router.post("/", auth, async (req, res) => {
  try {
    const { title, description, latitude, longitude } = req.body;

    const newItem = new TravelItem({
      user: req.user.id,
      title,
      description,
      latitude: latitude || null,
      longitude: longitude || null,
    });

    await newItem.save();
    res.json(newItem);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// PUT update an item
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, description, completed, latitude, longitude } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "Invalid ID" });
    }

    const item = await TravelItem.findById(req.params.id);
    if (!item || item.user.toString() !== req.user.id) {
      return res.status(404).json({ msg: "Not found" });
    }

    item.title = title ?? item.title;
    item.description = description ?? item.description;
    item.completed = completed ?? item.completed;
    item.latitude = latitude ?? item.latitude;
    item.longitude = longitude ?? item.longitude;

    await item.save();
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// DELETE an item
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "Invalid ID" });
    }

    const item = await TravelItem.findById(req.params.id);
    if (!item || item.user.toString() !== req.user.id) {
      return res.status(404).json({ msg: "Not found" });
    }

    await item.deleteOne(); // safer than remove()
    res.json({ msg: "Item removed" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
