// models/Leader.js
const mongoose = require('mongoose');

const leaderSchema = new mongoose.Schema({
  title: String,
  member_name: String,
  party: String,
  constituency: String,
  state: String,
  email_id: String,
  social_media: {
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String
  },
  birth_place: String,
  dob: Date,
  father_name: String,
  mother_name: String,
  children_count: Number,
  children_type: {
    son: Number,
    daughter: Number
  },
  profession: String,
  educational_qualifications: [
    {
      degree: String,
      college: String,
      university: String,
      place: String
    }
  ],
  permanent_address: {
    address1: String,
    address2: String,
    address3: String,
    pincode: String,
    state: String,
    landline: [
      {
        std_code: String,
        tel_number: Number
      }
    ]
  },
  mobile: [
    {
      mobile_number: Number
    }
  ],
  member_timeline: [
    {
      date: Date,
      title_position: {
        title: String,
        details: String
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Leader', leaderSchema);
