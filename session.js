const { createClient } = require("redis");
const misc = require("./misc.js");
const defaultEX = 86400
module.exports = class SessionX {
    constructor(duration) {
        duration == null || duration == undefined || !isNaN(duration) ? this.duration = defaultEX : this.duration = duration
        this.client = createClient()
        this.client.on('error', (err) => console.log('Redis Client Error', err));
        this.client.connect()
    }

    async StartSession(username) {
        var sessionID = misc.makeid(64)
        await this.client.set(sessionID, username, { EX: this.duration })
        return sessionID
    }

    async VerifySession(key, username) {
        var name = await this.client.get(key)
        if (username == name) {
            return true
        }
        return false
    }

}

