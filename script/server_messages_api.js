require("dotenv").config();
const express = require("express");
const app = require("express")();
const port = 3000;
const admin = require("firebase-admin");
const Vonage = require("@vonage/server-sdk");
const SMS = require("@vonage/server-sdk/lib/Messages/SMS");
const { v4: uuidv4 } = require("uuid");
const serviceAccount = require("../serviceAccountKey.json");

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
  let phonenumber = request.body.phonenumber;
  let slot = request.body.slotdate;
  let [date, time] = getDateTime(slot);

  // Checks if a slot is available
  checkIfAvailable = async (slot) => {
    let snapshot = await ref.orderByChild("date").once("value");

    let available = true;
    snapshot.forEach((data) => {
      let dataval = data.val();
      for (let key in dataval) {
        let datapoint = dataval[key];
        if (slot === datapoint) {
          available = false;
        }
      }
    });
    return available;
  };

  // Adds the slot to the database
  addToDatabase = () => {
    let code = uuidv4();

    ref.child(code).set({
      date: slot,
      userId: code,
    });

    return code;
  };

  sendSMStoUser = async (code) => {
    const to = phonenumber;
    const text = `Meeting booked at ${time} on date: ${date}. Please save this code: ${code} in case you'd like to cancel your appointment.`;
    const result = await new Promise((resolve, reject) => {
      vonage.messages.send(
        new SMS(text, process.env.VONAGE_TO_NUMBER, "Vonage"),
        (err, data) => {
          if (err) {
            console.error(err);
          } else {
            console.log(data.message_uuid);
          }
        }
      );
    });
  };

  let available = await checkIfAvailable(slot);

  if (available) {
    let code = addToDatabase();
    await sendSMStoUser(code);
    response.send(`This slot is available, booking it for you now: ${slot}`);
  } else {
    // Sends user error
    response.send(
      `Sorry, you'll need to choose a different slot.${slot} is already busy.`
    );
  }
});

app.post("/cancelAppointment", async (request, response) => {
  let code = request.body.code;

  // Removes slot from the database
  removeSlotFromDB = (code) => {
    ref.child(code).remove();
  };
  removeSlotFromDB(code);

  response.send(`This slot has been removed.`);
});

app.listen(port, () => {
  console.log(`I run on port ${port}`);
});
