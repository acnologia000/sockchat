const { readFileSync } = require('fs')

module.exports = {
    standardQuestions: ["please enter your question", "please enter your phone number"],
    agentChatPage: readFileSync("./static/agent.html").toString(),
    MessageInsertQuery: "INSERT INTO MESSAGES(chat_id, content, unix_time, sender_type) VALUES($1, $2::text, $3, $4::char)",
    AgentLoginQuery: "SELECT pass from agents where username = $1 and pass = $2",
    AgentCreateQuery: "insert into agents values($1, $2)",
    ChatSessionCreateQuery: "insert into chat_sessions(chat_id , username, c_id) values($1,$2,$3)",
    getNanoSeconds: function () { return parseInt(process.hrtime().reduce((total, x) => total + x.toString())) },
    makeid: function (length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },
    chunkArray: function (array, n) {
        let splitArrays = [];
        let chunkSize = Math.ceil(array.length / n);
        for (let i = 0; i < array.length; i += chunkSize) {
            splitArrays.push(array.slice(i, i + chunkSize));
        }
        return splitArrays;
    },
    removeItemFromArray: function (array, item) {
        const index = array.indexOf(item);
        if (index !== -1) {
            array.splice(index, 1);
        }
        return array;
    },
    logger: (req, _, next) => {
        const date = new Date
        console.log("request %s at %s", req.url, date.toISOString())
        next()
    },
}