const mongoose = require('mongoose')
const { Schema } = mongoose


const messageSchema = ({
    chatId: ObjectID,
    sender: String,
    content: String,
    timeStamp: {
        type: Date,
        default: Date.now
    }
})

const Messages = mongoose.model('messages', messageSchema)
module.exports = Messages