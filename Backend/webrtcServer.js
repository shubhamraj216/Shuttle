let socketIO = require('socket.io'),
    rooms = new Set();

exports.rtc = (server) => {
  let io = socketIO(server);

  io.sockets.on('connection', function (socket) {
    function log() {
      let array = ['Message from server:'];
      array.push.apply(array, arguments);
      socket.emit('log', array);
    }

    socket.on('message', function (message) {
      log('Client said this: ', message);
      log('Room: ', socket.room);
      socket.broadcast.to(socket.room).emit('message', message);
    });

    socket.on('create or join', function (message) {
      let room = message.room;
      socket.room = room;
      let clientID = message.id;

      log('Received request to create or join room ' + room);

      let clientsInRoom = io.sockets.adapter.rooms.get(room);
      let numClients = clientsInRoom ? clientsInRoom.size : 0;
      log('Room ' + room + ' now has ' + numClients + ' client(s)');

      if (numClients === 0) {
        rooms.add(room);
        socket.join(room);
        log('Client ID ' + clientID + ' created room ' + room);
        socket.emit('created', room);
      } else {
        log('Client ID ' + clientID + ' joined room ' + room);
        socket.join(room);
        socket.emit('joined', room);
      }
      io.sockets.in(room).emit('ready', clientID);
    });
  });
}

exports.room = rooms;

