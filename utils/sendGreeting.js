const nodemailer = require('nodemailer');
const transporter = require('../config/mailer');


module.exports = async function sendGreeting(email, action, clientName,
  clientAppName) {

  console.log('sendGreeting: \nHost: ', process.env.SMTP_HOST);
  console.log('From Emailid: ', process.env.SMTP_USER);
  console.log('To Email id received:', email);
  console.log('Action: ', action);
  console.log('Client Name: ', clientName);
  console.log('Client App Name: ', clientAppName);

  let email_subject = '';
  let email_body = '';

  if (action === 'otp') {
    email_subject = `Email OTP verified - ${clientAppName}`;
    email_body = `
Welcome to joining ${clientAppName}.

Your email is successfully verified.
Please proceed to complete your registration.
`;
  } else {
    email_subject = `Greetings from ${clientName}`;
    email_body = `
Welcome to joining ${clientAppName}.

I am glad to see you here and look forward to your active participation.
`;
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
