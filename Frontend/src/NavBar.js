import React, { Component } from 'react';
// import logo from './logo.svg';
import { Link } from 'react-router-dom';
import './styles/NavBar.css';

class NavBar extends Component {
  render() {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark justify-content-between NavBar" >
        {/* <Link to="/crawler"><img src={logo} alt='logo' className="NavBar-img" /></Link> */}
        <Link to="/crawler" style={{textDecoration:"none"}}><h3 className="shuttle">Crawler</h3></Link>
        <Link to="/" style={{textDecoration:"none"}}><h3 className="shuttle">Shuttle</h3></Link>
        <span id="navbar-text">
          Welcome {this.props.name.substr(0, this.props.name.search('/'))}
        </span>
      </nav>
    );
  }
}

export default NavBar;
