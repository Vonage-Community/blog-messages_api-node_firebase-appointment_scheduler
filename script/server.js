// Send a message with the Vonage SMS API
const result = await new Promise((resolve, reject) => {
    vonage.message.sendSms(from, to, `Meeting booked at ${time} on date: ${date}`, (err, responseData) => {
        if (err) {
            return reject(new Error(err));
        } else {
            if (responseData.messages[0].status === "0") {
                return resolve(`Message sent successfully: ${responseData.messages[0]['message-id']}`);
            } else {
                return reject(new Error(`Message failed with error: ${responseData.messages[0]['error-text']}`));
            }
        }
    });
    // Responds the user giving a booking confirmation.
    conv.close(`Meeting booked at ${time} on date: ${date}.`);
});