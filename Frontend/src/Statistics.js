import React, { Component } from 'react';
import { Chart } from "react-google-charts";
var MongoClient = window.require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";

class Statistics extends Component {
  constructor() {
    super()
    this.state = {
      size: 0,
      numObj: 0,
      data: []
    }
  }

  formatBytes(a, b = 2) {
    if (0 === a) return "0 Bytes";
    const c = 0 > b ? 0 : b,
      d = Math.floor(Math.log(a) / Math.log(1024));
    return parseFloat((a / Math.pow(1024, d)).toFixed(c)) + " " + ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d]
  }

  async componentDidMount() {
    const client = new MongoClient(url, { useUnifiedTopology: true });
    await client.connect();
    const database = client.db('shuttle');
    const collection = database.collection('keyword');
    let res = await collection.stats()

    let set = new Set()

    await this.props.all.forEach(item => {
      set.add(item.topic)
    })

    let data = [['Topic', 'CrawledItems']]
    this.setState({ data: data })

    set.forEach(async (key) => {
      let result = await collection.findOne({ "keyword": key.toLowerCase() })
      if (result !== null && result !== undefined) {
        data = [key, result.url.length]
        this.setState(prev => ({ data: [...prev.data, data] }))
      }
    })

    this.setState({ size: res.size, numObj: res.count, avg: res.avgObjSize })
  }

  render() {
    console.log(this.state.data)
    return (
      <div className="row" style={{ margin: "1rem" }}>
        <div className="col-6">
          <Chart
            width={"100%"}
            height={700}
            chartType="PieChart"
            loader={<div>Loading Graph</div>}
            data={this.state.data}
            options={{
              title: 'Crawled number of weblinks',
              chartArea: { width: '90%', height: '90%' },
              hAxis: {
                title: 'Total Population',
                minValue: 0,
              },
              vAxis: {
                title: 'City',
              },
              is3D: true,
            }}
            legendToggle
          />

        </div>

        <div className="col-6" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h3>Size of DataBase: {this.formatBytes(this.state.size)}</h3>
          <h3>Topics Crawled: {this.state.data.length - 1}</h3>
          <h3>Average Object Size: {this.formatBytes(this.state.avg)}</h3>
        </div>
      </div>
    );
  }
}

export default Statistics;