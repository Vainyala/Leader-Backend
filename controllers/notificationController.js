const notificationService = require("../services/notificationService");

exports.sendNotificationAPI = async (req, res) => {
  try {
    const { token, title, body, type } = req.body;

    const response =
      await notificationService.sendNotification({
        token,
        title,
        body,
        type,
      });

    return res.status(200).json({
      success: true,
      response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};