const mongoose = require("mongoose");

const travelItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true }, // e.g., "Paris"
  description: { type: String, default: "" },
  completed: { type: Boolean, default: false },
  dateAdded: { type: Date, default: Date.now },

  // Store coordinates
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
});

module.exports = mongoose.model("TravelItem", travelItemSchema);
