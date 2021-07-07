const formatMessage = require('./chatMessage');

module.exports = {
    rootSocket:function(io)  {
      //lắng nghe sự kiện kết nối lên server
        io.on('connection', function(socket){
            console.log("Connected user ",socket.rooms);
            //lắng nghe các sự kiện client gửi lên server với data là message
            socket.on('connect user', function(user){
              io.emit('connect user', user);
            });
          //lắng nghe các sự kiện client gửi lên server với data là message
           socket.on('on typing', function(typing){
              console.log("Typing.... ");
              //gửi message đến client
              io.emit('on typing', typing);
            });
           //lắng nghe các sự kiện client gửi lên server với data là message
            
           socket.on('chat message', (data) =>{ //recieves message from client-end along with sender's and reciever's details
            var dataElement = formatMessage(data); 
            /*mongoClient.connect(database, (err,db) => {
                if (err)
                    throw err;
                else {
                    var onlineUsers = db.db(dbname).collection(userCollection);
                    var chat = db.db(dbname).collection(chatCollection);
                    chat.insertOne(dataElement, (err,res) => { //inserts message to into the database
                        if(err) throw err;
                        socket.emit('message',dataElement); //emits message back to the user for display
                    });
                    onlineUsers.findOne({"name":data.toUser}, (err,res) => { //checks if the recipient of the message is online
                        if(err) throw err;
                        if(res!=null) //if the recipient is found online, the message is emmitted to him/her
                            socket.to(res.ID).emit('message',dataElement);
                    });
                }
                db.close();
               
            });*/
            io.emit('chat message', dataElement);
    
        });
            /*socket.on('chat message', function(msg){

              //console.log(msg)
              //console.log("Message " + msg);
               //gửi message đến client
              io.emit('chat message', msg);
            });*/
            /*socket.on('chat message', function(msg){
              io.emit('chat message', msg);
            });*/
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

