const notificationService =
  require("../services/notificationService");

exports.sendNotificationAPI = async (req, res) => {
  try {
    const {
      token,
      title,
      body,
      type = "general",
    } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Notification title is required",
      });
    }

    if (!body) {
      return res.status(400).json({
        success: false,
        message: "Notification body is required",
      });
    }

    const response =
      await notificationService.sendNotification({
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
    console.error(
      "sendNotificationAPI error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
      code: error.code,
    });
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
//       type
//     } = req.body;


//     const response =
//       await notificationService.sendNotification({

//         token,
//         title,
//         body,
//         type,

//       });


//     return res.status(200).json({

//       success: true,

//       response,

//     });


//   } catch (error) {

//     console.error(
//       "sendNotificationAPI error:",
//       error
//     );


//     return res.status(500).json({

//       success: false,

//       message:
//         error.message,

//       code:
//         error.code,

//     });

//   }

// };