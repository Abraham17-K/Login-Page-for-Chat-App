const express = require("express")
const app = express()
const http = require("http").Server(app)
const io = require("socket.io")(http)
const port = process.env.PORT || 3000
const bcrypt = require("bcrypt")
const mongoose = require("mongoose")
const client = require('mongodb').MongoClient;
const session = require("express-session")
const cookieParser = require("cookie-parser")
const { time } = require("console")
const MongoStore = require("connect-mongo")(session)
require("dotenv").config()

const mongodbString = `mongodb+srv://${process.env.SESSION_USERNAME}:${process.env.SESSION_PASSWORD}@chat-ap-sessions.szkry.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
const mongodbOptions = {
     useNewUrlParser: true,
     useUnifiedTopology: true
}

const connection = mongoose.createConnection(mongodbString, mongodbOptions)
const sessionStore = new MongoStore({
     mongooseConnection: connection,
     collection: "sessions"

})


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
          res.render("signup", { error: "Please enter a username and password" })
          return
     }
     const hashedPassword = await bcrypt.hash(req.body.password, 10)
     client.connect(mongodbString, async (err, db) => {
          if (err) {
               res.render("signup", { error: "Error signing up. Please try again later." })
               throw (err)
          } else {
               const collection = db.db("chat-app-users").collection("userCollection")
               collection.findOne({ username: username }, async (err, result) => {
                    if (err) throw (err)
                    if (result != null) {
                         res.render("signup", { error: "Account already exists" })
                         await db.close()
                    } else {
                         collection.insertOne({ username: username, password: hashedPassword }, async (err, result) => {
                              if (err) throw (err)
                              req.session.username = username
                              res.redirect("/login")
                              res.send()
                              await db.close()
                         })
                    }
               })
          }
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
     if (!checkSession(username)) {
          res.redirect("/login")
     } else {
          io.emit("chat message", username + ": " + message)
     }
     res.send()
})

app.post("/sendLogout", (req, res) => {
     if (!checkSession(req.session.username)) {
          res.redirect("/login")
          res.send()
          return
     } 
     io.emit("alert message", req.session.username + " has left/minimized the chat")
     res.send()
})

app.post("/sendLogin", (req, res) => {
     if (!checkSession(req.session.username)) {
          res.redirect("/login")
          res.send()
          return
     }
     io.emit("alert message", req.session.username + " has joined the chat")
     res.send()
})


app.post("/login", (req, res) => {
     const username = req.body.username
     const password = req.body.password
     if (!username || !password) {
          res.render("login", { error: "Please enter a username and password" })
          return
     }
     client.connect(mongodbString, async (err, db) => {
          if (err) throw (err)
          const collection = db.db("chat-app-users").collection("userCollection")
          collection.findOne({ username: username }, async (err, result) => {
               if (err) {
                    res.render("login", { error: "Error logging in. Please try again later." })
                    throw (err)
               }
               if (result != null) {
                    if (await bcrypt.compare(password, result.password)) {
                         req.session.username = result.username
                         res.redirect("/app")
                         res.send()
                    } else {
                         res.render("login", { error: "Incorrect password" })
                    }
               } else if (result == null) {
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


function checkSession(username) {
     if (username == undefined) {
          return false
     } else {
          return true
     }
}