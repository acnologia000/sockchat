const express = require('express')
const misc = require("./misc")
const http = require('http')
const { Server } = require("socket.io")
const app = express()
const server = http.createServer(app)
const { Pool } = require("pg")
const io = new Server(server)

//const PromiseRouter = require("express-promise-router")()

const pool = new Pool({ host: "localhost", user: "postgres", database: "chat_app" })
const masterUsername = process.env.MASTER_USERNAME
const masterPassword = process.env.MASTER_PASSWORD
const pageSize = 20
var masterSessionKey = ''

console.log(masterPassword, masterUsername)

if (!masterUsername || !masterPassword) {
    console.error("username or password not set, please set MASTER_USERNAME and MASTER_PASSWORD environment variables to proceed")
    process.exit(-1)
}

pool.connect().catch(e => { console.log(e); process.exit(-1) })

app.use(misc.logger)
app.use(express.static("./assets"))
app.use(express.json())

app.post("/login", (req, res) => {
    if (req.body.username == masterUsername && req.body.password == masterPassword) {
        masterSessionKey = misc.makeid(64)
        res.end(JSON.stringify({ "success": true, "key": masterSessionKey }))
        return
    }

    res.end({ "success": false })
})

app.post("/create_agent", (req, res) => {
    // if (req.body.token != masterSessionKey) {
    //     res.end("INVALID TOKEN")
    //     return
    // }

    pool.query(misc.AgentCreateQuery, [req.body.username, req.body.password], (err, _) => { !err ? res.end("SUCCESSFUL") : res.end(err) })
})

app.post("/get_chat_list/:page_number", async (req, res) => {

    // if (req.body.key) {
    //     res.end("INVALID_SESSION")
    // }

    let page_number = parseInt(req.params.page_number)
    console.log("page number %d", page_number);
    page_number <= 0 || isNaN(page_number) ? page_number = 0 : page_number = page_number - 1
    pool.query("select * from chat_sessions limit $1 offset $2", [pageSize, pageSize * page_number], (e, r) => {
        console.log('querry_returned');
        !e ? res.end(JSON.stringify(r.rows)) : () => { res.end(e) }
    })
})

app.post("/get_chat_messages/:chat_id", async (req, res) => {

    // if (!req.body.key) {
    //     res.end("INVALID_SESSION")
    // }
    pool.query("select * from messages where chat_id = $1", [req.params.chat_id], (e, r) => {
        console.log('querry_returned');
        !e ? res.end(JSON.stringify(r.rows)) : () => { res.end(e) }
    })
})

io.use((socket, next) => {
    const key = socket.handshake.auth.key
    if (!key || key != masterSessionKey) { return next(new Error("invalid key, please login")) }
    next()
})

io.on("connection", (socket) => {
    console.log("new connection");
})
server.listen(5000, "0.0.0.0", () => { console.log('listening on 0.0.0.0:5000') });
