const utils = require("./utils");
const promises = require("./promises");
//const request = require("request");
const fetch = require("node-fetch");
const webpush = require("web-push");

async function formatNotif(change) {
    if (change.ns.coll === "messages") {
        let thread = await promises.threadPromise(
            change.fullDocument.thread_id
        );
        //console.log(thread)

        let payload = {
            title: `${change.fullDocument.username} posted in ${thread.title}`,
            icon: "/images/reply.png",
            body: `${change.fullDocument.date}\n${change.fullDocument.message}`,
            tag: change.fullDocument.thread_id,
            url: `/thread/${change.fullDocument.thread_id}`
        };
        //console.log(JSON.stringify(payload));

        let pushSubscription = await fetch(
            "https://localhost:8080/api/getsubscribe"
        ).then(response => {
            return response.json();
        });
        //console.log(pushSubscription.body);

        let notification = {
            pushSubscription: pushSubscription.body.subscription,
            payload: JSON.stringify(payload),
            options: pushSubscription.body.vapidKeys
        };
        //console.log(notification)

        return notification;
    }
}

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

module.exports = {
    open: openStream,
    close: closeStream
};
