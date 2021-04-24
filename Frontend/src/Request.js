import React, { Component } from 'react';
import './styles/Request.css';

class Request extends Component {

  render() {
    let requests = this.props.requests.reverse().map(request => (<li class='Request-child' key={request.key}>{`${request.from.substr(0, request.from.search('/'))}: ${request.query}`}</li>));
    return (
      <ul class='Request col-4 scroll'>
        <h3 className='mt-3'>Requests</h3>
        {requests}
      </ul>
    );
  }
}

export default Request;