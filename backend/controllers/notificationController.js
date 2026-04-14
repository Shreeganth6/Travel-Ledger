const notificationService = require('../services/notificationService');

exports.getNotifications = async (req, res) => {
  try {
    const data = await notificationService.getNotificationsForUser(req.user.user_id);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.user_id);
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notificationId = Number(req.params.id);
    await notificationService.markAsRead(notificationId, req.user.user_id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await notificationService.markAllRead(req.user.user_id);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
