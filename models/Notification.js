// models/Notification.js
const mongoose = require('mongoose');
const { getISTDate } = require('../utils/helperFunctions'); // same IST helper used by the other models

const notificationSchema = new mongoose.Schema(
  {
    // Recipient (the app user who should see this in the Notification tab)
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    leader_regd_mobile_no: { type: String, default: null },

    title: { type: String, required: true },
    body: { type: String, required: true },

    // feedback | feedback_update | appointment | appointment_update |
    // grievance | grievance_update | media | media_update | leader_update ...
    type: { type: String, default: 'general' },

    // Used by the app to open the right screen when the notification is tapped
    // (regn_no, uf_case_no, media id, or the leader section that changed)
    reference_id: { type: String, default: null },

    data: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: { currentTime: getISTDate }
  }
);

// Fast "my notifications, latest first"
notificationSchema.index({ user_id: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
