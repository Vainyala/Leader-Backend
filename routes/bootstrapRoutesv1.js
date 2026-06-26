const express = require('express');
const router = express.Router();
const CryptoService = require('../services/cryptoService');
const AppOwner = require('../models/AppOwner');
const BootstrapLog = require('../models/BootstrapLog');
const generateAppKey = require('../utils/generateAppKey');

console.log(' Bootstrap router loaded');

router.post('/', async (req, res) => {
  const incomingKey = req.headers['x-app-key'] || req.headers['x-app_key'];
  const expectedKey = generateAppKey();

  console.log(' bootstrapRoutes.js: Incoming app-key:', incomingKey);
  console.log(' bootstrapRoutes.js: Generated app-key:', expectedKey);

  let result = 'failure';
  let encryptedMobile = null;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const deviceInfo = `${req.useragent?.platform || 'unknown'} - ${req.useragent?.browser || 'unknown'}`;
  let fingerprint = req.headers['x-device-fingerprint'] || 'unknown';

  if (!/^[a-f0-9]{64}$/.test(fingerprint)) {
    fingerprint = 'invalid-format';
  }

  console.log('Device Info: ', deviceInfo);
  console.log('Device Fingerprint: ', fingerprint);
  
  try {
    if (incomingKey !== expectedKey) throw new Error('Invalid app key');

    const owner = await AppOwner.findOne({ app_key: incomingKey });
    if (!owner) throw new Error('AppOwner not found');

    const decryptedEmail = CryptoService.decrypt(owner.client_regd_email);
    const decryptedMobile = CryptoService.decrypt(owner.client_regd_mobile_no);
    encryptedMobile = owner.client_regd_mobile_no;

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
    console.log('Im here ...', owner.client_name, '  :  ', owner.client_app_name);

  } catch (err) {
    console.error(`[${new Date().toISOString()}]  Bootstrap error:`, err.stack);
    res.status(403).json({ error: err.message });
  } finally {
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
      console.error(`[${new Date().toISOString()}]  Failed to log bootstrap attempt:`, logErr.stack);
    }
  }
});

module.exports = router;
