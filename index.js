const express = require('express')
const http = require('http')
const { Server } = require("socket.io")
const app = express()
const server = http.createServer(app)
const io = new Server(server)
const { Pool } = require("pg")
const pool = new Pool({ host: "localhost", user: "postgres", database: "chat_app" })
pool.connect().catch(console.log)

// local imports
const misc = require("./misc.js")
const SessionX = require("./session.js")
const sessionPool = new SessionX()

var addressMap = new Map()
var GeneratedOTPs = new Map()

function sendOTP(username) { var rand = Math.floor(Math.random() * 10000); GeneratedOTPs.set(username, rand.toString()) }

//==============================================================================================================

app.use(express.static("./static"))
app.use(express.json())

app.post("/agent_login", async (req, res) => {
    console.log(req.body)
    pool.query(misc.AgentLoginQuery, [req.body.username, req.body.password], async (err, resp) => {
        if (err) { res.status(500); res.end("INTERNAL_SERVER_ERROR"); console.log(err.stack); return }
        resp.rowCount == 0 ? res.end("WRONG_CREDENTIALS") : res.end(`{"session_key":"${await sessionPool.StartSession(req.body.username)}"}`)
    })
})

app.get("/user/:id", (req, res) => { res.end(misc.agentChatPage.replace("COSTUMER_ID", req.params.id)) })
app.get("/otp_map/", (req, res) => { res.json(Object.fromEntries(GeneratedOTPs)) })

io.use(async (socket, next) => {
    const username = socket.handshake.auth.username
    const type = socket.handshake.auth.type
    const key = socket.handshake.auth.key

    if (!username || !key || !type) { return next(new Error("invalid username")) }
    console.log('middleware reached here')

    socket.username = username
    socket.key = key
    socket.type = type

    if (type === 'agent' || type === 'master') {
        if (!await sessionPool.VerifySession(key, username)) {
            socket.emit('auth:status', "failed auth, wrong credentials")
            console.log('authentication failed');
            next(new Error('wrong key'))
        } else {
        }
    }
    next();
});

io.on('connection', (socket) => {
    socket.responses = Array()
    socket.verified = false
    const users = [];

    for (let [id, socket] of io.of("/").sockets) { if (socket.username.includes("_user") && socket.verified) { users.push({ userID: id, username: socket.username, }) } }

    io.emit('users:list', users)

    if (socket.username.includes("_user")) { addressMap.set(socket.username, socket.id) }

    socket.on("question:submit", async (answer) => {
        socket.responses.push(answer)
        console.log(socket.responses);
        if (socket.responses.length != misc.standardQuestions.length + 1) {
            socket.emit("chat message", { content: misc.standardQuestions[socket.responses.length - 1] })
        } else {
            sendOTP(socket.username)
            socket.emit("chat message", { content: "otp sent on your phone number" })
            socket.emit("setqmode", 2)
        }
    })

    socket.on("otp:verify", (otp) => {
        if (GeneratedOTPs.get(socket.username) == otp) {
            socket.verified = true
            socket.emit("chat message", { content: "otp verified, now waiting for agent to connect" })
            socket.emit("setqmode", 3)

            try { pool.query('insert into inquiries values($1, $2, $3, $4)', [...socket.responses, misc.getNanoSeconds()]).then(console.log).catch(console.log) }
            catch (error) { console.log(error) }

            const ulist = [];
            for (let [id, socket] of io.of("/").sockets) { if (socket.username.includes("_user") && socket.verified) { ulist.push({ userID: id, username: socket.username, }) } }
            io.emit('users:list', ulist)
        } else { socket.emit("chat message", { content: "invalid otp, refresh page to try again" }) }
    })

    socket.on("message:private:permanent", ({ content, to }) => { socket.to(addressMap.get(to)).emit("chat message", { content, from: socket.id, }) });
    socket.on("private message", ({ content, to }) => { socket.to(to).emit("chat message", { content, from: socket.id, }) });
    socket.on("agent:connect:permanent", (data) => { socket.to(addressMap.get(data.to)).emit("agent:connect", { data: data, from: socket.id }) })
    socket.on("agent:connect", (data) => { socket.to(data.to).emit("agent:connect", { data: data, from: socket.id }) })

    socket.on('disconnect', (reason) => {
        const users = [];
        for (let [id, socket] of io.of("/").sockets) { if (socket.username.includes("_user") && socket.verified) { users.push({ userID: id, username: socket.username, }); } }
        io.emit('users:list', users)
    });
    socket.on("store:message", (message) => {
        pool
            .query(misc.MessageInsertQuery, [message.chat_id, message.content, misc.getNanoSeconds(), message.sender])
            .catch(console.log)
    })
});

server.listen(4000, "0.0.0.0", () => { console.log('listening on 0.0.0.0:4000') });