const User = require('../models/User');

exports.saveFcmToken = async (req, res) => {
  try {
    const { user_email_id, fcm_token } = req.body;

    if (!user_email_id || !fcm_token) {
      return res.status(400).json({
        success: false,
        message: "user_email_id and fcm_token required"
      });
    }

    await User.findOneAndUpdate(
      { user_email_id },
      { fcm_token },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "FCM token saved successfully"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};