const mongoose = require('mongoose');

// Import your models
const LeaderCoordinates = require('./models/LeaderCoordinates');
const LeaderSocialMedia = require('./models/LeaderSocialMedia');
const LeaderPersonalDetails = require('./models/LeaderPersonalDetails');
const LeaderEducation = require('./models/LeaderEducation');
const LeaderPermAddress = require('./models/LeaderPermAddress');
const LeaderPresentAddress = require('./models/LeaderPresentAddress');

// IST timestamp helper
const getISTDate = () => {
  const now = new Date();
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(now.getTime() + offset);
};

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/leaderdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const mobile = '9998887777';

const seedData = async () => {
  try {
    // Clear existing data for this mobile number (optional but recommended for idempotency)
    await Promise.all([
      LeaderCoordinates.deleteMany({ regd_mobile_no: mobile }),
      LeaderSocialMedia.deleteMany({ regd_mobile_no: mobile }),
      LeaderPersonalDetails.deleteMany({ regd_mobile_no: mobile }),
      LeaderEducation.deleteMany({ regd_mobile_no: mobile }),
      LeaderPermAddress.deleteMany({ regd_mobile_no: mobile }),
      LeaderPresentAddress.deleteMany({ regd_mobile_no: mobile })
    ]);

    // Insert fresh seed data
    await LeaderCoordinates.create({
      regd_mobile_no: mobile,
      title: "Dr.",
      member_photo: "sanjayjaiswal.jpeg",
      member_name: "Sanjay Jaiswal",
      party: "Bhartiya Janta Party",
      constituency: "Paschim Champaran",
      state: "Bihar",
      email_id: "sanjay.jaiswal@gmail.com",
      digital_sansad_url: "https://digitalsansad.gov.in",
      timestamp: getISTDate(),
      createdAt: getISTDate(),
      updatedAt: getISTDate()
    });

    await LeaderSocialMedia.create({
      regd_mobile_no: mobile,
      twitter: '@leaderhandle',
      facebook: 'fb.com/leaderprofile',
      instagram: '@leadergram',
      linkedin: 'linkedin.com/in/leader',
      createdAt: getISTDate(),
      updatedAt: getISTDate()
    });

    await LeaderPersonalDetails.create({
      regd_mobile_no: mobile,
      full_name: 'Nutan Tek',
      dob: new Date('1990-01-01'),
      gender: 'Female',
      email: 'nutan@example.com',
      marital_status: 'Single',
      nationality: 'Indian',
      createdAt: getISTDate(),
      updatedAt: getISTDate()
    });

    await LeaderEducation.create({
      regd_mobile_no: mobile,
      highest_qualification: 'M.Tech',
      university: 'IIT Delhi',
      year_of_passing: 2012,
      field_of_study: 'Computer Science',
      createdAt: getISTDate(),
      updatedAt: getISTDate()
    });

    await LeaderPermAddress.create({
      regd_mobile_no: mobile,
      address_line: '123 Civic Lane',
      city: 'Ghaziabad',
      state: 'Uttar Pradesh',
      pincode: '201001',
      country: 'India',
      createdAt: getISTDate(),
      updatedAt: getISTDate()
    });

    await LeaderPresentAddress.create({
      regd_mobile_no: mobile,
      address_line: '456 Tech Street',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      country: 'India',
      createdAt: getISTDate(),
      updatedAt: getISTDate()
    });

    console.log('✅ Seed data inserted successfully');
  } catch (err) {
    console.error('❌ Error inserting seed data:', err);
  } finally {
    mongoose.disconnect();
  }
};

seedData();
