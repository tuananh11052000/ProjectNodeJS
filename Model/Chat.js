const moment = require('moment');
const mongoose = require('mongoose');
const Schema = mongoose.Schema
const chat = new mongoose({
    account:{
        type:String
    }
})