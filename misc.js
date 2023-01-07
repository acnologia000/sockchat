const { readFileSync } = require('fs')

module.exports = {
    standardQuestions: ["please enter your question", "please enter your phone number"],
    getNanoSeconds: () => { return parseInt(process.hrtime().reduce((total, x) => total + x.toString())) },
    agentChatPage: readFileSync("./static/agent.html").toString()
}