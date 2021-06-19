require("dotenv").config();

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Vonage = require("@vonage/server-sdk");

// Adds Firebase
admin.initializeApp({
  databaseURL: `${process.env.FIREBASE_DATABASE_URL}.firebaseio.com/`,
});
const ref = db.ref("myAppointments");

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});

// start TODO time and date should be retrieved from the input datepicker
// Format is 2021-06-01T08:30
time = "14:30";
date = "16/06/2021";
// end TODO

const from = process.env.VONAGE_FROM_NUMBER;
const to = process.env.VONAGE_TO_NUMBER;
const text = `Meeting booked at ${time} on date: ${date}. Please save this code in case you'd like to cancel your appointment: ${randomIdGenerator}`;

// Generates an id https://gist.github.com/gordonbrander/2230317
let randomIdGenerator = "_" + Math.random().toString(36).substr(2, 9);


// TODO Function to check the slots taken from the database  
// and initialise the datepicker
exports.checkDates = () => {
  exports.removeSlot = functions.database.ref.child("new_slot" + code).remove();
};

// TODO Confirm - Persists a slot to Firebase
exports.sendSMS = functions.database.ref
  .child("new_slot" + randomIdGenerator)
  .set({
    date: date,
    time: time,
    userId: userId,
  });

// TODO Cancel - Remove information from the Database,
// check the syntax for deleting
// Source: https://firebase.google.com/docs/database/web/read-and-write#web-v8_7
exports.removeSlot = (code) => {
  exports.removeSlot = functions.database.ref.child("new_slot" + code).remove();
};

// Sends an SMS back to the user's phone
exports.sendSMStoUser = () => {
  vonage.message.sendSms(from, to, text, (err, responseData) => {
    if (err) {
      return reject(new Error(err));
    } else {
      if (responseData.messages[0]["status"] === "0") {
        return resolve(
          `Message sent successfully: ${responseData.messages[0]["message-id"]}`
        );
      } else {
        return reject(
          new Error(
            `Message failed with error: ${responseData.messages[0]["error-text"]}`
          )
        );
      }
    }
  });
};
