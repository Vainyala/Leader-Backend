// #!/usr/bin/env node

// // generate-app-key.js
// const crypto = require('crypto');
// const readline = require('readline');

// // CLI prompt setup
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

// // Prompt user for inputs
// rl.question('Order ID: ', (orderId) => {
//   rl.question('Order Date (timestamp): ', (orderDate) => {
//     rl.question('App Name: ', (appName) => {
//       const raw = `${orderId}:${orderDate}:${appName}`;
//       const hash = crypto.createHash('sha256').update(raw).digest('hex');

//       console.log('\n🔐 Raw String:', raw);
//       console.log('✅ x-app-key:', hash);
//       rl.close();
//     });
//   });
// });

