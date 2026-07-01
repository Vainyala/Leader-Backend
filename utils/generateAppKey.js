/*require('dotenv').config();
const crypto = require('crypto');

function generateAppKey() {
  const raw = `${process.env.ORDER_ID}:${process.env.ORDER_DATE}:${process.env.APP_NAME}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
    
  console.log('Raw String Value:', raw);
  console.log('Hash Value:', hash);

  return hash;
}

module.exports = generateAppKey;
*/




require('dotenv').config();
const CryptoService = require('../services/cryptoService');

function generateAppKey(orderId, orderDate, appName) {
  if (!orderId || !orderDate || !appName) {
    throw new Error('Missing required values for app key generation');
  }

  const raw = `${orderId}|${orderDate}|${appName}`;
  const hash = CryptoService.hash(raw);

  console.log('./utils/generateAppKey: Raw String Value:', raw);
  console.log('./utils/generateAppKey: Hash Value:', hash);

  return hash;
}

module.exports = generateAppKey;





// require('dotenv').config();
// const CryptoService = require('../services/cryptoService');

// function generateAppKey() {
//   const { ORDER_ID, ORDER_DATE, APP_NAME } = process.env;

//   if (!ORDER_ID || !ORDER_DATE || !APP_NAME) {
//     throw new Error('Missing required .env values for app key generation');
//   }

//   const raw = `${ORDER_ID}|${ORDER_DATE}|${APP_NAME}`;
//   const hash = CryptoService.hash(raw);
  
//   console.log('./utils/generateAppKey: Raw String Value:', raw);
//   console.log('./utils/generateAppKey: Hash Value:', hash);

//   return hash;
// }

// module.exports = generateAppKey;