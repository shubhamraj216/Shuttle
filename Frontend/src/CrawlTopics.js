import React, { Component } from 'react';
import './styles/Crawl.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRedo, faTimesCircle, faCheckSquare } from '@fortawesome/free-solid-svg-icons'

class CrawlTopics extends Component {
  static defaultProps = {
    maxShow: 20
  }

  constructor() {
    super();
    this.state = {
      active: []
    }
    this.handleClick = this.handleClick.bind(this)
    this.handleDone = this.handleDone.bind(this)
    this.handleRemoveClick = this.handleRemoveClick.bind(this)
  }

  handleDone() {
    this.props.handleDone(this.state.active)
    this.setState({active: []})
  }

  handleClick(topic) {
    let dupli = false;
    this.state.active.forEach(item => {
      if (item.key === topic.key) {
        dupli=true
      }
    })
    
    if (dupli) {
      alert(`Can't Select one item twice`)
      return;
    }

    this.setState(st => ({active: [...st.active, {topic: topic.topic, key: topic.key}]}))
  }

  handleRemoveClick(topic) {
    let removed = this.state.active.filter(item => item.key !== topic.key)
    this.setState({active: removed})
  }

  render() {
    let searchtopics = this.props.topics.filter(topic => topic.topic.toLowerCase().includes(this.props.valueS.toLowerCase()));
    let topics = searchtopics.slice(0, Math.min(this.props.maxShow, searchtopics.length)).map(topic =>
      <button key={topic.key} className="CT-button" onClick={() => this.handleClick(topic)}
      >
        {topic.topic}
      </button>
    )
    
    let extra = <div className="Home-topic-extra col-md-4 col-sm-6 col-xs-12">{searchtopics.length - this.props.maxShow} more topics...</div>

    let selected = this.state.active.map(topic => 
      <button key={topic.key} className="CT-button enabled"
      >
        {topic.topic} &nbsp; <FontAwesomeIcon className='Home-fa' onClick={() => this.handleRemoveClick(topic)} icon={faTimesCircle} />
      </button>
    )

    return (
      <div>
        <div className="row">
          <form onSubmit={this.props.handleCTSubmit} className='Form col-6'>
            <input 
              type='text'
              id='topics'
              name='newTopic'
              placeholder='Create New Topic'
              className='Form-input'
              value={this.props.valueC}
              onChange={this.props.handleCTChange}
            />
            <button className='Form-button'>Create!</button>
          </form>
          <form className="col-3 Form" style ={{marginTop: "0.3em"}}>
            <input
              type="text"
              name="search"
              placeholder="Search Topic"
              className='Form-input'
              value={this.props.valueS}
              onChange={this.props.handleSChange}
            />
          </form>
          <button onClick={this.props.handleRClick} className="col-2 Home-refresh"><FontAwesomeIcon className='Home-fa' icon={faRedo} />Refresh</button>
        </div>
        <div>
          {selected}
          {selected.length !== 0 ? 
          <button className='CT-button' id="CT-done" onClick={this.handleDone}><FontAwesomeIcon icon={faCheckSquare} />Done</button> :
          ""}
          <hr/>
        </div>
        <h3>Select a maximum of 3 topics(Recommended)</h3>
        {topics} 
        {(searchtopics.length > this.props.maxShow) && extra}
      </div>
    );
  }
}

export default CrawlTopics;