module.exports = {
    rootSocket:function(io)  {
        io.on('connection', function(socket){
            console.log("Connected user ",socket.id);
            socket.on('connect user', function(user){
              io.emit('connect user', user);
            });
          
            socket.on('on typing', function(typing){
              console.log("Typing.... ");
              io.emit('on typing', typing);
            });
          
            socket.on('chat message', function(msg){
              console.log("Message " + msg);
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

