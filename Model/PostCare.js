const moment = require('moment');
const mongoose = require('mongoose');
const Schema = mongoose.Schema
const PostMessage = new mongoose.Schema({
    PostID:{
        type: Schema.Types.ObjectId,
    },
    UserCareID:{type:[]}
}, {
    collection: 'Message',
    versionKey: false,
  })
module.exports = mongoose.model('Message', Message)