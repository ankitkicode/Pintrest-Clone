const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  caption: {
    type: String,
  },
  image: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming you have a User model
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: [
    { 
     type: mongoose.Schema.Types.ObjectId,
     ref: "User" 
    }
    ],
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
