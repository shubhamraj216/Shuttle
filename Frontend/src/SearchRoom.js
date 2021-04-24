import React, { Component } from 'react';
import './styles/SearchRoom.css';

class SearchRoom extends Component {
  render() {
    return (
      <form className="col-lg-3 col-xs-12 SearchRoom">
        <input
          className="SearchRoom-input"
          type="text"
          name="searchRoom"
          placeholder="Search Room"
          value={this.props.value}
          onChange={this.props.handleChange}
        />
      </form>
    );
  }
}

export default SearchRoom;