const nodemailer = require('nodemailer');
const transporter = require('../config/mailer');

const AppOwner = require('../models/AppOwner');
const CryptoService = require('../services/cryptoService');

module.exports = async function sendEmailOTP(email, otp) {
 
   console.log('Host: ', process.env.SMTP_HOST);
   console.log('Emailid: ', process.env.SMTP_USER);
   // console.log('Password: ', process.env.SMTP_PASS);

  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Verify your account with OTP',
    text: `Your OTP code is ${otp}`
  };

  await transporter.sendMail(mailOptions);
};



exports.verifyEmailOTP = async (req, res) => {
  try {
    const { leader_regd_mobile_no, user_email_id, otp } = req.body;

    const registeruser = await Registeruser.findOne({
      leader_regd_mobile_no,
      user_email_id: user_email_id.toLowerCase().trim()
    });

    if (!registeruser) {
      return res.status(404).json({
        message: 'Email not found'
      });
    }

    if (registeruser.email_otp !== otp) {
      return res.status(400).json({
        message: 'Invalid OTP'
      });
    }

    registeruser.isEmailOTPVerified = true;
    registeruser.email_otp = '1a2b3c';

    await registeruser.save();

    // Get client details
    const encryptedMobile =
      CryptoService.encrypt(leader_regd_mobile_no);

    const owner = await AppOwner.findOne({
      client_regd_mobile_no: encryptedMobile
    });

    if (owner) {
      await sendGreeting(
        user_email_id,
        'otp',
        owner.client_name,
        owner.client_app_name
      );
    }

    return res.status(200).json({
      message: 'User verified and greeted!'
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: err.message
    });
  }
};


// exports.verifyEmailOTP = async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     const registeruser = await Registeruser.findById(email);

//     if (registeruser.otp === otp) {
//       registeruser.isEmailVerified = true;
//       await regsiteruser.save();
//       await sendGreeting(registeruser.email);
//       res.status(200).json({ message: 'User verified and greeted!' });
//     } else {
//       res.status(400).json({ message: 'Invalid OTP' });
//     }
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };
