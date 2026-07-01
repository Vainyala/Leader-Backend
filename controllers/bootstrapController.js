// bootstrapController.js
// Validates app_key
// captures Device Info and stores into deviceinfo collection for audit purpose
// Updated on 12/11/2025

const CryptoService = require('../services/cryptoService');
const AppOwner = require('../models/AppOwner');
const BootstrapLog = require('../models/BootstrapLog');
const DeviceInfo = require('../models/DeviceInfo');
const generateAppKey = require('../utils/generateAppKey');
const UpdatesTrackerModel = require('../models/UpdatesTrackerModel');

console.log(' bootstrapController loaded');

exports.bootstrap = async (req, res) => {
  const incomingKey = req.headers['x-app-key']; //|| req.headers['x-app_key'];
  //const expectedKey = generateAppKey();
console.log(' bootstrapController: Incoming app-key:', incomingKey);
  // Lookup AppOwner
      const owner = await AppOwner.findOne({ app_key: incomingKey });
      console.log('bootstrapController: owner found: ', owner);
      if (!owner) {
        console.log('AppOwner not found');
      }
      const expectedKey = owner.app_key;

  console.log('req.headers: ', req.headers);
  console.log(' bootstrapController: Incoming app-key:', incomingKey);
  console.log(' boostrapController: Generated app-key:', expectedKey);

  let result = 'failure';
  let encryptedMobile = null;
  let decryptedMobile = null;

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const deviceInfo = `${req.useragent?.platform || 'unknown'} - ${req.useragent?.browser || 'unknown'}`;
  let device_fingerprint = req.headers['x-device-fingerprint'] || 'unknown';

  /*if (!/^[a-f0-9]{64}$/.test(fingerprint)) {
    fingerprint = 'invalid-format';
  }
  */
 
  console.log('Device User Agent: ', deviceInfo);
  console.log('Device Fingerprint: ', device_fingerprint);
  
  const {   user_email_id,
            device_aaid,
            device_manufacturer_name,
            device_model,
            device_brand_name,
            device_os_version,
            device_api_level,
            device_type,
            device_app_version,
            device_type_str,
            device_os_codename,
            device_screen_density
            } = req.body;

  try {
    if (incomingKey !== expectedKey) throw new Error('Invalid app key');

    //const owner = await AppOwner.findOne({ app_key: incomingKey });
    if (!owner) throw new Error('AppOwner not found');

    decryptedEmail = CryptoService.decrypt(owner.client_regd_email);
    decryptedMobile = CryptoService.decrypt(owner.client_regd_mobile_no);
    encryptedMobile = owner.client_regd_mobile_no;

    console.log('bootStrapController: bootStrap: decryptedMobile: :', decryptedMobile, ' dcryptedEmail: ', decryptedEmail);

    result = 'success';
    res.json({
      timestamp: new Date().toISOString(),
      AppOwnerInfo: {
        client_id: owner.client_id,
        client_name: owner.client_name,
        client_app_name: owner.client_app_name,
        client_email: decryptedEmail,
        client_mobile: decryptedMobile
      }
    });
  } catch (err) {
    console.error(`[${new Date().toISOString()}]  Bootstrap error:`, err.stack);
    res.status(403).json({ error: err.message });
  } finally {
    try {
      const result = await BootstrapLog.findOne(
            { client_regd_mobile_no: decryptedMobile, device_aaid: device_aaid, device_fingerprint: device_fingerprint }
      );
      if (result) {
        console.log(`[bootstrap controller]: BootstrapLog Collection:  `+
          ` Device already exists for ${decryptedMobile}, 
          AAID: ${device_aaid} FINGERPRINT: ${device_fingerprint}` );
      } else {

        await BootstrapLog.create({
          app_key: incomingKey,
          bootstrat_status: result,
          client_regd_mobile_no: decryptedMobile,
          user_email_id,
          device_ip_address: ip,
          device_info: deviceInfo,
          device_fingerprint: device_fingerprint,
          device_aaid,
          device_manufacturer_name,
          device_model,
          device_brand_name,
          device_os_version,
          device_api_level,
          device_type,
          device_app_version,
          device_type_str,
          device_os_codename,
          device_screen_density
        });
        console.log('BootstrapLog document created successfully');
      }

      // Create device level document in UpdateTrackerModel Collection
      const tracker = await UpdatesTrackerModel.findOne(
            { client_regd_mobile_no: decryptedMobile, device_aaid: device_aaid, device_fingerprint: device_fingerprint }
      );
      if (tracker) {
        console.log(`[bootstrap controller]: UpdateTrackerModel Collection: `+
          ` Device already exists for ${decryptedMobile}, AAID: ${device_aaid} 
          FINGERPRINT: ${device_fingerprint}` );
      } else {

        await UpdatesTrackerModel.create({
          client_regd_mobile_no: decryptedMobile,
          device_aaid: device_aaid,
          device_fingerprint: device_fingerprint
        })
        console.log('UpdateTrackerModel document created successfully');
      }
    } catch (logErr) {
      console.error(`[${new Date().toISOString()}]  Failed to log bootstrap attempt:`, logErr.stack);
    }
  }
};
















// // bootstrapController.js
// // Validates app_key
// // captures Device Info and stores into deviceinfo collection for audit purpose
// // Updated on 12/11/2025

// const CryptoService = require('../services/cryptoService');
// const AppOwner = require('../models/AppOwner');
// const BootstrapLog = require('../models/BootstrapLog');
// const DeviceInfo = require('../models/DeviceInfo');
// const generateAppKey = require('../utils/generateAppKey');
// const UpdatesTrackerModel = require('../models/UpdatesTrackerModel');

// console.log(' bootstrapController loaded');

// exports.bootstrap = async (req, res) => {
//   const incomingKey = req.headers['x-app-key'] || req.headers['x-app_key'];
//   const expectedKey = generateAppKey();

//   console.log(' userDeviceinfoController: Incoming app-key:', incomingKey);
//   console.log(' userDeviceinfoController: Generated app-key:', expectedKey);

//   let result = 'failure';
//   let encryptedMobile = null;
//   let decryptedMobile = null;

//   const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
//   const deviceInfo = `${req.useragent?.platform || 'unknown'} - ${req.useragent?.browser || 'unknown'}`;
//   let device_fingerprint = req.headers['x-device-fingerprint'] || 'unknown';

//   /*if (!/^[a-f0-9]{64}$/.test(fingerprint)) {
//     fingerprint = 'invalid-format';
//   }
//   */
 
//   console.log('Device User Agent: ', deviceInfo);
//   console.log('Device Fingerprint: ', device_fingerprint);
  
//   const {   user_email_id,
//             device_aaid,
//             device_manufacturer_name,
//             device_model,
//             device_brand_name,
//             device_os_version,
//             device_api_level,
//             device_type,
//             device_app_version,
//             device_type_str,
//             device_os_codename,
//             device_screen_density
//             } = req.body;

//   try {
//     if (incomingKey !== expectedKey) throw new Error('Invalid app key');

//     const owner = await AppOwner.findOne({ app_key: incomingKey });
//     if (!owner) throw new Error('AppOwner not found');

//     decryptedEmail = CryptoService.decrypt(owner.client_regd_email);
//     decryptedMobile = CryptoService.decrypt(owner.client_regd_mobile_no);
//     encryptedMobile = owner.client_regd_mobile_no;

//     console.log('bootStrapController: bootStrap: decryptedMobile: :', decryptedMobile, ' dcryptedEmail: ', decryptedEmail);

//     result = 'success';
//     res.json({
//       timestamp: new Date().toISOString(),
//       AppOwnerInfo: {
//         client_id: owner.client_id,
//         client_name: owner.client_name,
//         client_app_name: owner.client_app_name,
//         client_email: decryptedEmail,
//         client_mobile: decryptedMobile
//       }
//     });
//   } catch (err) {
//     console.error(`[${new Date().toISOString()}]  Bootstrap error:`, err.stack);
//     res.status(403).json({ error: err.message });
//   } finally {
//     try {
//       const result = await BootstrapLog.findOne(
//             { client_regd_mobile_no: decryptedMobile, device_aaid: device_aaid, device_fingerprint: device_fingerprint }
//       );
//       if (result) {
//         console.log(`[bootstrap controller]: BootstrapLog Collection:  `+
//           ` Device already exists for ${decryptedMobile}, 
//           AAID: ${device_aaid} FINGERPRINT: ${device_fingerprint}` );
//       } else {

//         await BootstrapLog.create({
//           app_key: incomingKey,
//           bootstrat_status: result,
//           client_regd_mobile_no: decryptedMobile,
//           user_email_id,
//           device_ip_address: ip,
//           device_info: deviceInfo,
//           device_fingerprint: device_fingerprint,
//           device_aaid,
//           device_manufacturer_name,
//           device_model,
//           device_brand_name,
//           device_os_version,
//           device_api_level,
//           device_type,
//           device_app_version,
//           device_type_str,
//           device_os_codename,
//           device_screen_density
//         });
//         console.log('BootstrapLog document created successfully');
//       }

//       // Create device level document in UpdateTrackerModel Collection
//       const tracker = await UpdatesTrackerModel.findOne(
//             { client_regd_mobile_no: decryptedMobile, device_aaid: device_aaid, device_fingerprint: device_fingerprint }
//       );
//       if (tracker) {
//         console.log(`[bootstrap controller]: UpdateTrackerModel Collection: `+
//           ` Device already exists for ${decryptedMobile}, AAID: ${device_aaid} 
//           FINGERPRINT: ${device_fingerprint}` );
//       } else {

//         await UpdatesTrackerModel.create({
//           client_regd_mobile_no: decryptedMobile,
//           device_aaid: device_aaid,
//           device_fingerprint: device_fingerprint
//         })
//         console.log('UpdateTrackerModel document created successfully');
//       }
//     } catch (logErr) {
//       console.error(`[${new Date().toISOString()}]  Failed to log bootstrap attempt:`, logErr.stack);
//     }
//   }
// };

