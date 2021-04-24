'use strict';

let express = require('express'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'),
  http = require('http'),
  getTopicsRouter = require('./routes/topics'),
  getRoomsRouter = require('./routes/rooms');

let { rtc, room } = require('./webrtcServer');

const app = express();

app.use(bodyParser.json());
app.use(morgan("dev"));
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));

// Routes
app.use('/getRooms', function(req, res, next) {
  req.config = {
    room: [...room]
    // room: ['Travel', 'Humor', 'Health & Fitness', 'Movies', 'Sports', 'Art', 'Food & Drink', 'Technology', 'Music', 'Celebrities', ...room]
  }
  next();
}, getRoomsRouter);

app.use('/Topics', getTopicsRouter);

let server = http.createServer(app);

let port = 3001, hostname = 'localhost';
server.listen(port, hostname, () => {
  console.log(`Server is listening on port http://${hostname}:${port}`);
});

// WEBRTC
rtc(server);
