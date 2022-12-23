const express = require('express');
const { readFileSync } = require('fs');
const http = require('http');
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const standardQuestions = ["please enter your name", "please enter your question", "please enter your phone number"];

var addressMap = new Map()
var GeneratedOTPs = new Map()
//==============================================================================================================
const agentChatPage = readFileSync("./static/agent.html").toString()

app.use(express.static("./static"))
app.use(express.json())
app.get("/user/:id", (req, res) => {
    var id = req.params.id
    console.log(id)
    res.end(agentChatPage.replace("COSTUMER_ID", id))
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
    const users = [];
    for (let [id, socket] of io.of("/").sockets) {
        if (socket.username.includes("_user")) {
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

    socket.verified = false

    socket.emit("questions:sent", standardQuestions)

    socket.on("questions:submit", (answers) => { /*do something with answers*/ })

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

    socket.on("agent:connect:permanent", (data) => {
        console.log("agent:connect:permanent", data.to, "sock_addr", addressMap.get(data.to));
        socket.to(addressMap.get(data.to)).emit("agent:connect", { data: data, from: socket.id })
    })

    socket.on("agent:connect", (data) => {
        console.log("agent:connect", data.to);
        socket.to(data.to).emit("agent:connect", { data: data, from: socket.id })
    })

    socket.on('disconnect', (reason) => {
        console.log(reason);
        const users = [];
        for (let [id, socket] of io.of("/").sockets) {
            if (socket.username.includes("_user")) {
                users.push({
                    userID: id,
                    username: socket.username,
                });
            }
        }
        io.emit('users:list', users)
    });
});


server.listen(4000, "0.0.0.0", () => {
    console.log('listening on 0.0.0.0:4000');
});
