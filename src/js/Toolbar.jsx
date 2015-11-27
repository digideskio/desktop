var classNames = require('classnames');

var Toolbar = React.createClass({
  render: function() {
    return (
      <div className="toolbar">
        <Item name="movies" active={this.props.active} changeActive={this.props.changeActive} />
        <Item name="shows" active={this.props.active} changeActive={this.props.changeActive} />

        <div className="item search"></div>
      </div>
    );
  }
});

var Item = React.createClass({
  changeActive: function() {
    this.props.changeActive(this.props.name);
  },
  render: function() {
    var classes = {
      active: (this.props.active == this.props.name)
    };
    return (
      <div className={classNames('item', this.props.name, classes)} onClick={this.changeActive}></div>
    );
  }
});

module.exports = Toolbar;
