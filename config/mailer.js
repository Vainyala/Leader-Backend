// // config/mailer.js using nutantek.com email server


require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP verification failed:', error);
  } else {
    console.log('SMTP server is ready:', success);
  }
});

module.exports = transporter;





// const nodemailer = require('nodemailer');
// require('dotenv').config();

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST, // e.g. mail.nutantek.com
//   port: process.env.SMTP_PORT, // 587 or 465
//   secure: process.env.SMTP_PORT === '465', // true for SSL
//   auth: {
//     user: process.env.SMTP_USER, // e.g. info@nutantek.com
//     pass: process.env.SMTP_PASS,
//   },
// });

// transporter.verify((error, success) => {
//   if (error) {
//     console.error('SMTP verification failed:', error);
//   } else {
//     console.log('SMTP server is ready:', success);
//   }
// });

// module.exports = transporter;
// ;
