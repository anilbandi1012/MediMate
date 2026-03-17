self.addEventListener("push", function (event) {
  console.log("Push received in background");
  const data = event.data ? event.data.text() : "Medication Reminder";

  self.registration.showNotification("MediMate Reminder 💊", {
    body: data,
    icon: "/logo.png",   // optional (put a logo in public folder)
    vibrate: [200, 100, 200],
  });
});
