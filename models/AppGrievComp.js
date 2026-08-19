const mongoose = require('mongoose');
const SerialTracker = require('./SerialTracker');

const AppGrievCompSchema = new mongoose.Schema({
  leader_regd_mobile_no: { type: String, required: true },
  user_email_id: { type: String, required: true },
  regn_no: { type: String, unique: true }, // auto-generated
  request_type: String,
  applicant_mobile: String,
  applicant_name: String,
  fh_name: String,
  address: String,
  pincode: String,
  post_office: String,
  district: String,
  state: String,
  description: String,
  status: { type: String, default: 'Open' },
  action_taken_comments: { type: String, default: '' },
  updated_by: { type: String, default: '' },
  device_ip_number: String
}, { timestamps: true });

AppGrievCompSchema.pre("save", async function (next) {
  if (this.regn_no) return next();

  try {

    let key = "";
    let prefix = "";

    switch ((this.request_type || "").toLowerCase()) {

      case "grievance":
        key = "griev";
        prefix = "griev";
        break;

      case "appeal":
        key = "appe";
        prefix = "appe";
        break;

      case "complaint":
        key = "compl";
        prefix = "compl";
        break;

      default:
        return next(new Error("Invalid request_type"));
    }

    let tracker = await SerialTracker.findOne({ key });

    if (!tracker) {
      tracker = await SerialTracker.create({
        key,
        last_serial: 9999
      });
    }

    tracker.last_serial += 1;
    await tracker.save();

    this.regn_no = `${prefix}${tracker.last_serial}`;

    next();

  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('AppGrievComp', AppGrievCompSchema);





// Auto-generate regn_no before saving
// AppGrievCompSchema.pre('save', async function (next) {
//   if (this.regn_no) return next();

//   try {
//     let tracker = await SerialTracker.findOne({ key: 'griev' });

//     if (!tracker) {
//       tracker = await SerialTracker.create({ key: 'griev', last_serial: 9999 });
//     }

//     tracker.last_serial += 1;
//     await tracker.save();

//     this.regn_no = `griev${tracker.last_serial}`;
//     next();
//   } catch (err) {
//     next(err);
//   }
// });


