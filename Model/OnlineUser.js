const mongoose = require('mongoose');
const Schema = mongoose.Schema
const OnlineUser = new mongoose.Schema({
    SenderUser:{
        type:String,
        ref: 'User'
    },
    SenderIDUser:{
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    ID:{
        type:String
    }
}, {
    collection: 'OnlineUser',
    versionKey: false,
  })
module.exports = mongoose.model('OnlineUser', OnlineUser)