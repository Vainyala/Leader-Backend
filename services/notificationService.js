
const path = require("path");

const {
  initializeApp,
  getApps,
  cert,
} = require("firebase-admin/app");

const {
  getMessaging,
} = require("firebase-admin/messaging");


const serviceAccount = require(
  path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT)
);

let firebaseApp;

if (getApps().length === 0) {

  console.log("Initializing Firebase Admin...");

  firebaseApp = initializeApp({
    credential: cert(serviceAccount),
  });

  console.log(
    "Firebase Admin initialized successfully."
  );

} else {

  firebaseApp = getApps()[0];

  console.log(
    "Firebase Admin already initialized."
  );

}


/*
|--------------------------------------------------------------------------
| Send FCM Notification
|--------------------------------------------------------------------------
*/

const sendNotification = async ({
  token,
  title,
  body,
  type = "general",
}) => {

  const message = {

    token,

    notification: {
      title: String(title),
      body: String(body),
    },

    data: {
      type: String(type),
      title: String(title),
      body: String(body),
    },

    android: {
      priority: "high",
    },

  };


  console.log(
    "Sending notification:",
    message
  );


  try {

    const messaging =
      getMessaging(firebaseApp);


    const response =
      await messaging.send(message);


    console.log(
      "FCM notification sent successfully:",
      response
    );


    return response;


  } catch (error) {

    console.error(
      "FCM notification failed:"
    );

    console.error(
      "Error code:",
      error.code
    );

    console.error(
      "Error message:",
      error.message
    );

    console.error(
      "Full error:",
      error
    );

    throw error;

  }

};


module.exports = {
  sendNotification
};





// const admin = require("firebase-admin");
// console.log("admin:",admin);
// const path = require("path");

// const serviceAccount = require(
//   path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT)
// );

// try {
//   admin.app();
//   console.log("Firebase Admin already initialized.");
// } catch (error) {
//   console.log("Initializing Firebase Admin...", error);
//   admin.initializeApp({
//     credential: admin.cert(serviceAccount),
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
// console.log("Sending notification:", message);
//   return await admin.messaging().send(message);
// };

// module.exports = { sendNotification };



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