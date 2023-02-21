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

var agentList = new Array()
var addressMap = new Map()
var GeneratedOTPs = new Map()

function sendOTP(username) { var rand = Math.floor(Math.random() * 10000); GeneratedOTPs.set(username, rand.toString()) }
async function Authencticate(body) { return await sessionPool.VerifySession(body.key, body.username) }
//==============================================================================================================

app.use(express.static("./static"))
app.use(express.json())

app.get("/user/:id", (req, res) => { res.end(misc.agentChatPage.replace("COSTUMER_ID", req.params.id)) })
app.get("/otp_map/", (req, res) => { res.json(Object.fromEntries(GeneratedOTPs)) }) // TODO:remove in production

app.post("/register_chat_session", async (req, res) => {
    if (!req.body.username || !req.body.key || ! await Authencticate(req.body)) {
        res.end("INVALID_AUTH")
        return
    }
    console.log("authenticating");
    pool.query(misc.ChatSessionCreateQuery, [req.body.chat_id, req.body.username, req.body.c_id], (err, _) => { !err ? res.end("SUCCESS") : res.end(err.message) })
})

app.post("/agent_login", async (req, res) => {
    console.log(req.body)
    pool.query(misc.AgentLoginQuery, [req.body.username, req.body.password], async (err, resp) => {
        if (err) { res.status(500); res.end("INTERNAL_SERVER_ERROR"); console.log(err.stack); return }
        resp.rowCount != 0 ?
            res.end(JSON.stringify({ 'session_key': await sessionPool.StartSession(req.body.username), 'username': req.body.username })) :
            res.end("WRONG_CREDENTIALS")
    })
})
app.post("/get_agent_list", (req, res) => {
    if (!Authencticate(req.body)) {
        res.end("INVALID_AUTH")
        return
    }

})

io.use(async (socket, next) => {
    const username = socket.handshake.auth.username
    const type = socket.handshake.auth.type
    const key = socket.handshake.auth.key

    if (!username || !key || !type) { return next(new Error("invalid username")) }

    socket.username = username
    socket.key = key
    socket.type = type
    console.log(type);
    if (type == 'agent' || type == 'chat_panel') {
        if (!await sessionPool.VerifySession(key, username)) {
            console.log('authentication failed');
            next(new Error('wrong key'))
        } else {
            console.log('agent added');
            type == 'agent' ? agentList.push(socket.id) : () => { }
        }
    } else {
        socket.taken = false
    }
    next();
});


io.on('connection', (socket) => {
    var current_user_list = () => { // retrieves list of usrs that are not take and verified 
        const users = []
        for (let [id, socket] of io.of("/").sockets) {
            if (socket.username.includes("_user") && socket.verified && !socket.taken) {
                users.push({ userID: id, username: socket.username, })
            }
        }
        return users
    }

    // distributes waiting / non taken users among agents
    var distribute_users = () => {
        if (agentList.length == 0) {
            console.log('distribute_users ran but agent list was 0')

            return
        }
        console.log('distribute_users ran for ', agentList.length, 'agents')
        let lists = misc.chunkArray(current_user_list(), agentList.length)
        console.log(lists);
        for (let index = 0; index < lists.length; index++) {
            const element = lists[index];
            socket.to(agentList[index]).emit("users:list", element)
        }
    }
    socket.responses = Array()
    socket.verified = false

    distribute_users()

    if (socket.username.includes("_user")) { addressMap.set(socket.username, socket.id) }

    socket.on("question:submit", async (answer) => {
        socket.responses.push(answer)
        //console.log(socket.responses);
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

            pool
                .query('insert into inquiries values($1, $2, $3, $4, $5)', [...socket.responses, misc.getNanoSeconds(), socket.username])
                .catch(console.log)

            distribute_users()
        } else { socket.emit("chat message", { content: "invalid otp, refresh page to try again" }) }
    })

    socket.on("message:private:permanent", ({ content, to }) => { socket.to(addressMap.get(to)).emit("chat message", { content, from: socket.id, }) });
    socket.on("private message", ({ content, to }) => { socket.to(to).emit("chat message", { content, from: socket.id, }) });
    socket.on("agent:connect:permanent", (data) => { socket.to(addressMap.get(data.to)).emit("agent:connect", { data: data, from: socket.id }) })
    socket.on("agent:connect", (data) => {
        socket.to(data.to).emit("agent:connect", { data: data, from: socket.id })
        distribute_users()
    })

    socket.on('disconnect', (reason) => {
        if (socket.type == 'agent') {
            agentList = misc.removeItemFromArray(agentList, socket.id)
        }
        distribute_users()
    });
    socket.on("store:message", (message) => {
        pool
            .query(misc.MessageInsertQuery, [message.chat_id, message.content, misc.getNanoSeconds(), message.sender])
            .catch(console.log)
    })
});

server.listen(4000, "0.0.0.0", () => { console.log('listening on 0.0.0.0:4000') });