import React, { Component } from 'react';

class Table extends Component {
    render() {
        let rows
        console.log(this.props)
        if (this.props.run) {
            rows = this.props.data.map(item => (
                <tr key={item.key}>
                    <td>{item.topic}</td>
                    <td>{item.start}</td>
                    <td><button className="btn btn-danger" onClick={() => this.props.kill(item.pid, true)}>Stop</button></td>
                </tr>
            ))
        } else {
            rows = this.props.data.map(item => {
                if(item.topic === undefined) {
                    return ""
                } else return <tr key={item.key}>
                    <td>{item.topic}</td>
                    <td>{item.start}</td>
                    <td>{item.stop}</td>
                </tr>
            })
        }
        return (
            <div>
                <table className="table table-hover table-striped" style={{ color: "white" }}>
                    <thead className="thead-dark">
                        <tr>
                            <th scope="col">Topic</th>
                            <th scope="col">Started At</th>
                            <th scope="col">{this.props.run ? "" : "Stopped At"}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>
        );
    }
}

export default Table;