const mongoose = require('mongoose');
const LeaderCoordinates = require('./LeaderCoordinates');
const { getISTDate } = require('../utils/helperFunctions');

const mediaCornerSchema = new mongoose.Schema(
  {
    leader_regd_mobile_no: {
      type: String,
      required: true
    },

    media_header: {
      type: String,
      required: true
    },

    media_narration: {
      type: String,
      required: true
    },

    media_url: {
      type: String,
      default: null
    },

    media_type: {
      type: String,
      required: true
    },

    media_file: {
      type: String,
      default: null
    },

    user_input: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No'
    },

    custom_text: {
      type: String,
      default: null
    },

    // NEW
    // Used only when user_input = Yes
    from_date: {
      type: Date,
      default: null
    },

    // NEW
    // Used only when user_input = Yes
    to_date: {
      type: Date,
      default: null
    },

    media_timestamp: {
      type: String,
      default: null
    }
  },
  {
    timestamps: {
      currentTime: getISTDate
    }
  }
);


/**
 * Validate Media Corner before saving
 */
mediaCornerSchema.pre('save', async function (next) {
  try {

    // --------------------------------------------------
    // Check leader exists
    // --------------------------------------------------
    const exists = await LeaderCoordinates.findOne({
      leader_regd_mobile_no: this.leader_regd_mobile_no
    });

    if (!exists) {
      return next(
        new Error(
          `leader_regd_mobile_no ${this.leader_regd_mobile_no} not found in LeaderCoordinates`
        )
      );
    }


    // --------------------------------------------------
    // Normalize user_input
    // --------------------------------------------------
    if (this.user_input) {
      this.user_input =
        String(this.user_input).trim().toLowerCase() === 'yes'
          ? 'Yes'
          : 'No';
    }


    // --------------------------------------------------
    // If user_input = Yes
    // custom_text, from_date and to_date are required
    // --------------------------------------------------
    if (this.user_input === 'Yes') {

      if (
        !this.custom_text ||
        !this.custom_text.trim()
      ) {
        return next(
          new Error(
            'custom_text is required when user_input is Yes'
          )
        );
      }

      if (!this.from_date) {
        return next(
          new Error(
            'from_date is required when user_input is Yes'
          )
        );
      }

      if (!this.to_date) {
        return next(
          new Error(
            'to_date is required when user_input is Yes'
          )
        );
      }

      if (this.from_date > this.to_date) {
        return next(
          new Error(
            'from_date cannot be greater than to_date'
          )
        );
      }
    }


    // --------------------------------------------------
    // If user_input = No
    // date fields are not required
    // --------------------------------------------------
    if (this.user_input === 'No') {
      this.from_date = null;
      this.to_date = null;
      this.custom_text = null;
    }

    next();

  } catch (error) {
    next(error);
  }
});


module.exports = mongoose.model(
  'mediaCorner',
  mediaCornerSchema
);
















// const mongoose = require('mongoose');
// const LeaderCoordinates = require('./LeaderCoordinates');
// const {getISTDate} = require('../utils/helperFunctions'); // Get IST Date function

// const mediaCornerSchema = new mongoose.Schema({
//   leader_regd_mobile_no: { type: String, required: true },
//   media_header: String,
//   media_narration: String,
//   media_url: String,
//   media_type: String,
//   media_file: String,
//   user_input: { type: String, enum: ['Yes', 'No'], default: 'No' },   // NEW
//   custom_text: { type: String, default: null },                       // NEW (btn name)
//   media_timestamp: String,
// }, {
//   timestamps: { currentTime: getISTDate }
// });

// mediaCornerSchema.pre('save', async function (next) {
//   const exists = await LeaderCoordinates.findOne({ leader_regd_mobile_no: this.leader_regd_mobile_no });
//   if (!exists) {
//     return next(new Error(`leader_regd_mobile_no ${this.leader_regd_mobile_no} not found in LeaderCoordinates`));
//   }

//   // NEW: LN + user_input=yes requires a non-empty custom_text
//   if (this.media_type === 'LN' && this.user_input === 'yes' && (!this.custom_text || !this.custom_text.trim())) {
//     return next(new Error('custom_text is required when media_type is LN and user_input is yes'));
//   }

//   next();
// });
// module.exports = mongoose.model('mediaCorner', mediaCornerSchema);












