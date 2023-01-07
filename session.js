const { createClient } = require("redis");



module.exports = class SessionX {
    constructor(duration) {
        this.duration = duration
        this.client = createClient()
        this.client.on('error', (err) => console.log('Redis Client Error', err));
        this.client.connect()
    }

    StartSession() {

    }

    SetKeyVal(key, val) { }

}

