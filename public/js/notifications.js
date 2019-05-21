/* eslint-disable linebreak-style */
/* eslint-disable indent */
/* eslint-disable quotes */

var getPublicKey = async () => {
    let key = await fetch("/api/vapidPublicKey", {
        method: "GET"
    }).then(response => {
        return response.clone().json();
    });
    let vapidPublicKey = await urlBase64ToUint8Array(key.key);
    //console.log(vapidPublicKey);

    return vapidPublicKey;
};
var vapidPublicKey = getPublicKey();
//console.log(vapidPublicKey);

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function registerWorker() {
    return navigator.serviceWorker
        .register("/js/notif_worker.js", { scope: "/" })
        .then(function(registration) {
            // Registration was successful
            /*
            console.log(
                "ServiceWorker registration successful with scope: ",
                registration.scope
            );
            */

            /*
            registration.pushManager
                .getSubscription()
                .then(PushSubscription => {
                    if (PushSubscription) {
                        return console.log(PushSubscription.endpoint);
                    } else {
                        console.log("No push!")
                    }
                });
            */

            return registration;
        })
        .catch(err => {
            // registration failed
            console.log("ServiceWorker registration failed: ", err);
        });
}

async function openPushSubscription() {
    if ("serviceWorker" in navigator && "PushManager" in window) {
        //window.addEventListener("load", registerWorker());
        if (navigator.serviceWorker.controller) {
            console.log("Working: ", navigator.serviceWorker.controller);
        }

        let register = await registerWorker();
        let vapidKey = await vapidPublicKey;

        let PushSubscription = await register.pushManager.getSubscription();
        if (PushSubscription === null) {
            PushSubscription = await register.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidKey
            });
        }

        //console.log(JSON.stringify(PushSubscription));
        return fetch("/api/pushsubscribe", {
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(PushSubscription)
        });
    }
}

async function closePushSubscription() {
    navigator.serviceWorker.ready.then(function(reg) {
        reg.pushManager.getSubscription().then(function(subscription) {
            subscription
                .unsubscribe()
                .then(function(successful) {
                    // You've successfully unsubscribed
                    console.log("Unsubscribed", successful);
                })
                .catch(function(e) {
                    // Unsubscription failed
                    console.log("Unsubscribe failed:", e);
                });
        });
    });
}

async function openMessageListener() {
    console.log("Opening listener");
    navigator.serviceWorker.addEventListener("message", async function(event) {
        console.log(`caught from ${event.source}`);
        let notifCount = document.getElementById("notifCount");
        if (notifCount !== null) {
            let count = await idbKeyval.keys();
            notifCount.innerHTML = count.length;
            console.log("changed count");

            let notifContent = [];
            for (i = 0; i < count.length; i++) {
                let key = count[i];
                let value = await idbKeyval.get(key);
                notifContent.push(value);
            }
            let notif = "";

            for (i = 0; i < count.length; i++) {
                let session = JSON.parse(notifContent[i]);

                icon = session.icon;
                content = session.body;
                link = session.url;

                text = `<li><a href="${link}"><p><img src=${icon}>${content}</p></a></li>`;

                notif += text;
            }

            document.getElementById("notif_list").innerHTML = notif;
            return;
        }
    });
}

async function updateNotifCount() {
    if (document.getElementById("notifCount") !== null) {
        let count = await idbKeyval.keys();
        document.getElementById("notifCount").innerHTML = count.length;

        var notifContent = [];
        for (i = 0; i < count.length; i++) {
            let key = count[i];
            let value = await idbKeyval.get(key);
            notifContent.push(value);
        }
        var notif = "";

        for (i = 0; i < count.length; i++) {
            var session = JSON.parse(notifContent[i]);

            icon = session.icon;
            content = session.body;
            link = session.url;

            text = `<li><a href="${link}"><p><img src=${icon}>${content}</p></a></li>`;

            notif += text;
        }

        if (notif == "") {
            notif = '<p class="noNotifs">No new notifications!</p>';
        }

        document.getElementById("notif_list").innerHTML = notif;
        return new Promise((resolve, reject) => {
            resolve(console.log("Updated inline notifs"));
        });
    } else {
        return new Promise((resolve, reject) => {
            resolve(
                idbKeyval.clear().then(result => {
                    return console.log("Cleared inline notifs");
                })
            );
        });
        // await idbKeyval.clear();
        // return console.log("Cleared inline notifs");
    }
}

async function toggleNotif() {
    document.getElementById("notifs").classList.toggle("hide");
    document.getElementById("notifications").classList.toggle("active");
}

var ignore = document.getElementById("notifs");
document.onclick = function closeNotif(event) {
    if (ignore != null) {
        var target = event.target || event.srcElement;
        if (
            target.id === "notifs" ||
            ignore.contains(target) ||
            target.id === "notifCount" ||
            target.id === "notifDropdown" ||
            target.id === "notifImg"
        ) {
            return;
        }
        document.getElementById("notifs").classList.add("hide");
        document.getElementById("notifications").classList.remove("active");
    }
};

//closePushSubscription();
openPushSubscription().catch(error => {
    return console.log(error.message);
});
openMessageListener().catch(error => {
    return console.log(error.message);
});
updateNotifCount().catch(error => {
    return console.log(error.message);
});

if (Notification.permission !== "denied") {
    Notification.requestPermission().then(function(result) {
        console.log(result);
    });
}

/*
let deferredPrompt;
window.addEventListener("beforeinstallprompt", e => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
});

document.getElementById("logo").addEventListener("click", e => {
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then(choiceResult => {
        if (choiceResult.outcome === "accepted") {
            console.log("User accepted the A2HS prompt");
        } else {
            console.log("User dismissed the A2HS prompt");
        }
        deferredPrompt = null;
    });
});
*/
