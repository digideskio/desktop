var Loading = React.createClass({
  render: function() {
    return (
      <div className="spinnerContainer">
        <div className="spinner"><img src="../build/images/pocho.png" width="32" height="32" /></div>
      </div>
    );
  }
});

module.exports = Loading;
