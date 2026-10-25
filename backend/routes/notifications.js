
const express = require("express");
const Notification = require("../models/Notification");
const protect = require("../middleware/auth");

const router = express.Router();

// Get current user's notifications
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id
    })
      .populate("sender", "name profilePhoto")
      .populate("post", "content")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false
    });

    res.json({
      success: true,
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error("Notifications error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load notifications."
    });
  }
});

// Mark one notification as read
router.patch("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        recipient: req.user._id
      },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found."
      });
    }

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update notification."
    });
  }
});

// Mark all notifications as read
router.patch("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false
      },
      { isRead: true }
    );

    res.json({
      success: true,
      message: "All notifications marked as read."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update notifications."
    });
  }
});

module.exports = router;
