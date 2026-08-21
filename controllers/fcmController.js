const User = require('../models/User');

exports.saveFcmToken = async (req, res) => {

  try {

    const {
      leader_regd_mobile_no,
      user_email_id,
      fcm_token
    } = req.body;
console.log("savefcmtoken body",req.body);
    if (
      !leader_regd_mobile_no ||
      !user_email_id ||
      !fcm_token
    ) {
      return res.status(400).json({
        success: false,
        message:
          'leader_regd_mobile_no, user_email_id and fcm_token are required'
      });
    }

    const user =
      await User.findOneAndUpdate(

        {
          leader_regd_mobile_no,
          user_email_id
        },

        {
          $set: {
            fcm_token: fcm_token.trim()
          }
        },

        {
          new: true
        }

      );

    if (!user) {

      return res.status(404).json({
        success: false,
        message: 'User not found'
      });

    }

    return res.status(200).json({
      success: true,
      message: 'FCM token saved successfully'
    });

  } catch (err) {

    console.error(
      'saveFcmToken error:',
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }

};






// const User = require('../models/User');

// exports.saveFcmToken = async (req, res) => {
//   try {
//     const { user_email_id, fcm_token } = req.body;

//     if (!user_email_id || !fcm_token) {
//       return res.status(400).json({
//         success: false,
//         message: "user_email_id and fcm_token required"
//       });
//     }

//     await User.findOneAndUpdate(
//       { user_email_id },
//       { fcm_token },
//       { new: true }
//     );

//     return res.status(200).json({
//       success: true,
//       message: "FCM token saved successfully"
//     });

//   } catch (err) {
//     return res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// };