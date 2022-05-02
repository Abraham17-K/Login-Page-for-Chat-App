const express = require("express")
const app = express()
const http = require("http").Server(app)
const io = require("socket.io")(http)
const port = process.env.PORT || 3000
const bcrypt = require("bcrypt")
const mysql = require("mysql")
const mongoose = require("mongoose")
const session = require("express-session")
const cookieParser = require("cookie-parser")
const MongoStore = require("connect-mongo")(session)
const sleep = ms => new Promise(r => setTimeout(r, ms));

const mongodbString = "mongodb://localhost:27017/chat-app-sessions"

const mongodbOptions = {
     useNewUrlParser: true,
     useUnifiedTopology: true
}

const connection = mongoose.createConnection(mongodbString, mongodbOptions)
const sessionStore = new MongoStore({
     mongooseConnection: connection,
     collection: "sessions"

})

require("dotenv").config()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('views'))
app.use(cookieParser())
app.use(session({
     secret: process.env.SESSION_SECRET,
     resave: false,
     saveUninitialized: true,
     store: sessionStore,
     cookie: { maxAge: 1000 * 60 * 60 * 24 }
}))

app.set("view engine", "ejs")

const db = mysql.createPool({
     host: process.env.DB_HOST,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_DATABASE,
     port: process.env.DB_PORT
})




app.get("/", (req, res) => {
     res.redirect("/login")
})

app.get("/signup", (req, res) => {
     if (req.session.username) {
          res.redirect("/app")
     } else {
          res.render('signup')
     }
})


app.post("/signup", async (req, res) => {
     const username = req.body.username
     if (!req.body.username || !req.body.password) {
          res.render('signup', {error: "Please enter a username and password"})
          return
     }
     const hashedPassword = await bcrypt.hash(req.body.password, 10)
     db.getConnection(async (err, connection) => {
          if (err) throw (err)
          const searchQuery = "SELECT * FROM usertable WHERE username = ?"
          const userSearchQuery = mysql.format(searchQuery, [username])
          await connection.query(userSearchQuery, async (err, response) => {
               if (err) throw (err)
               if (response.length > 0) {
                    connection.release()
                    res.render('signup', { error: "Account already exists" })
               } else {
                    const insertQuery = "INSERT INTO usertable VALUES (0, ?, ?)"
                    const useInsertQuery = mysql.format(insertQuery, [username, hashedPassword])
                    await connection.query(useInsertQuery, (err, response) => {
                         if (err) throw (err)
                         connection.release()
                         res.redirect("/login")
                    })
               }
          })
     })
})

app.get("/getSession", (req, res) => {
     res.json({ username: req.session.username })
})

app.get("/app", (req, res) => {
     if (!req.session.username) {
          res.redirect("/login")
          return
     }
     res.render('chat')
     io.emit("alert message", req.session.username + " has joined the chat")
})

app.get("/login", (req, res) => {
     console.log(req.session.username)
     if (!req.session.username) {
          res.render('login')
          return
     }
     res.redirect("/app")
})



app.get("/logout", (req, res) => {
     io.emit("alert message", req.session.username + " has left/minimized the chat")
     res.redirect("/login")
     req.session.destroy()
     res.send()
})

app.post("/sendMessage", (req, res) => {
     const message = req.body.message
     const username = req.session.username
     io.emit("chat message", username + " : " + message)
})

app.post("/sendLogout", (req, res) => {
     if (req.session.username === undefined) return
     io.emit("alert message", req.session.username + " has left/minimized the chat")
})

app.post("/sendLogin", (req, res) => {
     io.emit("alert message", req.session.username + " has joined the chat")
})

app.post("/login", (req, res) => {
     const username = req.body.username
     const password = req.body.password
     if (!username || !password) {
          res.render("login", { error: "Please enter a username and password" })
          return
     }
     db.getConnection(async (err, connection) => {
          const query = "SELECT * FROM usertable WHERE username = ?"
          const selectQuery = mysql.format(query, [username])
          await db.query(selectQuery, async (err, response) => {
               if (err) throw (err)
               connection.release()
               if (response.length > 0) {
                    if (await bcrypt.compare(password, response[0].password)) {
                         req.session.username = response[0].username
                         res.redirect("/app")
                         res.send()
                    } else {
                         res.render("login", { error: "Incorrect password" })
                    }
               } else if (response.length === 0) {
                    res.render("login", { error: "Account does not exist" })
               }
          })
     })
})

http.listen(port, () => {
     console.log(`Login page running at http://localhost:${port}/`)
})

io.on("connection", (socket) => {
     socket.on("chat message", (msg) => {
          io.emit("chat message", msg)
     })
     socket.on("alert message", (message) => {
          io.emit("alert messagee", message)
     })
})
