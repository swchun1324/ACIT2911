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
    navigator.serviceWorker.addEventListener("message", async event => {
        console.log("caught!");
        window.sessionStorage.setItem(event.data.tag, event.data.message);
        return updateNotifCount();
    });
}


async function updateNotifCount() {
    if (document.getElementById("notifCount") !== null) {
        let notifications = window.sessionStorage;
        document.getElementById("notifCount").innerHTML = notifications.length;

        var notifContent = Object.entries(notifications);
        var notif = "";

        for (i=0; i<notifications.length; i++) {
            var session = JSON.parse(notifContent[i][1]);

            icon = session.icon;
            content = session.body;
            link = session.url;

            text = `<li><a href="${link}"><p><img src=${icon}>${content}</p></a></li>`;

            notif += text;
        }

        document.getElementById("notif_list").innerHTML = notif;
    } else {
        window.sessionStorage.clear();
    }
}

async function toggleNotif() {
    document.getElementById("notifs").classList.toggle("hide");
    document.getElementById("notifications").classList.toggle("active");
}

var ignore = document.getElementById('notifs');

document.onclick = function closeNotif(event) {
    var target = event.target || event.srcElement;
    if (target.id === 'notifs' || ignore.contains(target) || target.id === 'notifCount' || target.id === 'notifDropdown' || target.id === 'notifImg') {
        return;
    }
    document.getElementById("notifs").classList.add("hide");
    document.getElementById("notifications").classList.remove("active");
};

//closePushSubscription();
openPushSubscription();
openMessageListener();
updateNotifCount();

if (Notification.permission !== "denied") {
    Notification.requestPermission().then(function(result) {
        console.log(result);
    });
}
