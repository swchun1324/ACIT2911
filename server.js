const port = process.env.PORT || 8080;

const express = require("express");
const bodyParser = require("body-parser");
const hbs = require("hbs");
const _ = require("lodash");

const utils = require("./utils.js");
const register = require("./users.js");
const pass = require("./passport.js");
const forum = require("./forum.js");
const promises = require("./promises.js");
const dms = require("./messaging.js");
const watcher = require("./changeStream.js");

const app = express();
const path = require("path");
const fs = require("fs");
const https = require("https");
const webpush = require("web-push");

var sslOptions = {
    key: fs.readFileSync(path.resolve("./localhost-key.pem")),
    cert: fs.readFileSync(path.resolve("./localhost.pem"))
};

var server = https.createServer(sslOptions, app).listen(port, () => {
    console.log(`Server is up on the port ${port}`);
    utils.init();
});
/*
var server = app.listen(port, () => {
    console.log(`Server is up on the port ${port}`);
    utils.init();
});
*/

const vapidKeys = {
    publicKey: "BKyb0KGvc8HKy4A-RDJJ0_tZKUiXMlVcmBBhYSEz9U08Nc0xAuvA6uWv7ANEyJm6o0voRItkHhz5y0X0bEAw4Wo",
    privateKey: "LUZkyfprh3w6EHFNL9RrTLCAjLNp7rnnGbj--h_JsWc"
}
app.locals.clientVapidKey = vapidKeys.publicKey;
//console.log(app.locals.clientVapidKey);

webpush.setVapidDetails(
    "http://quiet-brook-91223.herokuapp.com/",
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

hbs.registerPartials(__dirname + "/views/partials");

app.use(function(req, res, next) {
    res.header("Service-Worker-Allowed", "/");
    next();
});

app.use(express.static(__dirname + "/public"));
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);
app.use(bodyParser.json());

hbs.registerHelper("port", () => {
    return port;
});

hbs.registerHelper("year", () => {
    return new Date().getFullYear();
});

hbs.registerHelper("populate", (dms, user_id) => {
    return dms[user_id];
});

app.use(pass);
app.use(register);
app.use(forum);
app.use(dms);

// CHECKS AUTHENTICATION
checkAuthentication = (request, response, next) => {
    if (request.isAuthenticated()) {
        return next();
    }
    response.redirect("/login");
};

checkAuthentication_false = (request, response, next) => {
    if (request.isAuthenticated() != true) {
        return next();
    }
    response.redirect("/");
};

// Login Page
app.get("/login", (request, response) => {
    response.render("login.hbs", {
        title: "Login",
        heading: "Log In"
    });
});

// Logout Page
app.get("/logout", (request, response) => {
    var user_id = request.user._id;

    request.logout();

    request.session.destroy(() => {
        // watcher.close(user_id);
        response.clearCookie("connect.sid");
        response.redirect("/");
    });
});

// Register Page
app.get("/registration", checkAuthentication_false, (request, response) => {
    response.render("registration.hbs", {
        title: "Registration",
        heading: "Make an Account"
    });
});

// Forum page
app.get("/", async (request, response) => {
    var messages = await promises.messagePromise();

    response.render("forum.hbs", {
        title: "Home",
        heading: "Message Board",
        message: messages
    });
});

// Search Thread Page
app.get("/search", async (request, response) => {
    if (request.query.keyword == "") {
        return;
    }

    var threads_replies = await promises.searchPromise(
        request.query.keyword,
        "thread",
        "thread_reply"
    );
    var replies = await promises.searchPromise(
        request.query.keyword,
        "reply",
        "reply"
    );
    var threads = await promises.searchPromise(
        request.query.keyword,
        "thread",
        "thread"
    );

    var replies_thread_ids = Object.keys(_.groupBy(replies, "thread_id"));

    var exist_flag = false;

    for (i = 0; i < replies_thread_ids.length; i++) {
        for (j = 0; j < replies.length; j++) {
            if (replies[j].thread_id == replies_thread_ids[i]) {
                exist_flag = true;
                break;
            }
        }
        if (exist_flag != true) {
            var queried_thread = await promises.threadPromise(
                replies_thread_ids[i]
            );
            threads_replies.push(queried_thread);
        }
        exist_flag = false;
    }

    response.render("search.hbs", {
        title: "Search",
        heading: `Search: ${request.query.keyword}`,
        thread_reply: threads_replies,
        thread: threads,
        reply: replies
    });
});

// Adding new post
app.get("/new_post", checkAuthentication, (request, response) => {
    response.render("new_post.hbs", {
        title: "Post",
        heading: "Add a post"
    });
});

// Dynamically generated endpoint for threads
app.get("/thread/:id", async (request, response) => {
    var thread = await promises.threadPromise(request.params.id);
    var replies = await promises.replyPromise(request.params.id);

    var isOP = false;
    if (request.user != undefined) {
        if (request.user.username == thread.username) {
            isOP = true;
        }
    }

    response.render("thread.hbs", {
        title: "Thread",
        heading: thread.title,
        op_message: thread.message,
        poster: thread.username,
        date: thread.date,
        id: thread._id,
        reply: replies,
        isOP: isOP,
        thread: thread
    });
});

//sets checkbox state on settings partial
hbs.registerHelper("setChecked", state => {
    if (state) {
        return "checked";
    }
    return "";
});

// Dynamically generated endpoint for user profiles
app.get("/user/:id", async (request, response) => {
    var user = await promises.userPromise(request.params.id);
    var thread = await promises.userthreadPromise(user.username);
    let title = `${user.username}'s profile`;
    let displaySettings = false;
    let email = "Hidden by user";
    let userSettings;

    for (let message of thread) {
        message.date = String(message.date).split(" ")[0];
    }

    if (user.settings.showEmail) {
        email = `${user.email}`;
    }

    if (request.user !== undefined) {
        if (request.user._id.toString() === request.params.id) {
            title = "My Account";
            displaySettings = true;
            let updatedUser = await promises.userPromise(request.user._id);
            userSettings = updatedUser.settings;
        }
    }

    response.render("user.hbs", {
        title: title,
        heading: user.username,
        user_id: user._id,
        thread: thread,
        email: email,
        displaySettings: displaySettings,
        userSettings: userSettings
    });
});

// Send new direct message
app.get("/new_dm/:id", checkAuthentication, (request, response) => {
    response.render("new_dm.hbs", {
        title: "Direct Message",
        heading: "Send a direct message",
        recipient_id: request.params.id
    });
});

// Logged in user's DMs
app.get("/dms", checkAuthentication, async (request, response) => {
    var dms = await promises.dmPromise(request.user._id.toString());

    // groups array elements into {otherUser_id:[messages]} objects
    let dmsByUsers = _.groupBy(
        dms.map(message => {
            message.users = message.users.filter(user => {
                return user !== request.user._id.toString();
            })[0];
            return message;
        }),
        "users"
    );

    // gets username of DMs
    user_id_array = Object.keys(dmsByUsers);
    user_array = [];

    for (i = 0; i < user_id_array.length; i++) {
        var queried_user = await promises.userPromise(user_id_array[i]);

        user_array.push({
            id: user_id_array[i],
            username: queried_user.username
        });
    }

    response.render("dms.hbs", {
        title: "DM Inbox",
        heading: "Direct Message Inbox",
        dm_id: user_id_array,
        dm_users: user_array,
        dms: dmsByUsers
    });
});

// display endpoint for messages in inbox
app.get("/dms/:id", checkAuthentication, async (request, response) => {
    var dms = await promises.dmPromise(request.user._id.toString());
    var username = await promises.userPromise(request.params.id);

    // groups array elements into {otherUser_id:[messages]} objects
    let dmsByUsers = _.groupBy(
        dms.map(message => {
            message.users = message.users.filter(user => {
                return user !== request.user._id.toString();
            })[0];
            return message;
        }),
        "users"
    );

    response.render("dm_messages.hbs", {
        heading: username.username,
        dms: dmsByUsers[request.params.id],
        dmers_id: request.params.id
    });
});

app.get("/api/notifs", async (request, response) => {
    if (request.isAuthenticated()) {
        var dms = await promises.dmPromise(request.user._id.toString());

        // groups array elements into {otherUser_id:[messages]} objects
        let dmsByUsers = _.groupBy(
            dms.map(message => {
                message.users = message.users.filter(user => {
                    return user !== request.user._id.toString();
                })[0];
                return message;
            }),
            "users"
        );

        response.send(dmsByUsers);
    } else {
        response.send({});
    }
});

app.get("/api/vapidPublicKey", (request, response) => {
    response.send({ key: app.locals.clientVapidKey });
});

app.post("/api/push", checkAuthentication, async (request, response) => {
    console.log(request);
    let title = request.body.notification.title;
    let icon = "/images/reply.png";
    let body = request.body.notification.body;
    let url = request.body.notification.url;

    let payload = {
        title,
        icon,
        body,
        url
    };

    let pushed = await webpush.sendNotification(
        app.locals.pushSubscription,
        payload
    );

    response.send({
        status: pushed.statusCode,
        body: pushed.body
    });
});

app.get("/api/getsubscribe", (request, response) => {
    //console.log(request)
    let subscription = app.locals.pushSubscription;
    //console.log(subscription);
    response.send({
        status: 200,
        body: { subscription, vapidKeys }
    });
});

app.post("/api/pushsubscribe", checkAuthentication, (request, response) => {
    app.locals.pushSubscription = request.body;
    //console.log(app.locals.pushSubscription);

    response.send({ status: 200 });
});

exports.closeServer = function() {
    server.close();
};

module.exports = server;
