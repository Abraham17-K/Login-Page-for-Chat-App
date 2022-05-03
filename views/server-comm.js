const url = "http://localhost:3000"

window.onload = async function() {
     await sendLoginMessage()
}
async function getSessionUsername() {
     let result = await fetch(`${url}/getSession`).then(res => res.json())
     return result.username
}

async function sendMessage() {
     await fetch(`${url}/sendMessage`, {
          method: "POST",
          headers: {
               "Content-Type": "application/json"
          },
          body: JSON.stringify({
               message: input.value
          })
     })
}

async function sendLogoutMessage() {
     await fetch(`${url}/sendLogout`, {
          method: "POST",
          credentials: 'include',
          keepalive: true
     })
}

async function sendLoginMessage() {
     await fetch(`${url}/sendLogin`, {
          method: "POST",
          credentials: 'include',
          keepalive: true
     })
}

async function logout() {
     await fetch(`${url}/logout`, {
          method: "POST",
          credentials: 'include',
          keepalive: true
     })
}


async function signup() {

}