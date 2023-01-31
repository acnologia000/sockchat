const { readFileSync } = require('fs')

module.exports = {
    standardQuestions: ["please enter your question", "please enter your phone number"],
    getNanoSeconds: () => { return parseInt(process.hrtime().reduce((total, x) => total + x.toString())) },
    agentChatPage: readFileSync("./static/agent.html").toString(),
    makeid: function (length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },
    MessageInsertQuery: "INSERT INTO MESSAGES(chat_id, content, unix_time, sender_type) VALUES($1, $2::text, $3, $4::char)",
    AgentLoginQuery: "SELECT pass from agents where username = $1 and pass = $2"
}