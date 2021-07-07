const moment = require('moment');

const formatMessage = (data) => {
    msg = {
        SenderUser:data.senderUser,
        SenderIDUser:data.senderIDUser,
        ReceiverUser:data.receiverUser,
        ReceiverIDUser:data.receiverIDUser,
        message:data.msg,
        date: moment().format("YYYY-MM-DD"),
        time: moment().format("hh:mm a")
    }
    return msg;
}
module.exports=formatMessage;