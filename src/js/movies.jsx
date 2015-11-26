var superagent = require('superagent');
var OS = require('opensubtitles-api');
var MovieDB = require('moviedb')('22a47483fdde69c188979a6d2213c84b');

const config = require('../config.js')
const electron = require('electron');
const remote = electron.remote;
const BrowserWindow = remote.BrowserWindow;

const Loading = require('../build/js/Loading');
const MoviesList = require('../build/js/MoviesList');

var PopcornTime = React.createClass({
  getInitialState: function() {
    return {
      selected: null,
      movies: {
        list: [],
        page: 0,
        loading: false
      },
      moviesPage: 0
    };
  },
  componentDidMount: function() {
    this.loadMoreMovies();
  },
  loadMoreMovies: function() {
    var movies = this.state.movies;
    movies.loading = true;
    this.setState({movies: movies});
    var page = this.state.movies.page + 1;

    superagent
      .get('https://yts.ag/api/v2/list_movies.json')
      .query({
        sort_by: 'download_count',
        page: page
      })
      .set('Accept', 'application/json')
      .end(function(err, res){
        if (res.body.status == 'ok') {
          var movies = {list: this.state.movies.list.concat(res.body.data.movies), page: page, loading: false};
          this.setState({movies: movies});
        }
      }.bind(this));
  },
  selectMovie: function(index) {
    this.resizeWindow(config.film_window.w, config.film_window.h);
    this.setState({selected: index});

    var movie = this.state.movies.list[index];
    if (!movie.plot) {
      this.loadPlot(index);
    }
    if (!movie.subtitles) {
      this.loadSubtitles(index);
    }
  },
  unselectMovie: function() {
    this.resizeWindow(config.main_window.w, config.main_window.h);
    this.setState({selected: null});
  },
  resizeWindow: function(w, h) {
    window.resizeTo(w, h);
  },
  loadPlot: function(index) {
    var movies = this.state.movies;
    var movie = movies.list[index];

    MovieDB.movieInfo({id: movie.imdb_code }, function(err, res){
      if (res) {
        movie.plot = res.overview;
        movie.backdrop_image = 'https://image.tmdb.org/t/p/original/' + res.backdrop_path;
        movies.list[index] = movie;
        this.setState({movies: movies});
      }
    }.bind(this));
  },
  loadSubtitles: function(index) {
    var movies = this.state.movies;
    var movie = movies.list[index];

    var OpenSubtitles = new OS({
      useragent:'Popcorn Time v2',
      username: 'popcorntime2',
      password: 'popcorntime2',
    });
    OpenSubtitles.search({
      filesize: movie.torrents[0].size_bytes,
      imdbid: movie.imdb_code
    }).then(function(subtitles) {
      movie.subtitles = subtitles;
      movies.list[index] = movie;
      this.setState({movies: movies});
    }.bind(this));
  },
  render: function() {
    var Content;
    if (!this.state.movies.list.length) {
      Content = <div><Loading /></div>;
    } else {
      if (this.state.selected) {
        var movie = this.state.movies.list[this.state.selected];
        Content = <Movie movie={movie} unselectMovie={this.unselectMovie} />;
      } else {
        Content = (
          <div>

            <div className="toolbar">
              <div className="item movies active"></div>
              <div className="item series"></div>

              <div className="item search"></div>
            </div>

            <MoviesList movies={this.state.movies.list} selectMovie={this.selectMovie} loadMoreMovies={this.loadMoreMovies} loadingMore={this.state.movies.loading} />
          </div>
        );
      }
    }
    return (
      <div>{Content}</div>
    );
  }
});

var Movie = React.createClass({
  getInitialState: function() {
    return {
      scene: 'main',
      subtitle: null,
      torrent: 0,
    };
  },
  playMovie: function() {
    var movie = this.props.movie;

    var PlayerWindow = new BrowserWindow({
      title: movie.title,
      width: 800,
      height: 500,
      show: true,
      resizable: false,
      alwaysOnTop: false,
      skipTaskbar: false,
      frame: true,
      type: "dock"
    });

    var params = [];
    params.push('torrent=' + this.state.torrent);
    if (this.state.subtitle) {
      params.push('subtitles=' + this.state.subtitle);
    }
    var query = params.join('&');
    PlayerWindow.loadURL('file://' + __dirname + '/player.html?' + query);
    PlayerWindow.webContents.openDevTools();
    PlayerWindow.webContents.on('did-finish-load', function() {
      PlayerWindow.webContents.send('setMovie', movie);
    });
  },
  qualityScene: function() {
    this.setState({scene: 'quality'});
  },
  subtitlesScene: function() {
    this.setState({scene: 'subtitles'});
  },
  backButton: function() {
    switch (this.state.scene) {
      case 'quality':
      case 'subtitles':
        this.setState({scene: 'main'});
        break;
      default:
        this.props.unselectMovie();
    }
  },
  selectQuality: function(index, event) {
    this.setState({torrent: index, scene: 'main'});
  },
  selectSubtitle: function(key, event) {
    this.setState({subtitle: key, scene: 'main'});
  },
  render: function() {
    var Scene;
    var movie = this.props.movie;

    switch (this.state.scene) {
      case 'quality':
        Scene = <QualityScene
          movie={movie}
          selectQuality={this.selectQuality} />;
        break;
      case 'subtitles':
        Scene = <SubtitlesScene
          selectSubtitle={this.selectSubtitle}
          movie={movie} />;
        break;
      default:
        Scene = <MovieMain {...this.props}
          quality={this.state.torrent}
          subtitle={this.state.subtitle}
          qualityScene={this.qualityScene}
          subtitlesScene={this.subtitlesScene}
          playMovie={this.playMovie} />;
    }

    var styles = {
      cover: {
        width: '100%'
      }
    };

    return (
      <div>
        <div className="toolbar">
          <div className="item back" onClick={this.backButton}></div>
          <div className="item title">{movie.title}</div>
        </div>
        <div className="content">
          <div className="main">
            <img className="cover" src={movie.backdrop_image}/>
            <h1 className="title">{movie.title}</h1>
            <div className="play" onClick={this.playMovie}></div>
          </div>
          {Scene}
        </div>
      </div>
    );
  }
});

var MovieMain = React.createClass({
  render: function() {
    var movie = this.props.movie;

    var Plot;
    if (!movie.plot) {
      Plot = <div>Loading plot...</div>;
    } else {
      Plot = <div>{movie.plot}</div>
    }

    var Subtitles;
    if (!movie.subtitles) {
      Subtitles = <li>Loading subtitles...</li>;
    } else {
      if (Object.keys(movie.subtitles).length > 0) {
        if (!this.props.subtitle) {
          Subtitles = <li onClick={this.props.subtitlesScene}>Choose subtitles</li>;
        } else {
          Subtitles = <li onClick={this.props.subtitlesScene}>{movie.subtitles[this.props.subtitle].langName}</li>;
        }
      } else {
        Subtitles = <li>No hay subtítulos</li>;
      }
    }

    return (
      <div>
        Rating: {movie.rating}<br />
        {movie.runtime}m - {movie.year} - {movie.genres.join(', ')}<br /><br />
        {Plot}

        <br /><br />
        <ul>
          <li onClick={this.props.qualityScene}>{movie.torrents[this.props.quality].quality}</li>
          {Subtitles}
        </ul>
      </div>
    );
  }
});

var QualityScene = React.createClass({
  render: function() {
    var _self = this;
    return (
      <ul>
        {this.props.movie.torrents.map(function(torrent, i) {
          return (
            <li key={i} onClick={_self.props.selectQuality.bind(_self, i)}>{torrent.quality}</li>
          );
        })}
      </ul>
    );
  }
});

var SubtitlesScene = React.createClass({
  render: function() {
    var _self = this;

    return (
      <ul>
        {Object.keys(this.props.movie.subtitles).map(function(key, i) {
          return (
            <li key={i} onClick={_self.props.selectSubtitle.bind(_self, key)}>{_self.props.movie.subtitles[key].langName}</li>
          );
        })}
      </ul>
    );
  }
});

ReactDOM.render(
  <PopcornTime />,
  document.getElementById('container')
);
