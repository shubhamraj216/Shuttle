import React, { Component } from 'react';
import './styles/Crawl.css';
import axios from 'axios';
import { v1 as uuid } from 'uuid';
import Statistics from './Statistics';
import CrawlTopics from './CrawlTopics';
import History from './History';
const { Running, Stopped } = require('./Schema');
const spawn = window.require('child_process').spawn;
var mongoose = window.require("mongoose");
var uri = "mongodb://localhost:27017/shuttle";

class Crawl extends Component {
  constructor() {
    super();
    this.state = {
      active: 1,
      topics: [],
      running: [],
      stopped: [],
      newTopic: "",
      search: "",
      clicked: false
    }

    this.handleNavClick = this.handleNavClick.bind(this)
    this.handleCTSubmit = this.handleCTSubmit.bind(this)
    this.handleCTChange = this.handleCTChange.bind(this)
    this.handleSChange = this.handleSChange.bind(this)
    this.handleRClick = this.handleRClick.bind(this)
    this.handleDone = this.handleDone.bind(this)
    this.handleKillProcess = this.handleKillProcess.bind(this)
  }

  handleDone(items) {
    let okay = ""
    this.state.running.forEach(run => {
      items.forEach(item => {
        if (run.topic === item.topic) {
          okay = run.topic
        }
      })
    })
    if (okay !== "") {
      alert(`ERROR: ${okay} is already being crawled.`)
      return
    }
    const options = {
      slient: true,
      detached: true,
      stdio: [null, null, null, 'ipc']
    };
    let temp_run = items.map(item => {
      let child_process_obj

      if (window.navigator.platform.match("/Linux/i") !== null) {
        child_process_obj = spawn(`./Crawler`, [`${item.topic}`, "1000"], options);
      } else if (window.navigator.platform.match("/Win/i") !== null) {
        child_process_obj = spawn(`./Crawler.exe`, [`${item.topic}`, "1000"], options);
      }

      console.log(`Launched child process: PID: ${child_process_obj.pid}`);
      child_process_obj.on('exit', function (code, signal) {
        console.log('child process exited with ' +
          `code ${code} and signal ${signal}`);
      });
      child_process_obj.stdout.on('data', (data) => {
        console.log(`child stdout:\n${data}`);
      });

      child_process_obj.stderr.on('data', (data) => {
        console.error(`child stderr:\n${data}`);
      });
      child_process_obj.on('close', () => this.handleKillProcess(child_process_obj.pid, false));
      // let child_process_obj = {
      //   pid: 123
      // }
      return { ...item, pid: child_process_obj.pid, start: this.getDateTime() }
    })

    temp_run.forEach(item => {
      Running.create(item, function (err, _) {
        if (err) { console.log(err) }
      })
    })
    this.setState(st => ({ running: [...st.running, ...temp_run], active: 2 }))
  }

  handleRClick() {
    this.setState(st => ({ clicked: !st.clicked }))
  }

  handleNavClick(num) {
    this.setState({ active: num });
  }

  getDateTime() {
    let d = new Date()
    let x = d.toString().split(" ")

    return `${x[2]} ${x[1]} ${x[3]} ${x[4]}`;
  }

  handleCTChange(evt) {
    this.setState({ [evt.target.name]: evt.target.value })
  }

  handleSChange(evt) {
    this.setState({ [evt.target.name]: evt.target.value })
  }

  async handleKillProcess(pid, bool) {
    // if (window.navigator.platform.match("/Linux/i") !== null) {
    if (bool) {
      window.process.kill(pid, "SIGINT")
    }
    // } else if (window.navigator.platform.match("/Win/i") !== null) {
    // }
    let killed;
    this.state.running.forEach(item => {
      if (item.pid === pid) {
        killed = item
      }
    })

    if (killed === null || killed === undefined) {
      return
    }

    let running = this.state.running.filter(item => { return item.pid !== pid })

    if (this.state.running === running) {
      return
    }

    killed = await { ...killed, stop: this.getDateTime() }

    console.log(killed)
    await Running.findOneAndRemove({ pid: killed.pid }, (err) => {
      if (err) {
        console.log(err)
      }
    })

    await Stopped.create(killed, function (err, _) {
      console.log(killed)
      if (err) console.log(err)
    })

    this.setState({ running: running })
    this.setState(st => ({ stopped: [...st.stopped, killed] }))
  }

  async handleCTSubmit(evt) {
    evt.preventDefault()
    if (this.state.newTopic === '') {
      alert('Topic Should Not Be Empty');
      return;
    }
    let present = this.state.topics.find(topic => topic.topic.toLowerCase() === this.state.newTopic.toLowerCase());
    if (present) {
      alert('topic already present');
      this.setState({ newTopic: "" });
      return;
    }
    const res = await axios.post('/Topics', { topic: this.state.newTopic });

    if (res.data !== "Success") {
      alert("Some error Occurred, Please Try Again!")
    }

    this.setState(st => ({ newTopic: "", clicked: !st.clicked }));
  }

  async componentDidMount() {
    let getTopics = await axios('/Topics');
    let topics = getTopics.data.map(topic => ({ topic: topic, key: uuid() }));
    this.setState({ topics: topics });

    await mongoose.connect(uri, { useFindAndModify: false, useNewUrlParser: true, useUnifiedTopology: true })

    let running, stopped;
    running = await Running.find({})
    stopped = await Stopped.find({})
    let run = running.map(item => {
      return item._doc
    })
    let stop = stopped.map(item => {
      return item._doc
    })
    this.setState({ running: run, stopped: stop })
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevState.clicked !== this.state.clicked) {
      console.log("updating")
      let getTopics = await axios('/Topics');
      let topics = getTopics.data.map(topic => ({ topic: topic, key: uuid() }));
      this.setState({ topics: topics });
    }
  }

  componentWillUnmount() {
    mongoose.connection.close()
  }

  render() {
    return (
      <div>
        <ul className="nav nav-tabs Crawl-nav">
          <li className="nav-item">
            <div className={`Crawl-sub nav-link ${this.state.active === 0 && "Crawl-active"}`} onClick={() => this.handleNavClick(0)}>
              Statistics
            </div>
          </li>
          <li className="nav-item">
            <div className={`Crawl-sub nav-link ${this.state.active === 1 && "Crawl-active"}`} onClick={() => this.handleNavClick(1)}>
              Crawl Topics
            </div>
          </li>
          <li className="nav-item">
            <div className={`Crawl-sub nav-link ${this.state.active === 2 && "Crawl-active"}`} onClick={() => this.handleNavClick(2)}>
              History
            </div>
          </li>
        </ul>
        { this.state.active === 0 && <Statistics 
          all = {[...this.state.stopped, ...this.state.running]}/>}
        { this.state.active === 1 && <CrawlTopics
          valueC={this.state.newTopic}
          handleCTChange={this.handleCTChange}
          handleCTSubmit={this.handleCTSubmit}
          topics={this.state.topics}
          valueS={this.state.search}
          handleSChange={this.handleSChange}
          handleRClick={this.handleRClick}
          handleDone={this.handleDone}
        />}
        { this.state.active === 2 && <History
          running={this.state.running}
          stopped={this.state.stopped}
          handleKill={this.handleKillProcess}
        />}
      </div>
    );
  }
}

export default Crawl;