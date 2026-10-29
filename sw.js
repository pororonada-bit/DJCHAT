/* 다정챗 서비스워커: 앱이 꺼져 있어도 푸시 알림을 받아서 보여줘요. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let d = {};
  try {
    d = event.data ? event.data.json() : {};
  } catch (e) {
    d = { body: event.data ? event.data.text() : "" };
  }
  const title = d.title || "다정챗";
  const tag = d.room ? "room-" + d.room : "dajeong";

  event.waitUntil((async () => {
    // 지금 다정챗 화면을 보고 있으면 앱 안 알림이 따로 뜨니까 소리 없이 잠깐만 보여요.
    // (아이폰은 푸시를 받으면 알림을 꼭 한 번 보여줘야 해서 아예 생략하지는 않아요.)
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const watching = wins.some((w) => w.visibilityState === "visible");

    await self.registration.showNotification(title, {
      body: d.body || "",
      tag,
      renotify: !watching,
      silent: watching,
      icon: "icon-192.png",
      data: { room: d.room || null },
    });

    if (watching) {
      await new Promise((r) => setTimeout(r, 1200));
      const list = await self.registration.getNotifications({ tag });
      list.forEach((n) => n.close());
    }
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const room = event.notification.data && event.notification.data.room;

  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if ("focus" in w) {
        await w.focus();
        if (room) w.postMessage({ type: "open-room", room });
        return;
      }
    }
    const url = self.registration.scope + (room ? "?room=" + encodeURIComponent(room) : "");
    await self.clients.openWindow(url);
  })());
});
