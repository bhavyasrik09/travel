const mongoose = require("mongoose");

const diaryPageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  content: { type: String, required: true, maxlength: 140 },
  image: { type: String }, // will store uploaded image path
  pageIndex: { type: Number, required: true }, // order of page
}, { timestamps: true });

module.exports = mongoose.model("DiaryPage", diaryPageSchema);
