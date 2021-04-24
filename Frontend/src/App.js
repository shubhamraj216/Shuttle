import React, { Component } from 'react';
import logo from './logo.svg';
import './styles/App.css';
import Router from './Router';
import NavBar from './NavBar';
import { nameFun } from './Usernames';

class App extends Component {
  constructor() {
    super();
    this.state = {
      name: ""
    }
  }
  componentDidMount() {
    let name = nameFun();
    // while (name === "") name = prompt("Enter your user handle. Dont use slash (/).");

    this.setState({ name: `${name}/${this.generateID()}` })
  }

  // Generator for USER ID
  generateID = () => {
    let s4 = function () {
      return Math.floor(Math.random() * 0x10000).toString(16);
    };
    return s4() + '-' + s4();
  }
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <NavBar name={this.state.name} />
          <Router id={this.state.name} />
        </header>
      </div>
    );
  }
}

export default App;
