
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const router = express.Router();

const User = require("../models/User");
const Notification = require("../models/Notification");
const protect = require("../middleware/auth");

// ===============================
// UPLOADS FOLDER
// ===============================

const uploadDir = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ===============================
// PROFILE PHOTO UPLOAD SETTINGS
// ===============================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${req.user._id}-${Date.now()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif"
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Please select a JPG, PNG, WEBP, or GIF image."));
    }
  }
});

// ===============================
// UPLOAD PROFILE PHOTO
// ===============================

router.post(
  "/profile-photo",
  protect,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select a photo."
        });
      }

      req.user.profilePhoto = `/uploads/${req.file.filename}`;
      await req.user.save();

      res.json({
        success: true,
        message: "Profile photo uploaded successfully!",
        profilePhoto: req.user.profilePhoto
      });
    } catch (error) {
      console.error("Photo upload error:", error);

      res.status(500).json({
        success: false,
        message: "Photo upload failed."
      });
    }
  }
);

// ===============================
// UPDATE PROFILE
// ===============================

router.put("/profile", protect, async (req, res) => {
  try {
    const { name, bio, skills } = req.body;

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters."
      });
    }

    if (name.trim().length > 60) {
      return res.status(400).json({
        success: false,
        message: "Name cannot exceed 60 characters."
      });
    }

    if (bio !== undefined && typeof bio !== "string") {
      return res.status(400).json({
        success: false,
        message: "Bio must be text."
      });
    }

    if (typeof bio === "string" && bio.length > 300) {
      return res.status(400).json({
        success: false,
        message: "About Me cannot exceed 300 characters."
      });
    }

    if (skills !== undefined && !Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        message: "Skills must be a list."
      });
    }

    req.user.name = name.trim();
    req.user.bio = (bio || "").trim();

    req.user.skills = Array.isArray(skills)
      ? skills.map(skill => String(skill).trim()).filter(Boolean)
      : [];

    await req.user.save();

    res.json({
      success: true,
      message: "Profile updated successfully!",
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        bio: req.user.bio,
        skills: req.user.skills,
        profilePhoto: req.user.profilePhoto || ""
      }
    });
  } catch (error) {
    console.error("Profile update error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update profile."
    });
  }
});

// ===============================
// GET ALL STUDENTS
// ===============================

router.get("/students", protect, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const students = await User.find()
      .select("name email bio skills profilePhoto followers following")
      .sort({ name: 1 });

    const result = students.map(student => {
      const followers = student.followers || [];
      const following = student.following || [];

      return {
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        bio: student.bio || "",
        skills: student.skills || [],
        profilePhoto: student.profilePhoto || "",
        followers: followers.length,
        following: following.length,
        isMe: student._id.toString() === currentUserId.toString(),
        isFollowing: following.some(
          id => id.toString() === currentUserId.toString()
        )
      };
    });

    res.json({
      success: true,
      students: result
    });
  } catch (error) {
    console.error("Get students error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load students."
    });
  }
});

// ===============================
// FOLLOW A STUDENT
// ===============================

router.post("/:id/follow", protect, async (req, res) => {
  try {
    const targetUserId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID."
      });
    }

    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Your account was not found."
      });
    }

    if (currentUser._id.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself."
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    currentUser.following = currentUser.following || [];
    targetUser.followers = targetUser.followers || [];

    const alreadyFollowing = currentUser.following.some(
      id => id.toString() === targetUserId
    );

    if (alreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: "You are already following this student."
      });
    }

    currentUser.following.push(targetUser._id);
    targetUser.followers.push(currentUser._id);

    await currentUser.save();
    await targetUser.save();

    // Create follow notification
    await Notification.create({
      recipient: targetUser._id,
      sender: currentUser._id,
      type: "follow",
      message: `${currentUser.name} started following you.`
    });

    res.json({
      success: true,
      message: "Student followed successfully!",
      followers: targetUser.followers.length,
      following: currentUser.following.length
    });
  } catch (error) {
    console.error("Follow error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to follow student."
    });
  }
});

// ===============================
// UNFOLLOW A STUDENT
// ===============================

router.delete("/:id/follow", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID."
      });
    }

    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(req.params.id);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "Your account was not found."
      });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    currentUser.following = (currentUser.following || []).filter(
      id => id.toString() !== targetUser._id.toString()
    );

    targetUser.followers = (targetUser.followers || []).filter(
      id => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await targetUser.save();

    res.json({
      success: true,
      message: "Student unfollowed successfully!",
      followers: targetUser.followers.length,
      following: currentUser.following.length
    });
  } catch (error) {
    console.error("Unfollow error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to unfollow student."
    });
  }
});

// ===============================
// GET FOLLOWERS LIST
// ===============================

router.get("/:id/followers", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID."
      });
    }

    const user = await User.findById(req.params.id)
      .populate("followers", "name email bio skills profilePhoto");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    res.json({
      success: true,
      students: (user.followers || []).map(student => ({
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        bio: student.bio || "",
        skills: student.skills || [],
        profilePhoto: student.profilePhoto || ""
      }))
    });
  } catch (error) {
    console.error("Followers list error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load followers."
    });
  }
});

// ===============================
// GET FOLLOWING LIST
// ===============================

router.get("/:id/following", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID."
      });
    }

    const user = await User.findById(req.params.id)
      .populate("following", "name email bio skills profilePhoto");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    res.json({
      success: true,
      students: (user.following || []).map(student => ({
        id: student._id.toString(),
        name: student.name,
        email: student.email,
        bio: student.bio || "",
        skills: student.skills || [],
        profilePhoto: student.profilePhoto || ""
      }))
    });
  } catch (error) {
    console.error("Following list error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load following list."
    });
  }
});

// ===============================
// GET FOLLOWER / FOLLOWING COUNTS
// ===============================

router.get("/:id/follow-stats", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID."
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Student not found."
      });
    }

    res.json({
      success: true,
      followers: (user.followers || []).length,
      following: (user.following || []).length
    });
  } catch (error) {
    console.error("Follow stats error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load follow statistics."
    });
  }
});

module.exports = router;
