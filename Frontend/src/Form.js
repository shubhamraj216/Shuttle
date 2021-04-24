import React, { Component } from 'react';
import './styles/Form.css'

class Form extends Component {
  constructor(props) {
    super(props);
    this.state = { query: "" }
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(evt) {
    this.setState({
      [evt.target.name]: evt.target.value
    })
  }

  handleSubmit(evt) {
    evt.preventDefault();
    if(this.state.query === '') {
      alert('Provide Some Input First');
      return;
    }
    this.props.search(this.state);
    this.setState({ query: "" });
  }
  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit} className='Form'>
          <input type='text'
            id='query'
            name='query'
            placeholder='Search Query'
            className ='Form-input'
            value={this.state.query}
            onChange={this.handleChange}
          />
          <button className='Form-button'>Search!</button>
        </form>
      </div>
    );
  }
}

export default Form;