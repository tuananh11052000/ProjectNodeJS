const moment = require('moment');
const mongoose = require('mongoose');
const Schema = mongoose.Schema
const Message = new mongoose.Schema({
    SenderUser:{
        type:String
    },
    SenderIDUser:{
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    ReceiverUser:{
        type:String,
    },
    ReceiverIDUser:{
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    Message:{
        type:String,
    },
    Date:{
        type:String
    },
    Time:{
        type:String
    },
    // expireAt: {
    //     type: Date,
    //     default: Date.now,
    //     expireAfterSeconds: '2m' , // giới hạn thời gian 3 months
    //   },
}, {
    collection: 'Message',
    versionKey: false,
  })
module.exports = mongoose.model('Message', Message)