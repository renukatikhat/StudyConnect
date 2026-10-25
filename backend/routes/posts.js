
const express = require("express");
const mongoose = require("mongoose");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const protect = require("../middleware/auth");

const router = express.Router();

// GET POSTS BY A PARTICULAR STUDENT
router.get("/user/:userId", protect, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID."
      });
    }

    const posts = await Post.find({ author: userId })
      .populate("author", "name email bio profilePhoto")
      .populate("comments.author", "name profilePhoto")
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Get student posts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student posts."
    });
  }
});

// GET ALL POSTS
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "name email bio profilePhoto")
      .populate("comments.author", "name profilePhoto")
      .sort({ createdAt: -1 });

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch posts."
    });
  }
});

// CREATE POST, DOUBT OR RESOURCE
router.post("/", protect, async (req, res) => {
  try {
    const content =
      typeof req.body.content === "string"
        ? req.body.content.trim()
        : "";

    const community =
      typeof req.body.community === "string"
        ? req.body.community.trim()
        : "General";

    const allowedTypes = ["post", "doubt", "resource"];

    const type = allowedTypes.includes(req.body.type)
      ? req.body.type
      : "post";

    if (!content || content.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Post must contain 1 to 1000 characters."
      });
    }

    const post = await Post.create({
      author: req.user._id,
      content,
      community: community || "General",
      type
    });

    await post.populate("author", "name email bio profilePhoto");

    res.status(201).json({
      success: true,
      message: "Post created successfully!",
      post
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create post."
    });
  }
});

// LIKE OR UNLIKE A POST
router.post("/:id/like", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID."
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found."
      });
    }

    post.likes = post.likes || [];

    const currentUserId = req.user._id.toString();

    const alreadyLiked = post.likes.some(
      userId => userId.toString() === currentUserId
    );

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        userId => userId.toString() !== currentUserId
      );
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    // Notify the post owner only when another user likes the post.
    // Do not create notifications when unliking or liking your own post.
    if (
      !alreadyLiked &&
      post.author.toString() !== currentUserId
    ) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: "like",
        post: post._id,
        message: `${req.user.name} liked your post.`
      });
    }

    res.json({
      success: true,
      liked: !alreadyLiked,
      likes: post.likes.length
    });
  } catch (error) {
    console.error("Like post error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update like."
    });
  }
});

// ADD A COMMENT
router.post("/:id/comments", protect, async (req, res) => {
  try {
    const { id } = req.params;

    const text =
      typeof req.body.text === "string"
        ? req.body.text.trim()
        : "";

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID."
      });
    }

    if (!text || text.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Comment must contain 1 to 500 characters."
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found."
      });
    }

    post.comments.push({
      author: req.user._id,
      text
    });

    await post.save();

    // Notify the post owner when another user comments.
    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: "comment",
        post: post._id,
        message: `${req.user.name} commented on your post.`
      });
    }

    await post.populate("comments.author", "name profilePhoto");

    res.status(201).json({
      success: true,
      message: "Comment added successfully!",
      comments: post.comments
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment."
    });
  }
});

// GET COMMENTS FOR A POST
router.get("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID."
      });
    }

    const post = await Post.findById(id)
      .populate("comments.author", "name profilePhoto");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found."
      });
    }

    res.json({
      success: true,
      comments: post.comments || []
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch comments."
    });
  }
});

module.exports = router;
