const CryptoService = require('../services/cryptoService');
const AppOwner = require('../models/AppOwner');
//const BootstrapLog = require('../models/BootstrapLog');
//const generateAppKey = require('../utils/generateAppKey');

console.log('validateAppKey middleware loaded');

module.exports = async function validateAppKey(req, res, next) {
  console.log('req.headers: ', req.headers);

  const incomingKey = req.headers['x-app-key']; //|| req.headers['x-app_key'];
  //const expectedKey = generateAppKey();

    // Lookup AppOwner
    const owner = await AppOwner.findOne({ app_key: incomingKey });
    if (!owner) {
      throw new Error('AppOwner not found');
    }

    const expectedKey = owner.app_key;


  let user_email_id;

  const method = req.method;
  console.log('validateAppKey: Method: ', method);
  //console.log('validateAppKey: Body Params: ', req.body);

  
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const deviceInfo = `${req.useragent?.platform || 'unknown'} - ${req.useragent?.browser || 'unknown'}`;
  const device_aaid = req.headers['x-device-aaid'] || 'unknown';
  const device_fingerprint = req.headers['x-device-fingerprint'] || 'unknown';

  if (method === 'GET' || method === 'DELETE') {
    console.log('validateAppKey: Query Params: ', req.query);
    leader_regd_mobile_no = req.query.leader_regd_mobile_no;
    user_email_id = req.query.user_email_id;
  } else if (!req.body || Object.keys(req.body).length === 0) {
    console.warn(`[${new Date().toISOString()}] validateAppKey: req.body is empty`);
    //console.log('validateAppKey: Body Params: ', req.body);
  } else {
    leader_regd_mobile_no = req.body.leader_regd_mobile_no;
    user_email_id = req.body.user_email_id;
    console.log('validateAppKey: Body Params: ', req.body);
    console.log('validateAppKey: leader_regd_mobile_no: ', leader_regd_mobile_no);
  }

  if ((user_email_id || '').toLowerCase().trim() !== (user_email_id || '').toLowerCase().trim()) {
    return res.status(404).json({ message: 'Invalid User Email Id' });
  }

  console.log(' Incoming app-key:', incomingKey);
  console.log(' Generated app-key:', expectedKey);
  console.log(' Device User Agent:', deviceInfo);
  console.log(' Device AAID:', device_aaid);
  console.log(' Device Fingerprint:', device_fingerprint);

  console.log('validateAppKey->user_emailId: ', user_email_id);

  let result = 'failure';
  let encryptedMobile = null;
  
  try {
    // Validate app key
    if (incomingKey !== expectedKey) {
      throw new Error('Invalid app key');
    }

     // Decrypt and compare email
    const decryptedEmail = CryptoService.decrypt(owner.client_regd_email);
    const client_regd_mobile_no = CryptoService.decrypt(owner.client_regd_mobile_no);
    
    console.log(' Decrypted Client email:', decryptedEmail, ', Client Regd. Mobile No.:' , client_regd_mobile_no);

    req.user_type = decryptedEmail === user_email_id ? 'admin' : 'user';
    console.log(' Assigned user_type:', req.user_type);

    result = 'success';

    // Attach client_regd_mobil_no, aaid and fingerprint to request to make it globally available
    req.client_regd_mobile_no = client_regd_mobile_no;
    req.device_aaid = device_aaid;
    req.device_fingerprint = device_fingerprint
    console.log('validateAppKey: Mapped to req: device_aaid: ', req.device_aaid, ' ,device_fingerprint: ', device_fingerprint);


    // Update the device_data_refresh flag in BootstrapLog Collection as False
    // Assuming now GET API is called and any data change is fetched by the User
    
    next();
} catch (err) {
    console.error(`[${new Date().toISOString()}] validateAppKey error:`, err.stack);
    return res.status(403).json({ error: err.message });
  } /*finally {
    try {
      await BootstrapLog.create({
        app_key: incomingKey,
        result,
        client_regd_mobile_no: encryptedMobile,
        ip_address: ip,
        device_info: deviceInfo,
        device_fingerprint: fingerprint
      });
    } catch (logErr) {
      console.error(`[${new Date().toISOString()}] Failed to log validateAppKey attempt:`, logErr.stack);
    }
  } */ // Commented on 2/Jan/2025  as dont see any proper rationale to store this incomplete info
};














// const CryptoService = require('../services/cryptoService');
// const AppOwner = require('../models/AppOwner');
// //const BootstrapLog = require('../models/BootstrapLog');
// const generateAppKey = require('../utils/generateAppKey');

// console.log('validateAppKey middleware loaded');

// module.exports = async function validateAppKey(req, res, next) {
//   const incomingKey = req.headers['x-app-key'] || req.headers['x-app_key'];
//   const expectedKey = generateAppKey();

//   let user_email_id;

//   const method = req.method;
//   console.log('validateAppKey: Method: ', method);
//   //console.log('validateAppKey: Body Params: ', req.body);

  
//   const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
//   const deviceInfo = `${req.useragent?.platform || 'unknown'} - ${req.useragent?.browser || 'unknown'}`;
//   const device_aaid = req.headers['x-device-aaid'] || 'unknown';
//   const device_fingerprint = req.headers['x-device-fingerprint'] || 'unknown';

//   if (method === 'GET' || method === 'DELETE') {
//     console.log('validateAppKey: Query Params: ', req.query);
//     leader_regd_mobile_no = req.query.leader_regd_mobile_no;
//     user_email_id = req.query.user_email_id;
//   } else if (!req.body || Object.keys(req.body).length === 0) {
//     console.warn(`[${new Date().toISOString()}] validateAppKey: req.body is empty`);
//     //console.log('validateAppKey: Body Params: ', req.body);
//   } else {
//     leader_regd_mobile_no = req.body.leader_regd_mobile_no;
//     user_email_id = req.body.user_email_id;
//     console.log('validateAppKey: Body Params: ', req.body);
//     console.log('validateAppKey: leader_regd_mobile_no: ', leader_regd_mobile_no);
//   }

//   if ((user_email_id || '').toLowerCase().trim() !== (user_email_id || '').toLowerCase().trim()) {
//     return res.status(404).json({ message: 'Invalid User Email Id' });
//   }

//   console.log(' Incoming app-key:', incomingKey);
//   console.log(' Generated app-key:', expectedKey);
//   console.log(' Device User Agent:', deviceInfo);
//   console.log(' Device AAID:', device_aaid);
//   console.log(' Device Fingerprint:', device_fingerprint);

//   console.log('validateAppKey->user_emailId: ', user_email_id);

//   let result = 'failure';
//   let encryptedMobile = null;
  
//   try {
//     // Validate app key
//     if (incomingKey !== expectedKey) {
//       throw new Error('Invalid app key');
//     }

//      // Lookup AppOwner
//     const owner = await AppOwner.findOne({ app_key: incomingKey });
//     if (!owner) {
//       throw new Error('AppOwner not found');
//     }

//     // Decrypt and compare email
//     const decryptedEmail = CryptoService.decrypt(owner.client_regd_email);
//     const client_regd_mobile_no = CryptoService.decrypt(owner.client_regd_mobile_no);
    
//     console.log(' Decrypted Client email:', decryptedEmail, ', Client Regd. Mobile No.:' , client_regd_mobile_no);

//     req.user_type = decryptedEmail === user_email_id ? 'admin' : 'user';
//     console.log(' Assigned user_type:', req.user_type);

//     result = 'success';

//     // Attach client_regd_mobil_no, aaid and fingerprint to request to make it globally available
//     req.client_regd_mobile_no = client_regd_mobile_no;
//     req.device_aaid = device_aaid;
//     req.device_fingerprint = device_fingerprint
//     console.log('validateAppKey: Mapped to req: device_aaid: ', req.device_aaid, ' ,device_fingerprint: ', device_fingerprint);


//     // Update the device_data_refresh flag in BootstrapLog Collection as False
//     // Assuming now GET API is called and any data change is fetched by the User
    
//     next();
// } catch (err) {
//     console.error(`[${new Date().toISOString()}] validateAppKey error:`, err.stack);
//     return res.status(403).json({ error: err.message });
//   } /*finally {
//     try {
//       await BootstrapLog.create({
//         app_key: incomingKey,
//         result,
//         client_regd_mobile_no: encryptedMobile,
//         ip_address: ip,
//         device_info: deviceInfo,
//         device_fingerprint: fingerprint
//       });
//     } catch (logErr) {
//       console.error(`[${new Date().toISOString()}] Failed to log validateAppKey attempt:`, logErr.stack);
//     }
//   } */ // Commented on 2/Jan/2025  as dont see any proper rationale to store this incomplete info
// };

