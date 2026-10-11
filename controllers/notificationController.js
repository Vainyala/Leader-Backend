const notificationService = require("../services/notificationService");
const Notification = require("../models/Notification");

exports.sendNotificationAPI = async (req, res) => {
  try {
    const { token, title, body, type = "general" } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: "FCM token is required" });
    }
    if (!title) {
      return res.status(400).json({ success: false, message: "Notification title is required" });
    }
    if (!body) {
      return res.status(400).json({ success: false, message: "Notification body is required" });
    }

    const response = await notificationService.sendNotification({
      token: token.trim(),
      title,
      body,
      type,
    });

    return res.status(200).json({
      success: true,
      message: "Notification sent successfully",
      response,
    });
  } catch (error) {
    console.error("sendNotificationAPI error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET /api/notification?page=1&limit=20
| Logged-in user's own notifications, latest first.
|--------------------------------------------------------------------------
*/
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId;
console.log("getMyNotifications userId:", userId);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const filter = { user_id: userId };
console.log("getMyNotifications filter:", filter, "page:", page, "limit:", limit);
    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1, _id: -1 }) // latest first
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-__v -user_id")
        .lean(),
      Notification.countDocuments(filter),
    ]);
console.log("getMyNotifications total:", total, "notifications.length:", notifications.length);
    return res.status(200).json({
      success: true,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      notifications,
    });
  } catch (error) {
    console.error("getMyNotifications error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};












// const notificationService =
//   require("../services/notificationService");

// exports.sendNotificationAPI = async (req, res) => {
//   try {
//     const {
//       token,
//       title,
//       body,
//       type = "general",
//     } = req.body;

//     if (!token) {
//       return res.status(400).json({
//         success: false,
//         message: "FCM token is required",
//       });
//     }

//     if (!title) {
//       return res.status(400).json({
//         success: false,
//         message: "Notification title is required",
//       });
//     }

//     if (!body) {
//       return res.status(400).json({
//         success: false,
//         message: "Notification body is required",
//       });
//     }

//     const response =
//       await notificationService.sendNotification({
//         token: token.trim(),
//         title,
//         body,
//         type,
//       });

//     return res.status(200).json({
//       success: true,
//       message: "Notification sent successfully",
//       response,
//     });

//   } catch (error) {
//     console.error(
//       "sendNotificationAPI error:",
//       error
//     );

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//       code: error.code,
//     });
//   }
// };




// // const notificationService =
// //   require("../services/notificationService");


// // exports.sendNotificationAPI = async (req, res) => {

// //   try {

// //     const {
// //       token,
// //       title,
// //       body,
// //       type
// //     } = req.body;


// //     const response =
// //       await notificationService.sendNotification({

// //         token,
// //         title,
// //         body,
// //         type,

// //       });


// //     return res.status(200).json({

// //       success: true,

// //       response,

// //     });


// //   } catch (error) {

// //     console.error(
// //       "sendNotificationAPI error:",
// //       error
// //     );


// //     return res.status(500).json({

// //       success: false,

// //       message:
// //         error.message,

// //       code:
// //         error.code,

// //     });

// //   }

// // };