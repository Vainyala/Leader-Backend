const cron = require('node-cron');
const AuditLog = require('../models/auditLog');
const { Parser } = require('json2csv');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your.email@gmail.com',
    pass: 'your-app-password'
  }
});

cron.schedule('0 8 * * *', async () => {
  try {
    const logs = await AuditLog.find({ timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }).lean();
    const parser = new Parser();
    const csv = parser.parse(logs);

    await transporter.sendMail({
      from: 'your.email@gmail.com',
      to: 'nutantekdevops@gmail.com',
      subject: 'Daily Audit Log Export',
      text: 'Attached is the daily audit log export.',
      attachments: [{ filename: 'audit_logs.csv', content: csv }]
    });

    console.log('✅ Audit log emailed to nutantekdevops@gmail.com');
  } catch (err) {
    console.error('❌ Audit export failed:', err.message);
  }
});

