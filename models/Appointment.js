const mongoose = require('mongoose');
const SerialTracker = require('./SerialTracker');


// ============================================================
// Appointment Status Values
// ============================================================

const STATUS_VALUES = [
  'Open',
  'In Progress',
  'Rejected',
  'Resolved',
  'Cancelled'
];


const AppointmentSchema = new mongoose.Schema(
  {
    leader_regd_mobile_no: {
      type: String,
      required: true
    },

    user_email_id: {
      type: String,
      required: true
    },

    // Auto-generated
    regn_no: {
      type: String,
      unique: true
    },

    applicant_mobile: String,

    applicant_name: String,

    fh_name: String,

    address: String,

    pincode: String,

    post_office: String,

    district: String,

    state: String,

    req_meeting_date: String,

    appr_meeting_date: {
      type: String,
      default: ''
    },

    appr_meeting_time: {
      type: String,
      default: ''
    },

    meeting_purpose: String,

    // ========================================================
    // Appointment Status
    // ========================================================

    status: {
      type: String,
      enum: STATUS_VALUES,
      default: 'Open'
    },

    action_taken_comments: {
      type: String,
      default: ''
    },

    updated_by: {
      type: String,
      default: ''
    },

    device_ip_number: String
  },
  {
    timestamps: true
  }
);


// ============================================================
// Auto-generate Appointment Registration Number
// ============================================================

AppointmentSchema.pre('save', async function (next) {

  if (this.regn_no) {
    return next();
  }

  try {

    let tracker = await SerialTracker.findOne({
      key: 'appmnt'
    });


    if (!tracker) {

      tracker = await SerialTracker.create({
        key: 'appmnt',
        last_serial: 10000
      });
    }


    tracker.last_serial += 1;

    await tracker.save();


    this.regn_no =
      `appmnt${tracker.last_serial}`;


    next();

  } catch (err) {

    next(err);
  }
});


module.exports = mongoose.model(
  'Appointment',
  AppointmentSchema
);









// const mongoose = require('mongoose');
// const SerialTracker = require('./SerialTracker');

// const AppointmentSchema = new mongoose.Schema({
//   leader_regd_mobile_no: { type: String, required: true },
//   user_email_id: { type: String, required: true },
//   regn_no: { type: String, unique: true }, // auto-generated
//   applicant_mobile: String,
//   applicant_name: String,
//   fh_name: String,
//   address: String,
//   pincode: String,
//   post_office: String,
//   district: String,
//   state: String,
//   req_meeting_date: String,
//   appr_meeting_date: { type: String, default: '' },
//   appr_meeting_time: { type: String, default: '' },
//   meeting_purpose: String,
//   status: { type: String, default: 'Open' },
//   action_taken_comments: { type: String, default: '' },
//   updated_by: { type: String, default: '' },
//   device_ip_number: String
// }, { timestamps: true });

// // Auto-generate regn_no before saving
// AppointmentSchema.pre('save', async function (next) {
//   if (this.regn_no) return next();

//   try {
//     let tracker = await SerialTracker.findOne({ key: 'appmnt' });

//     if (!tracker) {
//       tracker = await SerialTracker.create({ key: 'appmnt', last_serial: 10000 });
//     }

//     tracker.last_serial += 1;
//     await tracker.save();

//     this.regn_no = `appmnt${tracker.last_serial}`;
//     next();
//   } catch (err) {
//     next(err);
//   }
// });


// module.exports = mongoose.model('Appointment', AppointmentSchema);
