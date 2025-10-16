const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    // ✅ Password is required only if not a Google user
    required: function() {
      return !this.isGoogleUser;
    }
  },
  bio: {
    type: String,
    default: ""
  },
  profilePic: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  },

  // Followers & Following
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  // Places visited (for map visualization)
  visitedPlaces: [
    {
      locationName: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      },
      dateVisited: { type: Date, default: Date.now }
    }
  ],

  // ⭐ Saved posts (bookmarks)
  savedPosts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post"
    }
  ],

  // --- Google Login Fields ---
  googleId: {
    type: String,
    default: null
  },
  isGoogleUser: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model("User", userSchema);
