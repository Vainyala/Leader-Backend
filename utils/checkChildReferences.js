// 12/12/2025
// Updated return value as customs message -- name of the model

// utils/checkChildReferences.js
// Check if there are child references in these Models where regd_mobile_no is the foreign key,
// Don't allow deletion of the master document from LeaderCoordinates collection

const User = require('../models/User');
const LeaderSocialMedia = require('../models/LeaderSocialMedia');
// const LeaderCoordinates = require('../models/LeaderCoordinates');
const LeaderEducation = require('../models/LeaderEducation');
const LeaderPermAddress = require('../models/LeaderPermAddress');
const LeaderPresentAddress = require('../models/LeaderPresentAddress');
const LeaderPersonalDetails = require('../models/LeaderPersonalDetails');
const LeaderTimeline = require('../models/LeaderTimeline');

async function hasChildReferences(leader_regd_mobile_no) {
  const references = [];

  if (await LeaderSocialMedia.exists({ leader_regd_mobile_no })) {
    references.push('SocialMedia');
  }
  if (await LeaderEducation.exists({ leader_regd_mobile_no })) {
    references.push('Education');
  }
  if (await LeaderPermAddress.exists({ leader_regd_mobile_no })) {
    references.push('PermanentAddress');
  }
  if (await LeaderPresentAddress.exists({ leader_regd_mobile_no })) {
    references.push('PresentAddress');
  }
  if (await LeaderPersonalDetails.exists({ leader_regd_mobile_no })) {
    references.push('PersonalDetails');
  }
  if (await LeaderTimeline.exists({ leader_regd_mobile_no })) {
    references.push('Timeline');
  }
  return references; // returns an array of model names that have child references
}

module.exports = hasChildReferences;


