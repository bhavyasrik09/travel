const mongoose = require("mongoose");

const diaryPageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    image: { type: String }, // store uploaded image path (Cloudinary URL)
    pageIndex: { type: Number, required: true }, // page order
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

module.exports = mongoose.model("DiaryPage", diaryPageSchema);
