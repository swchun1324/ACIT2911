importScripts(
    "https://cdn.jsdelivr.net/npm/idb-keyval@3/dist/idb-keyval-iife.js"
);
const cacheName = "notifCache";
const cacheURLS = "/api/notifs";

self.addEventListener("install", event => {
    // Perform install steps
    event.waitUntil(
        caches
            .open(cacheName)
            .then(cache => {
                //console.log("Opened cache");

                return cache.add(cacheURLS);
            })
            .then(clients.claim())
            .catch(error => {
                return console.log(error);
            })
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(clients.claim());
});

self.addEventListener("fetch", event => {
    if (event.request.destination === "document") {
        //console.log(event.request);
        event.waitUntil(
            caches.open(cacheName).then(async cache => {
                //console.log("Opened cache");
                await cache.delete(cacheURLS);
                //console.log(cleared);
                await cache.add(cacheURLS);
                let pulled = await cache.match(cacheURLS);
                if (pulled !== undefined) {
                    //console.log(pulled);
                }
            })
        );
    }
});

function genNotif(event) {
    return new Promise((resolve, reject) => {
        //console.log(event.data)
        let data = event.data.json();
        //console.log(data);
        let message = JSON.stringify({
            icon: data.icon,
            body: data.title,
            url: data.url
        });

        idbKeyval.set(data.tag, message).then(
            clients
                .matchAll({
                    type: "window",
                    includeUncontrolled: true
                })
                .then(allClients => {
                    for (let client of allClients) {
                        console.log("Storing notif");
                        client.postMessage({ tag: data.tag, message: message });
                    }
                })
                .then(
                    resolve(
                        self.registration.showNotification(data.title, {
                            icon: data.icon,
                            body: data.body,
                            data: data.url,
                            tag: data.tag,
                            renotify: data.renotify
                        })
                    )
                )
        );
    });
}

// self.onmessage = async function(event) {
//     console.log("Caught!");
//     event.waitUntil(console.log(event));
// };

self.addEventListener("push", event => {
    event.waitUntil(genNotif(event));
});

/*
self.addEventListener("push", async event => {
    // console.log(event);
    // await clients.claim();

    let allClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true
    });
    //console.log(allClients[0].focused);

    let data = event.data.json();
    let message = JSON.stringify({
        icon: data.icon,
        body: data.title,
        url: data.url
    });

    idbKeyval.set(data.tag, message);

    for (let client of allClients) {
        console.log("Storing notif");
        client.postMessage({ tag: data.tag, message: message });
        if (client.visibilityState === "visible") {
            return;
        }
    }

    event.waitUntil(genNotif(event));
});
*/

function notifLoad(event) {
    return new Promise((resolve, reject) => {
        let url = event.notification.data;
        if (url === null) {
            reject("No url!");
        }
        console.log("Clicked:", event.notification.tag);
        event.notification.close();
        clients
            .matchAll({
                type: "window",
                includeUncontrolled: true
            })
            .then(allClients => {
                if (allClients.length !== 0) {
                    for (let client of allClients) {
                        if (client.visibilityState === "visible") {
                            resolve(
                                client.navigate(url).then(client => {
                                    client.focus();
                                })
                            );
                        }
                    }
                } else {
                    resolve(clients.openWindow(url));
                }
            });
    });
}

self.addEventListener("notificationclick", event => {
    event.waitUntil(
        notifLoad(event).catch(error => {
            console.log(error.message);
        })
    );
});
