
const path = require("path");

const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

const User = require("../models/User");
const Notification = require("../models/Notification");
const LeaderCoordinates = require("../models/LeaderCoordinates");

const serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT));

let firebaseApp;

if (getApps().length === 0) {
  console.log("Initializing Firebase Admin...");
  firebaseApp = initializeApp({ credential: cert(serviceAccount) });
  console.log("Firebase Admin initialized successfully.");
} else {
  firebaseApp = getApps()[0];
  console.log("Firebase Admin already initialized.");
}

/*
|--------------------------------------------------------------------------
| Send FCM push (unchanged behaviour, now accepts extra `data`)
| FCM requires every value in `data` to be a string.
|--------------------------------------------------------------------------
*/
const sendNotification = async ({ token, title, body, type = "general", data = {} }) => {
  const stringData = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== null) stringData[k] = String(v);
  }

  const message = {
    token,
    notification: { title: String(title), body: String(body) },
    data: {
      ...stringData,
      type: String(type),
      title: String(title),
      body: String(body),
    },
    android: { priority: "high" },
  };

  try {
    const response = await getMessaging(firebaseApp).send(message);
    console.log("FCM notification sent successfully:", response);
    return response;
  } catch (error) {
    console.error("FCM notification failed:", error.code, error.message);
    throw error;
  }
};

/*
|--------------------------------------------------------------------------
| Save in DB (so it shows in the Notification tab) + push via FCM
| Never throws – a notification problem must not break the main API.
|--------------------------------------------------------------------------
*/
const notifyUser = async ({ user, title, body, type = "general", reference_id = null, data = {} }) => {
  if (!user) return null;

  let saved = null;

  try {
    saved = await Notification.create({
      user_id: user._id,
      leader_regd_mobile_no: user.leader_regd_mobile_no,
      title,
      body,
      type,
      reference_id: reference_id ? String(reference_id) : null,
      data,
    });
  } catch (err) {
    console.error("Notification save failed:", err.message);
  }

  if (user.fcm_token) {
    try {
      await sendNotification({
        token: user.fcm_token,
        title,
        body,
        type,
        data: {
          ...data,
          notification_id: saved ? saved._id : "",
          reference_id: reference_id || "",
        },
      });
    } catch (err) {
      console.warn("Push failed (non-blocking):", err.message);
    }
  }

  return saved;
};

/*
|--------------------------------------------------------------------------
| Notify every user registered under a leader
| (admin = the leader's own login, so they are skipped)
|--------------------------------------------------------------------------
*/
const notifyLeaderUsers = async (
  leader_regd_mobile_no,
  { title, body, type = "leader_update", reference_id = null, data = {} }
) => {
  if (!leader_regd_mobile_no) return;

  try {
    const users = await User.find({
      leader_regd_mobile_no,
      user_type: { $ne: "admin" },
    }).select("_id leader_regd_mobile_no fcm_token");
console.log(`notifyLeaderUsers: Found ${users.length} users for leader ${leader_regd_mobile_no}`);
    // Small batches so a large user base doesn't fire thousands of pushes at once
    const BATCH = 50;
    for (let i = 0; i < users.length; i += BATCH) {
      await Promise.allSettled(
        users
          .slice(i, i + BATCH)
          .map((user) => notifyUser({ user, title, body, type, reference_id, data }))
      );
    }
  } catch (err) {
    console.error("notifyLeaderUsers failed:", err.message);
  }
};

/*
|--------------------------------------------------------------------------
| One-liner used in every leader controller:
|   notificationService.notifyLeaderChange(mobile, 'personal details', 'updated');
| Fire-and-forget: does not delay or fail the API response.
|--------------------------------------------------------------------------
*/
const notifyLeaderChange = (leader_regd_mobile_no, section, action = "updated") => {
  (async () => {
    const leader = await LeaderCoordinates.findOne({ leader_regd_mobile_no })
      .select("member_name")
      .lean();
    const who = leader?.member_name || "Your leader";

    await notifyLeaderUsers(leader_regd_mobile_no, {
      title: "Leader Update",
      body: `${who} has ${action} ${section}.`,
      type: "leader_update",
      reference_id: section,
      data: { section, action },
    });
  })().catch((err) => console.error("notifyLeaderChange failed:", err.message));
};

module.exports = {
  sendNotification,
  notifyUser,
  notifyLeaderUsers,
  notifyLeaderChange,
};













// const path = require("path");

// const {
//   initializeApp,
//   getApps,
//   cert,
// } = require("firebase-admin/app");

// const {
//   getMessaging,
// } = require("firebase-admin/messaging");


// const serviceAccount = require(
//   path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT)
// );

// let firebaseApp;

// if (getApps().length === 0) {

//   console.log("Initializing Firebase Admin...");

//   firebaseApp = initializeApp({
//     credential: cert(serviceAccount),
//   });

//   console.log(
//     "Firebase Admin initialized successfully."
//   );

// } else {

//   firebaseApp = getApps()[0];

//   console.log(
//     "Firebase Admin already initialized."
//   );

// }


// /*
// |--------------------------------------------------------------------------
// | Send FCM Notification
// |--------------------------------------------------------------------------
// */

// const sendNotification = async ({
//   token,
//   title,
//   body,
//   type = "general",
// }) => {

//   const message = {

//     token,

//     notification: {
//       title: String(title),
//       body: String(body),
//     },

//     data: {
//       type: String(type),
//       title: String(title),
//       body: String(body),
//     },

//     android: {
//       priority: "high",
//     },

//   };


//   console.log(
//     "Sending notification:",
//     message
//   );


//   try {

//     const messaging =
//       getMessaging(firebaseApp);


//     const response =
//       await messaging.send(message);


//     console.log(
//       "FCM notification sent successfully:",
//       response
//     );


//     return response;


//   } catch (error) {

//     console.error(
//       "FCM notification failed:"
//     );

//     console.error(
//       "Error code:",
//       error.code
//     );

//     console.error(
//       "Error message:",
//       error.message
//     );

//     console.error(
//       "Full error:",
//       error
//     );

//     throw error;

//   }

// };


// module.exports = {
//   sendNotification
// };


