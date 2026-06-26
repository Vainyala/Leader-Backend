const admin = require("firebase-admin");
console.log("admin:",admin);
const path = require("path");

const serviceAccount = require(
  path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT)
);

try {
  admin.app();
} catch (error) {
  admin.initializeApp({
    credential: admin.cert(serviceAccount),
  });
}

const sendNotification = async ({
  token,
  title,
  body,
  type = "general",
}) => {
  const message = {
    token,
    notification: {
      title,
      body,
    },
    data: {
      type,
      title,
      body,
    },
    android: {
      priority: "high",
    },
  };

  return await admin.messaging().send(message);
};

module.exports = { sendNotification };






// const admin = require("firebase-admin");
// const path = require("path");

// const serviceAccount = require(
//   path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT)
// );

// // if (!admin.apps.length) {
// //   admin.initializeApp({
// //     credential: admin.credential.cert(serviceAccount),
// //   })
// // }
// console.log("Initializing Firebase Admin...:", admin.apps.length);
// try {
//   admin.app();
// } catch (error) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//   });
// }

// const sendNotification = async ({
//   token,
//   title,
//   body,
//   type = "general",
// }) => {
//   const message = {
//     token,
//     notification: {
//       title,
//       body,
//     },
//     data: {
//       type,
//       title,
//       body,
//     },
//     android: {
//       priority: "high",
//     },
//   };

//   return await admin.messaging().send(message);
// };

// module.exports = { sendNotification };