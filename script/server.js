require("dotenv").config();
const express = require("express");
const app = require("express")();
const port = 3000;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Vonage = require("@vonage/server-sdk");

// TODO remove db being used
console.log(`USING DB: ${process.env.FIREBASE_DATABASE_URL}`);

var serviceAccount = require("../serviceAccountKey.json");

// Initializes firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `${process.env.FIREBASE_DATABASE_URL}`,
});

ref = admin.database().ref("/myAppointments");

// Sends SMS with Vonage API
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const getDateTime = (slot) => {
  return slot.split("T");
};

app.post("/appointment", async (request, response) => {
  // TODO use this phonenumber
  let phonenumber = request.body.phonenumber;
  let slot = request.body.slotdate;
  let [date, time] = getDateTime(slot);

  checkIfAvailable = async (slot) => {
    let snapshot = await ref.orderByChild("date").once("value");

    let available = true;
    snapshot.forEach((data) => {
      let dataval = data.val();
      console.log(`DATAVAL`, dataval);
      for (let key in dataval) {
        let datapoint = dataval[key];
        console.log(`DATA IS`, datapoint);
        console.log(`COMPARING`, slot, datapoint);
        if (slot === datapoint) {
          available = false;
        }
      }
    });
    return available;
  };

  // example in firebase docs:
  //   const usersRef = ref.child('users');
  // usersRef.child('alanisawesome').set({
  //   date_of_birth: 'June 23, 1912',
  //   full_name: 'Alan Turing'
  // });
  // usersRef.child('gracehop').set({
  //   date_of_birth: 'December 9, 1906',
  //   full_name: 'Grace Hopper'
  // });

  // TODO Confirm - Persists a slot to Firebase
  addToDatabase = () => {
    let code = "_" + Math.random().toString(36).substr(2, 9);

    ref.child(code).set({
      date: slot,
      userId: code,
    });

    return code;
  };

  // Sends an SMS back to the user's phone using the Vonage SMS API
  sendSMStoUser = async (code) => {
    const from = process.env.VONAGE_FROM_NUMBER;
    // TODO the below to has to be the user's phonenumber
    const to = process.env.VONAGE_TO_NUMBER;
    const text = `Meeting booked at ${time} on date: ${date}. Please save this code in case you'd like to cancel your appointment: ${code}`;
    // console.log(`TEXTING to ${to} from ${from}: ${text}`);
    const result = await new Promise((resolve, reject) => {
      vonage.message.sendSms(from, to, text, (err, responseData) => {
        if (err) {
          return reject(new Error(err));
        } else {
          if (responseData.messages[0].status === "0") {
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
    console.log("SLOT WAS AVAILABLE, BOOKING IT NOW");
    let code = addToDatabase();
    await sendSMStoUser(code);
    response.send(`SLOT IS AVAILABLE, BOOKING IT NOW: ${slot}`);
  } else {
    // send user error
    response.send(
      `SORRY, NEED TO CHOOSE A DIFFERENT SLOT.${slot} IS ALREADY BUSY`
    );
  }
});

app.post("/cancelAppointment", async (request, response) => {
  let code = request.body.code;
  console.log("SLOT REMOVED");

  removeSlotFromDB = (code) => {
    ref.child(code).remove();
  };
  removeSlotFromDB(code);

  response.send(`You've been removed`);
});

app.listen(port, () => {
  console.log(`I run on port ${port}`);
});
