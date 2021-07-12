const moment = require('moment');
const mongoose = require('mongoose');
const Schema = mongoose.Schema
const PostMessage = new mongoose.Schema({
    UserCareID:{
        type: Schema.Types.ObjectId,
    },
    UserPostID :{
        type: Schema.Types.ObjectId,
    },
    PostID:{type:[]}
}, {
    collection: 'PostMessage',
    versionKey: false,
  })
module.exports = mongoose.model('PostMessage', PostMessage)