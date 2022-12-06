const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html');
// });

app.use(express.static("./static"))

io.use((socket, next) => {
    const username = socket.handshake.auth.user_name;
    if (!username) {
        return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
});

io.on('connection', (socket) => {
    const users = [];
    for (let [id, socket] of io.of("/").sockets) {
        users.push({
            userID: id,
            username: socket.username,
        });


    }

    io.emit('users:list', users)
    socket.on("private message", ({ content, to }) => {
        console.log("private message sent to", to)
        socket.to(to).emit("chat message", {
            content,
            from: socket.id,
        });
    });
});



server.listen(4000, "0.0.0.0", () => {
    console.log('listening on 0.0.0.0:4000');
});

//server.listen()
// socket.on('chat message', (msg) => {
//     io.emit('chat message', msg);
// });