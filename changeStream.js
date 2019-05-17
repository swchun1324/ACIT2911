const utils = require("./utils");
const promises = require("./promises");
//const request = require("request");
const fetch = require("node-fetch");
const webpush = require("web-push");

const vapidKeys = {
    publicKey:
        "BKyb0KGvc8HKy4A-RDJJ0_tZKUiXMlVcmBBhYSEz9U08Nc0xAuvA6uWv7ANEyJm6o0voRItkHhz5y0X0bEAw4Wo",
    privateKey: "LUZkyfprh3w6EHFNL9RrTLCAjLNp7rnnGbj--h_JsWc"
};

var subEndpoint = "https://quiet-brook-91223.herokuapp.com/api/getsubscribe"
// var subEndpoint = "http://localhost:8080/api/getsubscribe";

// formats replies notifications
async function formatNotif(change) {
    if (change.ns.coll === "messages") {
        let thread = await promises.threadPromise(
            change.fullDocument.thread_id
        );

        let payload = {
            title: `${change.fullDocument.username} posted in ${thread.title}`,
            icon: "/images/reply.png",
            body: `${change.fullDocument.date}\n${change.fullDocument.message}`,
            tag: change.fullDocument.thread_id,
            url: `/thread/${change.fullDocument.thread_id}`,
            renotify: true
        };

        
        //console.log(JSON.stringify(payload));

        let pushSubscription = await fetch(subEndpoint).then(response => {
            return response.json();
        });
        //console.log(pushSubscription.body);

        let notification = {
            pushSubscription: pushSubscription.body.subscription,
            payload: JSON.stringify(payload),
            options: vapidKeys
        };
        //console.log(notification)

        return notification;
    }
}

// opens changestream for threads
async function openStream(user_id) {
    var db = utils.getDb();

    var user = await promises.userPromise(user_id);

    const collection = db.collection("messages");

    const thread_changeStream = collection.watch([
        {
            $match: {
                $and: [
                    { "fullDocument.type": "reply" },
                    {
                        "fullDocument.thread_id": {
                            $in: user.subscribed_threads
                        }
                    } //,
                    //{ "fullDocument.username": { $ne: user.username } }
                ]
            }
        }
    ]);

    thread_changeStream.on("change", async change => {
        var item = {
            _id: change.fullDocument._id,
            thread_id: change.fullDocument.thread_id,
            message: change.fullDocument.message,
            read: false
        };
        //console.log(change)

        await promises.updateUserPromise(user._id, item);

        let notification = await formatNotif(change);

        let pushed = await webpush
            .sendNotification(
                notification.pushSubscription,
                notification.payload,
                {
                    vapidDetails: {
                        subject: "http://quiet-brook-91223.herokuapp.com/",
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

        console.log(`Push: ${pushed.statusCode}`);
    });
}

// closes thread stream notifications
async function closeStream(user_id) {
    var db = utils.getDb();

    var user = await promises.userPromise(user_id);

    const collection = db.collection("messages");

    const thread_changeStream = collection.watch([
        {
            $match: {
                $and: [
                    { "fullDocument.type": "reply" },
                    {
                        "fullDocument.thread_id": {
                            $in: user.subscribed_threads
                        }
                    } //,
                    //{ "fullDocument.username": { $ne: user.username } }
                ]
            }
        }
    ]);
    thread_changeStream.close();
}

async function dm_formatNotif(change) {
    if (change.ns.coll === "direct_message") {
        let payload = {
            title: `${
                change.fullDocument.sender_username
            } sent you a direct message!`,
            icon: "/images/speech-bubble.png",
            body: `${change.fullDocument.send_date}\n${
                change.fullDocument.message_body
            }`,
            tag: change.fullDocument._id,
            url: `/dms?view=${change.fullDocument.sender}`,
            renotify: true
        };
        //console.log(JSON.stringify(payload));

        let pushSubscription = await fetch(subEndpoint).then(response => {
            return response.json();
        });
        //console.log(pushSubscription.body);

        let notification = {
            pushSubscription: pushSubscription.body.subscription,
            payload: JSON.stringify(payload),
            options: vapidKeys
        };
        //console.log(notification)

        return notification;
    }
}

async function reply_openStream(user_id) {
    var db = utils.getDb();

    const collection = db.collection("direct_message");

    var query = [
        {
            $match: { "fullDocument.recipient": user_id }
        }
    ];

    const dm_changeStream = collection.watch(query);

    dm_changeStream.on("change", async change => {
        console.log(change);

        let dm_notification = await dm_formatNotif(change);

        let pushed = await webpush
            .sendNotification(
                dm_notification.pushSubscription,
                dm_notification.payload,
                {
                    vapidDetails: {
                        subject: "http://quiet-brook-91223.herokuapp.com/",
                        publicKey: dm_notification.options.publicKey,
                        privateKey: dm_notification.options.privateKey
                    }
                }
            )
            .catch(err => {
                if (err) {
                    return err;
                }
            });

        console.log(`Push: ${pushed.statusCode}`);
    });
}

module.exports = {
    open: openStream,
    close: closeStream,
    reply_open: reply_openStream
};
