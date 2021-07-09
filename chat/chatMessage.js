const moment = require('moment');

const formatMessage = (data) => {
    msg = {
        SenderUser:data.senderUser,
        SenderIDUser:data.senderIDUser,
        ReceiverUser:data.receiverUser,
        ReceiverIDUser:data.receiverIDUser,
        Message:data.msg,
        Date: moment().format("YYYY-MM-DD"),
        Time: moment().format("hh:mm a")
    }
    return msg;
}
module.exports=formatMessage;