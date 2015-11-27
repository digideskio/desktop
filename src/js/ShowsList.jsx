const config = require('../../config.js');

var ShowsList = React.createClass({
  componentWillMount: function() {
    window.resizeTo(config.main_window.w, config.main_window.h)
  },
  componentDidMount: function() {
    var showsList = this.refs.showsList;
    showsList.addEventListener('scroll', this.handleScroll);
  },
  componentWillUnmount: function() {
    var showsList = this.refs.showsList;
    showsList.removeEventListener('scroll', this.handleScroll);
  },
  handleScroll: function() {
    var showsList = this.refs.showsList;
    var sh = showsList.scrollWidth;
    var st = showsList.scrollLeft;
    var oh = showsList.offsetWidth;

    if (!this.props.loadingMore && st + oh >= sh - 100) { //Less than 100px from right
      this.props.loadMoreShows();
    }
  },
  render: function() {
    var _self = this;
    var selectShow = this.props.selectShow;
    return (
      <div ref="showsList" className="list scrollable">
      {this.props.shows.map(function(show, i) {
        return (
          <Show key={i} index={i} show={show} triggerSelect={selectShow} />
        );
      })}
        <Loading />
      </div>
    )
  }
});

var Show = React.createClass({
  select: function(e) {
    this.props.triggerSelect(this.props.index);
  },
  render: function() {
    return (
      <div className="item" onClick={this.select}>
        <img className="cover" src={this.props.show.images.poster} title={this.props.show.title} />
      </div>
    );
  }
});

module.exports = ShowsList;
