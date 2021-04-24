import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { v1 as uuid } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRedo } from '@fortawesome/free-solid-svg-icons'
import NewRoom from './NewRoom';
import SearchRoom from './SearchRoom';
import './styles/Home.css';

class Home extends Component {
  static defaultProps = {
    maxShow: 17
  }

  constructor() {
    super();
    this.state = {
      rooms: [],
      newRoom: "",
      searchRoom: "",
      fetching: true,
      clicked: false
    }
    this.handleNewRoomChange = this.handleNewRoomChange.bind(this);
    this.handleNewRoomSubmit = this.handleNewRoomSubmit.bind(this);

    this.handleSearchRoomChange = this.handleSearchRoomChange.bind(this);

    this.handleClick = this.handleClick.bind(this);
  }

  handleNewRoomChange(evt) {
    this.setState({ [evt.target.name]: evt.target.value })
  }

  handleNewRoomSubmit(evt) {
    evt.preventDefault();
    if (this.state.newRoom === '') {
      alert('RoomName Should Not Be Empty');
      return;
    }
    let present = this.state.rooms.find(room => room.room.toLowerCase() === this.state.newRoom.toLowerCase());
    if (present) {
      alert('Room already present');
      this.setState({ newRoom: "" });
      return;
    }

    let link = `/${this.state.newRoom}`;
    this.setState({ newRoom: "" });
    this.props.history.push(link);
  }

  handleSearchRoomChange(evt) {
    this.setState({ [evt.target.name]: evt.target.value });
  }

  handleClick() {
    this.setState(st => ({ clicked: !st.clicked, fetching: !st.fetching }));
  }

  async componentDidMount() {
    let getRooms = await axios('/getRooms');
    let rooms = getRooms.data.map(room => ({ room: room, key: uuid() }));
    this.setState({ rooms: rooms, fetching: false });
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevState.clicked !== this.state.clicked) {
      let getRooms = await axios('/getRooms');
      let rooms = getRooms.data.map(room => ({ room: room, key: uuid() }));
      this.setState({ rooms: rooms, fetching: false });
    }
  }

  render() {
    if (this.state.fetching) {
      return <div className="Home-Box-parent">
        <div className="Home-Box">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <h2>Getting Rooms...</h2>
      </div>
    }

    let searchRooms = this.state.rooms.filter(room => room.room.toLowerCase().includes(this.state.searchRoom.toLowerCase()));
    let rooms = searchRooms.slice(0, Math.min(this.props.maxShow, searchRooms.length)).map(room =>
      <Link key={room.key}
        className="Home-room col-md-4 col-sm-6 col-xs-12"
        to={`/${room.room}`}
      >
        {room.room}
      </Link>
    )
    
    let extra = <div className="Home-room-extra col-md-4 col-sm-6 col-xs-12">{searchRooms.length - this.props.maxShow} more rooms...</div>
    return (
      <div className="Home row">
        <NewRoom value={this.state.newRoom}
          handleChange={this.handleNewRoomChange}
          handleSubmit={this.handleNewRoomSubmit}
        />
        <SearchRoom value={this.state.searchRoom}
          handleChange={this.handleSearchRoomChange}
        />
        <button onClick={this.handleClick} className="col-lg-3 col-xs-12 Home-refresh"><FontAwesomeIcon className='Home-fa' icon={faRedo} />Refresh</button>
        {rooms}
        {(searchRooms.length > this.props.maxShow) && extra}
      </div>
    );
  }
}

export default Home;