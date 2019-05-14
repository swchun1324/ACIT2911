/* eslint-disable linebreak-style */
/* eslint-disable indent */
/* eslint-disable quotes */
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
            .catch(error => {
                return console.log(error);
            })
    );
});

/*
self.addEventListener("fetch", event => {
    if (event.request.destination === "document") {
        console.log(event.request);
        event.waitUntil(
            caches.open(cacheName).then(async cache => {
                //console.log("Opened cache");
                await cache.delete(cacheURLS);
                //console.log(cleared);
                await cache.add(cacheURLS);
                let pulled = await cache.match(cacheURLS);
                console.log(await pulled.json());
            })
        );
    }
});
*/

function genNotif(event) {
    return new Promise((resolve, reject) => {
        //console.log(event.data)
        let data = event.data.json();
        //console.log(data);
        self.registration
            .showNotification(data.title, {
                icon: data.icon,
                body: data.body,
                data: data.url,
                tag: data.tag,
                renotify: true
            })
            .then(resolve);
    });
}

self.addEventListener("push", event => {
    //console.log(event);
    event.waitUntil(genNotif(event));

});

self.onnotificationclick = async function(event) {
    let url = event.notification.data;
    console.log("Clicked:", event.notification.tag);
    event.notification.close();

    let allClients = await clients.matchAll({ type: "window" });
    console.log(allClients[0]);

    event.waitUntil(allClients[0].navigate(url));
};
