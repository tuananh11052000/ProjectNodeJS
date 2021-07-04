module.exports = {
    rootSocket:function(io)  {
      //lắng nghe sự kiện kết nối lên server
        io.on('connection', function(socket){
            console.log("Connected user ",socket.id);
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

            socket.on('chat message', function(msg){
              console.log("Message " + msg);
               //gửi message đến client
              io.emit('chat message', msg);
            });
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

