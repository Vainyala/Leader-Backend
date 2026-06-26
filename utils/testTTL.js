const Registeruser = require('../models/Registeruser');

async function simulateTTLExpiry(email) {
  const expiredTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago

  const user = await Registeruser.create({
    email,
    email_otp: '999999',
    isUserRegistered: false,
    createdAt: expiredTime
  });

  console.log('Inserted expired Registeruser:', user);

  setTimeout(async () => {
    const exists = await Registeruser.findOne({ email });
    console.log('Exists after TTL cleanup:', !!exists);
  }, 5000); // Give MongoDB a few seconds to clean
}

simulateTTLExpiry('expired@example.com');
