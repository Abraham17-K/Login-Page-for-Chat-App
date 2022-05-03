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

socket.on("chat message", function (message) {
     const item = document.createElement("li")
     const itemText = document.createElement("p")
     const itemTime = document.createElement("p")
     itemTime.textContent = getTime();
     itemText.textContent = message;
     item.classList.add("chat-line")
     itemTime.style.float = "right"
     sendNotification(message);
     messages.appendChild(item);
     item.appendChild(itemTime);
     item.appendChild(itemText);
     window.scrollTo(0, document.body.scrollHeight);
});

socket.on("alert message", function (message) {
     if (!alertsEnabled) return
     const alertText = document.createElement("p")
     const alertTime = document.createElement("p")
     const alertItem = document.createElement("li")
     alertText.textContent = message
     alertTime.textContent = getTime()
     alertItem.classList.add("chat-line")
     alertTime.style.float = "right"
     sendNotification(message);
     messages.appendChild(alertItem);
     alertItem.appendChild(alertTime);
     alertItem.appendChild(alertText);
     alertText.style.fontStyle = "italic"
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
     await logout().then(window.location.href = "/logout")
})

function getTime() {
     const date = new Date();
     var hours = date.getHours()
     if (hours > 12) {
          hours -= 12
          dayString = " PM"
     } else {
          dayString = " AM"
     }
     if (date.getMinutes() < 10) {
          const minutes = "0" + date.getMinutes()
     } else {
          const minutes = date.getMinutes()
     }
     return hours + ":" + date.getMinutes() + dayString
}
