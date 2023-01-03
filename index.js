const express = require('express');
const { readFileSync } = require('fs');
const http = require('http');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
//const redis = require('redis');
const { Pool } = require("pg")

const pool = new Pool({
    host: "localhost",
    user: "postgres",
    database: "chat_app",
})

pool.connect().catch(console.log)
const getNanoSeconds = () => { return parseInt(process.hrtime().reduce((total, x) => total + x.toString())) }


const standardQuestions = ["please enter your question", "please enter your phone number"];
//const client = redis.createClient()
// client.on('error', (err) => console.log('Redis Client Error', err));
// client.connect()
// client.set("local", "host")



var addressMap = new Map()
var GeneratedOTPs = new Map()

function sendOTP(username) {
    var rand = Math.floor(Math.random() * 10000)
    console.log("inserting OTP", username, "  ", rand);
    GeneratedOTPs.set(username, rand.toString())
    console.log(rand)
}
//==============================================================================================================
const agentChatPage = readFileSync("./static/agent.html").toString()

app.use(express.static("./static"))
app.use(express.json())
app.get("/user/:id", (req, res) => {
    var id = req.params.id
    console.log(id)
    res.end(agentChatPage.replace("COSTUMER_ID", id))
})

app.get("/otp_map/", (req, res) => {
    res.json(Object.fromEntries(GeneratedOTPs))
})


io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    if (!username) {
        return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
});

io.on('connection', (socket) => {
    socket.responses = Array()
    socket.verified = false
    const users = [];
    for (let [id, socket] of io.of("/").sockets) {
        if (socket.username.includes("_user") && socket.verified) {
            users.push({
                userID: id,
                username: socket.username,
            });
        }
    }
    
    io.emit('users:list', users)
    
    if (socket.username.includes("_user")) {
        addressMap.set(socket.username, socket.id)
        console.log(addressMap)
    }
    
    
    
    socket.on("question:submit", async (answer) => {
        socket.responses.push(answer)
        console.log(socket.responses);
        if (socket.responses.length != standardQuestions.length + 1) {
            socket.emit("chat message", { content: standardQuestions[socket.responses.length - 1] })
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
            pool.query('insert into inquiries values($1, $2, $3, $4)', [...socket.responses, getNanoSeconds()]).then(console.log).catch(console.log)
            let ulist = [];
            for (let [id, socket] of io.of("/").sockets) {
                if (socket.username.includes("_user") && socket.verified) {
                    ulist.push({
                        userID: id,
                        username: socket.username,
                    });
                }
            }
            console.log(ulist);
            io.emit('users:list', ulist)
        } else {
            socket.emit("chat message", { content: "invalid otp, refresh page to try again" })
        }
    })
    
    socket.on("message:private:permanent", ({ content, to }) => {
        console.log("private message sent to", to, "  ", addressMap.get(to))
        socket.to(addressMap.get(to)).emit("chat message", {
            content,
            from: socket.id,
        });
    });
    
    socket.on("private message", ({ content, to }) => {
        console.log("private message sent to", to)
        socket.to(to).emit("chat message", {
            content,
            from: socket.id,
        });
    });
    
    socket.on("agent:connect:permanent", (data) => { socket.to(addressMap.get(data.to)).emit("agent:connect", { data: data, from: socket.id }) })
    
    socket.on("agent:connect", (data) => { socket.to(data.to).emit("agent:connect", { data: data, from: socket.id }) })
    
    socket.on('disconnect', (reason) => {
        console.log(reason);
        const users = [];
        for (let [id, socket] of io.of("/").sockets) {
            if (socket.username.includes("_user") && socket.verified) {
                users.push({
                    userID: id,
                    username: socket.username,
                });
            }
        }
        io.emit('users:list', users)
    });
    const MessageInsertQuery = "INSERT INTO MESSAGES(chat_id, content, unix_time, sender_type) VALUES($1, $2::text, $3, $4::char)"
    socket.on("store:message", (message) => {
        pool
        .query(MessageInsertQuery, [message.chat_id, message.content, getNanoSeconds(), message.sender])
        .catch(console.log)
        
    })
});


server.listen(4000, "0.0.0.0", () => {
    console.log('listening on 0.0.0.0:4000');
});

