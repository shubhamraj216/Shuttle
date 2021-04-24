import React, { Component } from 'react';
import './styles/Query.css';
class Query extends Component {
  render() {
    let res = this.props.queries.map(query =>
      <li className='Query-child' key={query.key}><a href={`${query.address}`} target='_blank' rel='noreferrer' style={{color: "white"}}>{query.address}</a><hr></hr></li>
    )
    let alpha, beta;
    if (this.props.query !== "") {
      alpha = <h6>About {this.props.queries.length} results ({(new Date() / 1000 - this.props.now).toFixed(4)} seconds)</h6>
      beta = `: ${this.props.query}`;
    }
    console.log(this.props.queries)
    return (
      <div className='Query col-10 scroll'>
        <h3 className='mt-3 Query-head'>Search Results {beta}</h3>
        {alpha}
        <ul className='qq'>
          {res}
        </ul>
      </div>
    )
  }
}

export default Query;