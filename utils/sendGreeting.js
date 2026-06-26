const nodemailer = require('nodemailer');
const transporter = require('../config/mailer');


module.exports = async function sendGreeting(email, action) {
 
   console.log('sendGreeting: \nHost: ', process.env.SMTP_HOST);
   console.log('From Emailid: ', process.env.SMTP_USER);
   console.log('To Email id received:', email );
   console.log('Action: ', action);
   
   let email_subject = '';
   let email_body = '';

   if (action === 'otp') {
    email_subject = 'Email OTP verified';
    email_body = '\nWelcome to joining BJP. \n  Your email is successfully verified. \nPlease proceed to complete your registration.';
   } else {
    email_subject = 'Greetings from Sanjay Jaiswal';
    email_body = `\nWelcome to joining BJP. \n I am glad to see you here and look forward to your active participation. `
   }

   try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: email_subject,
      text: email_body
    };
 
    await transporter.sendMail(mailOptions);
    return;
   } catch (err) {
    //console.error("Send Greeting email Error: ", err);
    throw new Error(err); // throw the error to catch in Controller, instead of return
    //throw new Error("Failed to send greeting email"); // throw the error to catch in Controller, instead of return
  }
};
