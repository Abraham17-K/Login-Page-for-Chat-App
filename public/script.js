const loginButton = document.getElementById("loginSubmit");

loginButton.addEventListener('click', async (event) => {
     let response = await fetch(`${url}/loginUser`, { method: 'POST', body: JSON.stringify({username: document.getElementById("usernameInput").value, password: document.getElementById("passwordInput").value})})
     console.log(response)
});