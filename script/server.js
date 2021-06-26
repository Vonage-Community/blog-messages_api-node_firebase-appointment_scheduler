require("dotenv").config();
const express = require("express");
const app = require("express")();
const port = 3000;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Vonage = require("@vonage/server-sdk");

console.log(`USING DB: ${process.env.FIREBASE_DATABASE_URL}`);

var serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `${process.env.FIREBASE_DATABASE_URL}`,
});

ref = admin.database().ref();

// Sends SMS with Vonage API
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/appointment", async (request, response) => {
  let phonenumber = request.body.phonenumber;
  let slot = request.body.slotdate;

  // TODO Function to check the slots taken from the database
  // and initialise the datepicker
  checkIfAvailable = async (slot) => {
    // TODO Check if date is available from Firebase and adds invalid date on the datepicker
    let snapshot = await ref.orderByChild("date").once("value");

    let available = true;
    snapshot.forEach((data) => {
      let dataval = data.val();
      // console.log(`DATAVAL`, dataval);
      for (let key in dataval) {
        let datapoint = dataval[key];
        // console.log(`DATA IS`, datapoint);
        console.log(`COMPARING`, slot, datapoint.date);
        if (slot === datapoint.date) {
          available = false;
        }
      }
    });
    return available;
  };

  // Sends an SMS back to the user's phone using the Vonage SMS API
  sendSMStoUser = async (slot) => {
    // TODO time and date should be retrieved from the input datepicker
    // Format is 2021-06-01T08:30
    // let dateRe = /.\T(.*)/;
    // let myDate = dateRe.exec(slot);
    // let timeRe = /^(.*?)T/;
    // let myTime = timeRe.exec(slot);
    // time = myTime;
    // date = myDate;
    time = "08:30";
    date = "2021-06-01";
    // Generates an id https://gist.github.com/gordonbrander/2230317
    let randomIdGenerator = "_" + Math.random().toString(36).substr(2, 9);

    const from = process.env.VONAGE_FROM_NUMBER;
    // TODO the below to has to be the user's phonenumber
    const to = process.env.VONAGE_TO_NUMBER;
    const text = `Meeting booked at ${time} on date: ${date}. Please save this code in case you'd like to cancel your appointment: ${randomIdGenerator}`;
    const result = await new Promise((resolve, reject) => {
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
    });
  };

  let available = await checkIfAvailable(slot);
  if (available) {
    console.log("DB IS NOW TAKEN");
    sendSMStoUser();
    response.send(`SLOT IS AVAILABLE: ${slot}`);
  } else {
    // send user error
    response.send(
      `SORRY, NEED TO CHOOSE A DIFFERENT SLOT.${slot} iS ALREADY BUSY`
    );
  }
});

app.listen(port, () => {
  console.log(`I run on port ${port}`);
});

// TODO Confirm - Persists a slot to Firebase
// exports.sendSMS = functions.database.ref("/myAppointments").push({
//   date: date,
//   time: time,
//   userId: "123",
// });

// TODO Cancel - Remove information from the Database,
// check the syntax for deleting
// Source: https://firebase.google.com/docs/database/web/read-and-write#web-v8_7
// exports.removeSlot = (code) => {
//   exports.removeSlot = functions.database.ref.child("new_slot" + code).remove();
// };
