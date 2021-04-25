import React, { Component } from 'react';
import io from 'socket.io-client';
import { v1 as uuid } from 'uuid';
import Peers from './Peers';
import Query from './Query';
// import Request from './Request';
import Form from './Form';
import { Link } from 'react-router-dom';
import './styles/WebRtc.css';
import { mongoSearch, compare } from './MongoHelp';
const { Running } = require('./Schema');
var MongoClient = window.require('mongodb').MongoClient;
const spawn = window.require('child_process').spawn;
var url = "mongodb://localhost:27017/";
let collection, collectionR;


let config = {
  'iceServers': [
    {
      'url': 'stun:stun.l.google.com:19302'
    },
    {
      "urls": "turn:13.27.10.1:3000?transport=tcp",
      "username": "shubham",
      "credential": "thunderBeast"
    }
  ]
};
let socket = io('http://localhost:3000');
let myID;
let myRoom;
let opc = {};
let apc = {};
let offerChannel = {};
let sendChannel = {};

let defaultChannel = socket;
let privateChannel = socket;

let urls = ["https://google.com", "https://ebay.com",
  "https://amazon.com", "https://msn.com",
  "https://yahoo.com", "https://wikipedia.org"];

let room_coord = false;
let child = []
let max_child = 100000000
let ct = 0
let coord = ""

class WebRtc extends Component {
  constructor(props) {
    super(props);
    this.state = {
      active: [],
      response: [],
      query: "",
      request: [],
      joining: true,
      now: new Date()
    }

    this.handleQuery = this.handleQuery.bind(this);
    this.handleClick = this.handleClick.bind(this);
  }

  setDefaultChannel = () => {
    defaultChannel.on('ipaddr', function (ipaddr) {
      console.log('Server IP address is: ' + ipaddr);
    });

    defaultChannel.on('created', (room) => {
      room_coord = true;
      console.log('Created room', room, '- my client ID is', myID);
      this.setUpDone();
    });

    defaultChannel.on('joined', (room) => {
      console.log('This peer has joined room', room, 'with client ID', myID);
      this.setUpDone();
    });

    defaultChannel.on('full', function (room) {
      alert('Room ' + room + ' is full. We will create a new room for you.');
      window.location.hash = '';
      window.location.reload();
    });

    defaultChannel.on('log', function (array) {
      console.log.apply(console, array);
    });

    defaultChannel.on('ready', (newParticipantID) => {
      console.log('Socket is ready');
      this.setState(prev => ({ active: [...prev.active, { active: newParticipantID, key: uuid() }] }));
    });

    // For creating offers and receiving answers(of offers sent).
    defaultChannel.on('message', (message) => {
      // console.log("##", message)
      if (message.type === 'newparticipant' && room_coord && (child.length < max_child || message.coord)) {
        console.log('Client received message for New Participation:', message);
        let partID = message.from;

        if (room_coord && !message.coord) {
          child.push(message.from)
        }

        offerChannel[partID] = socket;

        offerChannel[partID].on('message', (msg) => {
          if (msg.dest === myID) {
            if (msg.type === 'answer') {
              console.log('Got Answer.')
              opc[msg.from].setRemoteDescription(new RTCSessionDescription(msg.snDescription), function () { }, this.logError);
            } else if (msg.type === 'candidate') {
              console.log('Got ICE Candidate from ' + msg.from);
              opc[msg.from].addIceCandidate(new RTCIceCandidate({
                candidate: msg.candidate,
                sdpMid: msg.id,
                sdpMLineIndex: msg.label,
              }));
            }
          }
        });
        this.createOffer(partID);
      } else if (message.type === 'bye') {
        this.ParticipationClose(message.from);
      }
    });
  }


  setPrivateChannel = () => {
    // For receiving offers or ice candidates
    privateChannel.on('message', (message) => {
      if (message.dest === myID) {
        console.log('Client received message(Offer or ICE candidate):', message);
        if (message.type === 'offer' && ct === 0) {
          ct++;
          if (!room_coord)
            coord = message.from
          this.createAnswer(message, privateChannel, message.from);
        } else if (message.type === 'candidate') {
          apc[message.from].addIceCandidate(new RTCIceCandidate({
            candidate: message.candidate,
            sdpMid: message.id,
            sdpMLineIndex: message.label,
          }));
          if (this.state.active.length !== message.peers.length) {
            this.setState({ active: message.peers })
          }
        }
      }
    })
  }

  joinRoom = (roomName) => {
    myRoom = roomName;
    myID = this.props.id;

    console.log('My Id: ' + myID);

    this.setDefaultChannel();

    if (roomName !== '') {
      socket.emit('create or join', { room: myRoom, id: myID });
    }

    this.setPrivateChannel();

    window.onbeforeunload = function () {
      if (navigator.userAgent.indexOf("Chrome") !== -1) {
        for (let key in sendChannel) {
          if (sendChannel.hasOwnProperty(key) && sendChannel[key].readyState === 'open') {
            sendChannel[key].send(`-${myID}`);
          }
        }
      } else {
        socket.emit('message', { type: 'bye', from: myID });
      }
      return null;
    }
  }

  // When someone in room says Bye
  ParticipationClose = (from) => {
    console.log('Bye Received from client: ' + from);

    if (opc.hasOwnProperty(from)) {
      if (opc[from] !== null) {
        opc[from].close();
        opc[from].onicecandidate = null;
        opc[from] = null;
      }

    }

    if (apc.hasOwnProperty(from)) {
      if (apc[from] !== null) {
        apc[from].close();
        apc[from].onicecandidate = null;
        apc[from] = null;
      }
    }

    if (sendChannel.hasOwnProperty(from)) {
      delete sendChannel[from];
    }

    let active = this.state.active.filter(peer => peer.active !== from);
    this.setState({ active: active });

    if (!room_coord && from === coord) {
      room_coord = false;
      child = []
      ct = 0
      coord = ""

      this.setUpDone()
      setTimeout(() => {
        this.rejoin()
        this.setState({ joining: false })
      }, 1000)
    }
  }

  // Create Offer
  createOffer = (partID) => {
    console.log('Creating an offer for: ' + partID);
    opc[partID] = new RTCPeerConnection(config);
    opc[partID].onicecandidate = (event) => {
      console.log('IceCandidate event:', event);
      if (event.candidate) {
        offerChannel[partID].emit('message', {
          type: 'candidate',
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate,
          from: myID,
          dest: partID,
          peers: this.state.active
        });
      } else {
        console.log('End of candidates.');
      }
    };

    try {
      console.log('Creating Send Data Channel');
      sendChannel[partID] = opc[partID].createDataChannel('exchange', { reliable: false });
      this.onDataChannelCreated(sendChannel[partID], 'send');

      let LocalSession = (partID) => {
        return (sessionDescription) => {
          let channel = offerChannel[partID];

          console.log('Local Session Created: ', sessionDescription);
          opc[partID].setLocalDescription(sessionDescription, function () { }, this.logError);

          console.log('Sending Local Description: ', opc[partID].localDescription);
          channel.emit('message', { snDescription: sessionDescription, from: myID, dest: partID, type: 'offer' });
        }
      }
      opc[partID].createOffer(LocalSession(partID), this.logError);
    } catch (e) {
      console.log('createDataChannel failed with exception: ' + e);
    }
  }

  // Create Answer
  createAnswer = (msg, channel, to) => {
    console.log('Got offer. Sending answer to peer.');
    apc[to] = new RTCPeerConnection(config);
    apc[to].setRemoteDescription(new RTCSessionDescription(msg.snDescription), function () { }, this.logError);

    apc[to].ondatachannel = (event) => {
      console.log('onReceivedatachannel:', event.channel);
      sendChannel[to] = event.channel;
      this.onDataChannelCreated(sendChannel[to], 'receive');
    };

    let LocalSession = (channel) => {
      return (sessionDescription) => {
        console.log('Local Session Created: ', sessionDescription);
        apc[to].setLocalDescription(sessionDescription, function () { }, this.logError);
        console.log('Sending answer to ID: ', to);
        channel.emit('message', { snDescription: sessionDescription, from: myID, dest: to, type: 'answer' });
      }
    }
    apc[to].createAnswer(LocalSession(channel), this.logError);

    this.setState(prevState => ({ active: [...prevState.active, { active: to, key: uuid() }] }));
  }

  // Data Channel Setup
  onDataChannelCreated = (channel, type) => {
    console.log('onDataChannelCreated:' + channel + ' with ' + type + ' state');

    channel.onopen = this.ChannelStateChangeOpen(channel);
    channel.onclose = this.ChannelStateChangeClose(channel);

    channel.onmessage = this.receiveMessage();
  }

  ChannelStateChangeClose = (channel) => {
    return () => {
      console.log('Channel closed: ' + channel);
      delete sendChannel[channel];
    }
  }

  ChannelStateChangeOpen = (channel) => {
    return () => {
      console.log('Channel state: ' + channel.readyState);

      let open = this.checkOpen();
      this.enableDisable(open);
    }
  }

  // Check data channel open
  checkOpen = () => {
    let open = false;
    for (let channel in sendChannel) {
      if (sendChannel.hasOwnProperty(channel)) {
        open = (sendChannel[channel].readyState === 'open');
        if (open === true) {
          break;
        }
      }
    }
    return open;
  }

  enableDisable = (open) => {
    if (open) {
      console.log('CHANNEL opened!!!');
      this.setState({ joining: false })
    } else {
      console.log('CHANNEL closed!!!');
    }
  }

  // new joinee sends a message to peers for connection
  setUpDone = () => {
    console.log('Initial Setup Done ...');
    socket.emit('message', { type: 'newparticipant', from: myID, coord: room_coord }, myRoom);
  }

  receiveMessage = () => {
    let count = 0, currCount, str;
    return onmessage = (event) => {
      if (event.data.source === "react-devtools-content-script" || event.data.payload) return;
      console.log(event.data);
      if (event.data[0] === '-') {
        this.ParticipationClose(event.data.substr(1));
        return;
      }
      if (isNaN(event.data) === false) {
        count = parseInt(event.data);
        currCount = 0;
        str = "";
        console.log(`Expecting a total of ${count} characters.`);
        return;
      }
      if (count === 0) return;

      let data = event.data;
      str += data;
      currCount += str.length;
      console.log(`Received ${currCount} characters of data.`);

      if (currCount === count) {
        console.log(`Rendering Data`);
        console.log(str);
        this.renderMessage(str);
      }
    };
  }

  makeObj = (sender1, sender2, query, type, res) => {
    let Obj = {}
    Obj['sender1'] = sender1
    Obj['sender2'] = sender2
    Obj['query'] = query
    Obj['type'] = type
    Obj['res'] = res

    return Obj
  }

  sendAll = async (sender1, sender2, query, type, res) => {

    if (query === "") {
      alert("Nothing to send");
      return;
    }
    let CHUNK_LEN = 4000;

    let resObj = this.makeObj(sender1, sender2, query, type, res);

    let data = JSON.stringify(resObj);

    let len = data.length;
    let n = len / CHUNK_LEN | 0;

    if (!sendChannel) {
      alert('Connection has not been initiated. Get two peers in the same room first');
      this.logError('Connection has not been initiated. Get two peers in the same room first');
      return;
    }

    for (let key in sendChannel) {
      if (sendChannel.hasOwnProperty(key) && sendChannel[key].readyState === 'open') {
        console.log("Global: Sending a data of length: " + len);
        sendChannel[key].send(len);
      }
    }

    for (let key in sendChannel) {
      if (sendChannel.hasOwnProperty(key) && sendChannel[key].readyState === 'open') {
        for (let i = 0; i < n; i++) {
          let start = i * CHUNK_LEN,
            end = (i + 1) * CHUNK_LEN;
          console.log(start + ' - ' + (end - 1));
          sendChannel[key].send(data.substr(start, end));
        }
      }
    }

    for (let key in sendChannel) {
      if (sendChannel.hasOwnProperty(key) && sendChannel[key].readyState === 'open') {
        if (len % CHUNK_LEN) {
          console.log(n * CHUNK_LEN + ' - ' + len);
          sendChannel[key].send(data.substr(n * CHUNK_LEN));
        }
      }
    }
    console.log('Sent all Data!');

    if (sender1 === myID) {
      this.renderMessage(data);
    }
  }

  sendChild = async (sender1, sender2, query, type, res) => {

    if (query === "") {
      alert("Nothing to send");
      return;
    }
    let CHUNK_LEN = 4000;

    let resObj = this.makeObj(sender1, sender2, query, type, res);

    let data = JSON.stringify(resObj);

    let len = data.length;
    let n = len / CHUNK_LEN | 0;

    if (child.length === 0) {
      alert('Connection has not been initiated. Get two peers in the same room first');
      this.logError('Connection has not been initiated. Get two peers in the same room first');
      return;
    }

    for (let key in child) {
      if (sendChannel.hasOwnProperty(key) && sendChannel[key].readyState === 'open') {
        console.log("Global: Sending a data of length: " + len);
        sendChannel[key].send(len);
      }
    }

    for (let key in child) {
      if (sendChannel.hasOwnProperty(key) && sendChannel[key].readyState === 'open') {
        for (let i = 0; i < n; i++) {
          let start = i * CHUNK_LEN,
            end = (i + 1) * CHUNK_LEN;
          console.log(start + ' - ' + (end - 1));
          sendChannel[key].send(data.substr(start, end));
        }
      }
    }

    for (let key in child) {
      if (sendChannel.hasOwnProperty(key) && sendChannel[key].readyState === 'open') {
        if (len % CHUNK_LEN) {
          console.log(n * CHUNK_LEN + ' - ' + len);
          sendChannel[key].send(data.substr(n * CHUNK_LEN));
        }
      }
    }

    console.log('Sent all Data!');

    if (sender1 === myID) {
      this.renderMessage(data);
    }
  }

  sendOne = async (sender1, sender2, query, type, res, target) => {
    let CHUNK_LEN = 4000;

    let resObj = this.makeObj(sender1, sender2, query, type, res);

    console.log(resObj);
    let data = JSON.stringify(resObj);

    let len = data.length;
    let n = len / CHUNK_LEN | 0;

    if (!sendChannel[target]) {
      alert('Connection has not been initiated, or target is not in room.');
      this.logError('Connection has not been initiated, or target is not in room.');
      return;
    }

    if (sendChannel[target].readyState === 'open') {
      console.log("Private: Sending a data of length: " + len);
      sendChannel[target].send(len);
    }

    if (sendChannel[target].readyState === 'open') {
      for (let i = 0; i < n; i++) {
        let start = i * CHUNK_LEN,
          end = (i + 1) * CHUNK_LEN;
        console.log(start + ' - ' + (end - 1));
        sendChannel[target].send(data.substr(start, end));
      }
    }

    if (sendChannel[target].readyState === 'open') {
      if (len % CHUNK_LEN) {
        console.log(n * CHUNK_LEN + ' - ' + len);
        sendChannel[target].send(data.substr(n * CHUNK_LEN));
      }
    }

    console.log('Sent all Data!');
    this.setState(prevState => ({ request: [...prevState.request, { from: target, query: query, key: uuid() }] }))
  }

  getDateTime() {
    let d = new Date()
    let x = d.toString().split(" ")

    return `${x[2]} ${x[1]} ${x[3]} ${x[4]}`;
  }

  renderMessage = async (msg) => {
    let obj = JSON.parse(msg);
    let sender1 = obj.sender1,
      sender2 = obj.sender2,
      type = obj.type,
      query = obj.query,
      data = obj.res;

    let results = [];
    if (type === 'request') {
      if (sender1 === myID) {
        let tempResults = await mongoSearch(collection, obj);
        results = [...results, ...tempResults];
        let response = results.map(r => {
          if (r.key) return r;
          else return { ...r, key: uuid() };
        });
        this.setState({ response: response });
      } else {
        let res = await mongoSearch(collection, obj);
        if (res.length === 0) {
          if (room_coord) {
            let z = await collectionR.stats()
            if (z.count <= 5) {
              const options = {
                slient: true,
                detached: true,
                stdio: [null, null, null, 'ipc']
              };
              let child_process_obj;
              if (window.navigator.platform.includes("Linux") !== null) {
                child_process_obj = spawn(`./Crawler`, [`${query}`, "1000"], options);
              } else if (window.navigator.platform.includes("Win") !== null) {
                child_process_obj = spawn(`./Crawler.exe`, [`${query}`, "1000"], options);
              }
              console.log(`Launched child process: PID: ${child_process_obj.pid}`);
              child_process_obj.on('exit', function (code, signal) {
                console.log('child process exited with ' +
                  `code ${code} and signal ${signal}`);
              });
              child_process_obj.stdout.on('data', (data) => {
                console.log(`child stdout:\n${data}`);
              });

              child_process_obj.stderr.on('data', (data) => {
                console.error(`child stderr:\n${data}`);
              });
              child_process_obj.on('close', () => this.handleKillProcess(child_process_obj.pid, false));

              let Robj = { key: uuid(), topic: query.charAt(0).toUpperCase() + query.slice(1), pid: child_process_obj.pid, start: this.getDateTime() }

              Running.create(Robj, function (err, _) {
                if (err) { console.log(err) }
              })

            }
          }
          res = "1";
        }
        if (sender2 === "") {
          this.sendAll(sender1, myID, query, type, data)
          this.sendOne(sender1, myID, query, 'response', res, sender1)  // to querier
        } else if (room_coord) {
          this.sendChild(sender1, sender2, type, query, data)
          this.sendOne(sender1, sender2, query, 'response', res, sender1)  // to room_coord(askers)
        } else {
          this.sendAll(sender1, sender2, query, 'response', res); // leaf nodes
        }
      }
    } else {
      if (data[0] === "1") {
        console.log("A")
        return
      }

      if (sender2 !== myID && sender1 !== myID) {
        this.sendOne(sender1, sender2, query, 'response', data, sender2)
      }

      if (sender2 === myID && sender1 !== myID) {
        this.sendOne(sender1, sender2, query, 'response', data, sender1)
      }

      if (sender1 === myID) {
        results = [...results, ...data];
        console.log(results)
        results.sort(compare);
        let response = results.map(r => {
          if (r.key) return r;
          else return { ...r, key: uuid() };
        })

        this.setState({ response: response });
      }
    }
  }


  logError = (err) => {
    if (!err) return;
    if (typeof err === 'string') {
      console.warn(err);
    } else {
      console.warn(err.toString(), err);
    }
  }

  randomx = () => {
    let idx = Math.floor(Math.random() * urls.length);
    return urls[idx];
  }

  async componentDidMount() {
    const client = new MongoClient(url, { useUnifiedTopology: true });
    await client.connect();
    const database = client.db('shuttle');
    collection = database.collection('keyword');
    collectionR = database.collection('runnings')

    socket = io('http://localhost:3000');
    opc = {};
    apc = {};
    offerChannel = {};
    sendChannel = {};

    defaultChannel = socket;
    privateChannel = socket;

    let room = this.props.room;

    this.joinRoom(room);

    setTimeout(() => {
      this.rejoin()
      this.setState({ joining: false })
    }, 1000)
  }

  rejoin = () => {
    if (ct === 0) {
      room_coord = true;
      this.setUpDone()
    }
  }

  handleQuery(query) {
    this.setState({ now: new Date() / 1000, response: [], query: query.query })
    if (room_coord) {
      this.sendAll(myID, myID, query.query, "request", "");
    } else {
      this.sendAll(myID, "", query.query, "request", "");
    }
  }

  componentWillUnmount() {
    if (navigator.userAgent.indexOf("Chrome") !== -1) {
      for (let key in sendChannel) {
        if (sendChannel.hasOwnProperty(key) && sendChannel[key].readyState === 'open') {
          sendChannel[key].send(`-${myID}`);
        }
      }
    } else {
      socket.emit('message', { type: 'bye', from: myID });
    }
    socket.close();
  }

  handleClick() {
    socket.emit('message', { type: 'bye', from: myID });
    socket.close();
  }

  render() {
    if (this.state.joining) {
      return <div className="WebRtc-loading-parent">
        <div className="WebRtc-loading">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h2>Joining Room {this.props.room}</h2>
      </div>
    }
    return (
      <div className="WebRtc">
        <h3 className="WebRtc-head">Room: {this.props.room}</h3>
        <div className="row">
          <Query queries={this.state.response} query={this.state.query} now={this.state.now} />
          {/* <Request requests={this.state.request} /> */}
          <Peers peers={this.state.active} />
        </div>
        <div className="WebRtc-bottom">
          <Form search={this.handleQuery} className="WebRtc-form" />
          <Link to="/"><button onClick={this.handleClick} className="WebRtc-back">Exit Room</button></Link>
        </div>
      </div>
    );
  }
}
export default WebRtc;