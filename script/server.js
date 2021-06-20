// require("dotenv").config();
const express = require("express");
const { ref } = require("firebase-functions/lib/providers/database");
const app = require('express')();
const port = 3000;
// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const Vonage = require("@vonage/server-sdk");

// https://appointment-scheduler-ab41a-default-rtdb.europe-west1.firebasedatabase.app/

// Adds Firebase

// TODO Create the database from the firebase console UI
admin.initializeApp({
  databaseURL: `${process.env.FIREBASE_DATABASE_URL}`,
});
const ref = db.ref("myAppointments");

// const vonage = new Vonage({
//   apiKey: process.env.VONAGE_API_KEY,
//   apiSecret: process.env.VONAGE_API_SECRET,
// });

// GET  /customer/123/?foo=456
// POST /customer/123   body: {foo: '789'}

// params - 123, 456, 789 (in rails)

// express:
//   params - 123
//   query - 456
//   body - 789

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/appointment", (request, response) => {
  let phonenumber = request.body.phonenumber;
  let slot = request.body.slotdate;
  let available = checkIfAvailable(slot)
  if (available) {
    // tell db it is now taken
    // send sms
    response.send(`SLOT IS AVAILABLE: ${slot}`);
  } else {
    // send user error
    response.send(
      `SORRY, NEED TO CHOOSE A DIFFERENT SLOT. ${slot} iS ALREADY BUSY`
    );
  }
});

app.listen(port, () => {
  console.log("I run on port " + port);
});


// TODO time and date should be retrieved from the input datepicker
// Format is 2021-06-01T08:30
// time = "14:30";
// date = "16/06/2021";
// TODO

const from = process.env.VONAGE_FROM_NUMBER;
const to = process.env.VONAGE_TO_NUMBER;
const text = `Meeting booked at ${time} on date: ${date}. Please save this code in case you'd like to cancel your appointment: ${randomIdGenerator}`;

// Generates an id https://gist.github.com/gordonbrander/2230317
let randomIdGenerator = "_" + Math.random().toString(36).substr(2, 9);

// TODO Function to check the slots taken from the database
// and initialise the datepicker
checkifAvailable = (slot) => {
 // TODO Check if date is available from Firebase and adds invalid date on the datepicker
  return ref
  .orderByChild('date')
  .once('value')
  .then((snapshot) => {

  })
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

// Sends an SMS back to the user's phone using the Vonage SMS API
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
