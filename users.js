const express = require("express");
// const pass = require("./passport.js");
const utils = require("./utils");

const bcrypt = require("bcrypt")
const saltRounds = 10;


var router = express.Router();

router.post("/saveUser", saveUser);
router.post("/updateUser", updateUser);

module.exports = router;

async function saveUser(request, response) {
    var email = request.body.email;
    var username = request.body.username;
    let password = await bcrypt.hash(request.body.password, saltRounds);

    var db = utils.getDb();

    var query = {
        $or: [{ email: email }, { username: username }]
    };

    db.collection("users")
        .find(query)
        .toArray((err, result) => {
            if (result.length > 0) {
                setTimeout(function() {
                    return response.redirect("/registration");
                }, 2500);
            } else if (result.length == 0) {
                db.collection("users").insertOne(
                    {
                        email: email,
                        username: username,
                        password: password,
                        settings: {
                            showEmail: false,
                            showName: false,
                            enableNotifs: false
                        },
                        subscribed_threads: [],
                        notifications: []
                    },
                    (err, result) => {
                        if (err) {
                            response.send("Unable to register user");
                        }
                        response.redirect("/login");
                    }
                );
            }
        });
}

function updateUser(request, response) {
    let settings = {
        showEmail: Boolean(request.body.showEmail),
        showName: Boolean(request.body.showName),
        enableNotifs: Boolean(request.body.enableNotifs)
    };

    let db = utils.getDb();

    db.collection("users")
        .findOneAndUpdate(
            {
                _id: request.user._id
            },
            {
                $set: { settings: settings }
            }
        )
        .then(() => {
            console.log(request.session);
            response.redirect(`/user/${request.user._id.toString()}`);
        });
}
