const nodemailer = require('nodemailer');
const transporter = require('../config/mailer');


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
    const { email, otp } = req.body;
    const registeruser = await Registeruser.findById(email);

    if (registeruser.otp === otp) {
      registeruser.isEmailVerified = true;
      await regsiteruser.save();
      await sendGreeting(registeruser.email);
      res.status(200).json({ message: 'User verified and greeted!' });
    } else {
      res.status(400).json({ message: 'Invalid OTP' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
