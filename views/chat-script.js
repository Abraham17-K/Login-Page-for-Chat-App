var n
var notifnum;
var socket = io();
var notificationsOn = false;
var messages = document.getElementById("messages");
var form = document.getElementById("form");
var input = document.getElementById("input");
var usernameInput = document.getElementById("usernameInput");
var notificationButton = document.getElementById("toggleNotifications");
notificationButton.addEventListener("click", function (e) {
     if (notificationsOn == true) {
          notificationsOn = false;
          notificationButton.classList.remove("button-style-green");
          notificationButton.classList.add("button-style-red");
     } else {
          if (Notification.permission == "default") {
               Notification.requestPermission().then(function (result) {
                    if (result == "granted") {
                         notificationsOn = true;
                         notificationButton.classList.add("button-style-green");
                         notificationButton.classList.remove("button-style-red");
                    }
               });
               if (Notification.permission == "granted") {
                    notificationsOn = true;
                    notificationButton.classList.add("button-style-green");
                    notificationButton.classList.remove("button-style-red");
               }
          } else if (Notification.permission == "denied") {
               alert("Please allow notifications!");
          }
          if (Notification.permission == "granted") {
               notificationsOn = true;
               notificationButton.classList.add("button-style-green");
               notificationButton.classList.remove("button-style-red");
          }
     }
});

form.addEventListener("submit", async function (e) {
     e.preventDefault();
     if (input.value) {
          await sendMessage()
          input.value = "";
     } else {
          alert("Please enter a username and message!");
     }
});

socket.on("chat message", function (msg) {
     var item = document.createElement("li");
     item.textContent = msg;
     sendNotification(msg);
     messages.appendChild(item);
     window.scrollTo(0, document.body.scrollHeight);
});

socket.on("alert message", function (message) {
     if (!alertsEnabled) return
     var alertItem = document.createElement("li");
     alertItem.textContent = message;
     sendNotification(message);
     messages.appendChild(alertItem);
     alertItem.style.fontStyle = "italic"
     window.scrollTo(0, document.body.scrollHeight);
})

function sendNotification(msg) {
     if (
          (Notification.permission == "granted" &&
               notificationsOn == true &&
               document.visibilityState === "hidden") ||
          document.visibilityState === "prerender"
     ) {
          n = new Notification(msg, { tag: notifnum });
          notifnum++;
     }
}
document.addEventListener("visibilitychange", async function () {
     if (document.visibilityState === "visible") {
          n.close();
          await sendLoginMessage()
     } else if (document.visibilityState === "hidden") {
          await sendLogoutMessage()
     }
});

var alertsEnabled = true
document.getElementById("toggleAlerts").addEventListener("click", function (e) {
     if (alertsEnabled == true) {
          alertsEnabled = false;
          document.getElementById("toggleAlerts").classList.remove("button-style-green");
          document.getElementById("toggleAlerts").classList.add("button-style-red");
     }
     else {
          alertsEnabled = true;
          document.getElementById("toggleAlerts").classList.add("button-style-green");
          document.getElementById("toggleAlerts").classList.remove("button-style-red");
     }
})

const logoutButton = document.getElementById("logoutButton");
logoutButton.addEventListener("click", async function (e) {
     await logout().then(window.location.href="/logout")
})
