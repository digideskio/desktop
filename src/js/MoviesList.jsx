var MoviesList = React.createClass({
  componentDidMount: function() {
    var moviesList = this.refs.moviesList;
    moviesList.addEventListener('scroll', this.handleScroll);
  },
  componentWillUnmount: function() {
    var moviesList = this.refs.moviesList;
    moviesList.removeEventListener('scroll', this.handleScroll);
  },
  handleScroll: function() {
    var moviesList = this.refs.moviesList;
    var sh = moviesList.scrollWidth;
    var st = moviesList.scrollLeft;
    var oh = moviesList.offsetWidth;

    if (!this.props.loadingMore && st + oh >= sh - 100) { //Less than 100px from right
      this.props.loadMoreMovies();
    }
  },
  render: function() {
    var _self = this;
    var selectMovie = this.props.selectMovie;
    return (
      <div ref="moviesList" className="list scrollable">
      {this.props.movies.map(function(movie, i) {
        return (
          <Movie key={i} index={i} movie={movie} triggerSelect={selectMovie} />
        );
      })}
        <Loading />
      </div>
    )
  }
});

var Movie = React.createClass({
  select: function(e) {
    this.props.triggerSelect(this.props.index);
  },
  render: function() {
    return (
      <div className="item" onClick={this.select}>
        <img className="cover" src={this.props.movie.medium_cover_image} title={this.props.movie.title} />
      </div>
    );
  }
});

module.exports = MoviesList;
