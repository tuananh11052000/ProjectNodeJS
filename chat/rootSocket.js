const formatMessage = require('./chatMessage');
const User = require('../Model/User');
const Message = require('../Model/Message');
const OnlineUser = require('../Model/OnlineUser');
module.exports = {
  rootSocket: function (io) {
    //lắng nghe sự kiện kết nối lên server
    io.on('connection', function (socket) {
      //lắng nghe các sự kiện client gửi lên server với data là message
      socket.on('connect user', function (user) {
        io.emit('connect user', user);
      });

      //lắng nghe các sự kiện client gửi lên server với data là message 
      socket.on('chat message', (data) => { //recieves message from client-end along with sender's and reciever's details
        var dataElement = formatMessage(data);
        Message.insertMany(dataElement, (err, res) => { //inserts message to into the database
          if (err) throw err;
          socket.emit('message', dataElement); //emits message back to the user for display
        });
        OnlineUser.findOne({ 'SenderIDUser': dataElement.ReceiverIDUser }, (err, res) => {
          if (err) throw err;
          if (res != null)
          socket.to(res.ID).emit('message', dataElement);
        })
      });
      var FromID;
      var userID = socket.id;
      socket.on('userDetails', (data) => { //checks if a new user has logged in and recieves the established chat details//kiểm tra nếu một người dùng đăng nhập vào và nhận được chi tiết tin nhắn đã tồn tại
        var onlineUser = new OnlineUser({ //forms JSON object for the user details// tạo một file JSON chứa thông tin người dùng
          "SenderIDUser": data.fromIDUser,
          "SenderUser": data.fromUser,
          "ID": userID
        });
        FromID = data.fromIDUser
        OnlineUser.insertMany(onlineUser, (err, res) => { //inserts the logged in user to the collection of online users//thêm người dùng đã đăng nhập vào trong danh sách những người dùng đang hoạt động
          if (err) throw err;
          //console.log(data.fromUser + " is online...");
        });
        Message.find({ //finds the entire chat history between the two people//tìm tất cả lịch sử trò chuyện giữa hai người
          "SenderIDUser": { "$in": [data.fromIDUser, data.toIDUser] },
          "ReceiverIDUser": { "$in": [data.fromIDUser, data.toIDUser] }
        }, (err, res) => {
          socket.emit('output', res);

        })
        //console.log(res);
        //emits the entire chat history to client//gửi toàn bộ lịch sử chat cho người dùng
      });
      socket.on('disconnect',async () => {
        console.log("-----------------------")
        await OnlineUser.deleteMany( {"SenderIDUser": FromID} , function (err, res) { //if a user has disconnected, he/she is removed from the online users' collection//nếu một người dùng ngắt kết nối, anh ấy/cô ấy sẽ bị đưa ra khỏi danh sách những người dùng đang hoạt động
          if (err) throw err;
        });
        socket.disconnect()
      });

    });
  }
}
/*
const rootSocket = (io) => {
    io.on('connection', (socket) => {
        console.log('New connection');
          // possibility to outsource events
         socket.on('myEvent', () => {
           console.log('myEvent triggered');
         });
    });
}
module.exports = rootSocket;*/

