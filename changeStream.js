const utils = require("./utils");
const promises = require("./promises");
const request = require("request");

function formatNotif(change) {
    if (change.ns.coll === "messages") {
        let notification = {
            title: `${change.fullDocument.username} - ${
                change.fullDocument.date
            }`,
            body: change.fullDocument.message,
            url: change.fullDocument.thread_id
        };

        return request.post(
            "https://localhost:8080/api/push",
            {
                json: notification,
                rejectUnauthorized: false
            },
            (err, response, body) => {
                if (err) {
                    console.log(err);
                    return err;
                }
            }
        );
    }
}

async function openStream(user_id) {
    var db = utils.getDb();

    var user = await promises.userPromise(user_id);

    const collection = db.collection("messages");
  
    const thread_changeStream = collection.watch(
        [{ $match: 
            { $and: [
                { 'fullDocument.type': 'reply' },
                { 'fullDocument.thread_id': { $in: user.subscribed_threads }},
                { 'fullDocument.username': { $ne: user.username }}
            ]}
        }]
    );

    thread_changeStream.on("change", async change => {
        var item = {
            _id: change.fullDocument._id,
            thread_id: change.fullDocument.thread_id,
            message: change.fullDocument.message,
            read: false
        };

<<<<<<< HEAD
<<<<<<< HEAD
        await promises.updateUserPromise(user._id, item);
      
        let notification = await formatNotif(change);
        console.log([
            notification.pushSubscription,
            notification.payload,
            {
                vapidDetails: {
                    subject: "https://quiet-brook-91223.herokuapp.com/",
                    publicKey: notification.options.publicKey,
                    privateKey: notification.options.privateKey
                }
            }
        ]);
        let pushed = await webpush
            .sendNotification(
                notification.pushSubscription,
                notification.payload,
                {
                    vapidDetails: {
                        subject: "https://quiet-brook-91223.herokuapp.com/",
                        publicKey: notification.options.publicKey,
                        privateKey: notification.options.privateKey
                    }
                }
            )
            .catch(err => {
                if (err) {
                    return err;
                }
            });

        console.log(pushed);
=======
        console.log(change);
        await formatNotif(change);
>>>>>>> parent of 9b7ad0b... notif sending to endpoint
=======
        console.log(change);
        await formatNotif(change);
>>>>>>> parent of 9b7ad0b... notif sending to endpoint
    });
}

async function closeStream(user_id) {
    var db = utils.getDb();

    var user = await promises.userPromise(user_id);

    const collection = db.collection("messages");

    const thread_changeStream = collection.watch(
        [{ $match: 
            { $and: [
                { 'fullDocument.type': 'reply' },
                { 'fullDocument.thread_id': { $in: user.subscribed_threads }},
                { 'fullDocument.username': { $ne: user.username }}
            ]}
        }]
    );
    thread_changeStream.close();
}

module.exports = {
    open: openStream,
    close: closeStream
};
