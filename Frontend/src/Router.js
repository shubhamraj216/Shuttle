import React, { Component } from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import WebRtc from './WebRtc';
import Home from './Home';
import Crawl from './Crawl';

class Router extends Component {
  constructor() {
    super();
    this.state = {
      rooms: []
    }
  }

  render() {
    let joinRoom = routerProps => {
      let room = routerProps.match.params.roomName;
      return <WebRtc room={room} {...routerProps} id={this.props.id} />
    }

    return (
      <div style={{zIndex: '20', height: '100vh', width: '90%'}}>
        <Switch>
          <Route exact path='/' render={(routerProps) => <Home {...routerProps} />} />
          <Route exact path='/crawler' render={() => <Crawl />} />
          <Route exact path='/:roomName' render={joinRoom} />
          <Redirect to='/' />
        </Switch>
      </div>
    );
  }
}

export default Router;