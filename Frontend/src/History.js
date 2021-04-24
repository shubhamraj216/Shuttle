import React, { Component } from 'react';
import Table from './Table'

class History extends Component {
  render() {
    return (
      <div>
        <div className="row">
          <div className="col-6">
            Running
            <Table
              run={true}
              data={this.props.running}
              kill={this.props.handleKill}
            />
          </div>
          <div className="col-6">
            Stopped
            <Table
              run={false}
              data={this.props.stopped}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default History;