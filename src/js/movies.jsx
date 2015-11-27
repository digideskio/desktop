var superagent = require('superagent');
var OS = require('opensubtitles-api');
var MovieDB = require('moviedb')('22a47483fdde69c188979a6d2213c84b');
var eztvapi = require('eztvapi');

const config = require('../config.js');
const electron = require('electron');
const remote = electron.remote;
const BrowserWindow = remote.BrowserWindow;

const Loading = require('../build/js/Loading');
const Toolbar = require('../build/js/Toolbar');
const MoviesList = require('../build/js/MoviesList');
const ShowsList = require('../build/js/ShowsList');
const Show = require('../build/js/Show');

var PopcornTime = React.createClass({
  getInitialState: function() {
    return {
      active: 'movies',
      selected: null,
      movies: {
        list: [],
        page: 0,
        loading: false
      },
      shows: {
        list: [],
        page: 0,
        loading: false
      },
      moviesPage: 0,
      showsPage: 0
    };
  },
  componentDidMount: function() {
    this.loadMoreMovies();
    this.loadMoreShows();
  },
  loadMoreShows: function() {
    var shows = this.state.shows;
    shows.loading = true;
    this.setState({shows: shows});
    var page = this.state.shows.page + 1;

    var eztv = eztvapi({
      apiUrl: 'https://www.popcorntime.ws/api/eztv/',
      apiLimitRequests: 10,    // 10 requests
      apiLimitInterval: 60000  // per minute
    });

    eztv.getShows(page, function (err, shows) {
      if (err) { return console.log('No such page or something went wrong'); }
      var shows = {list: this.state.shows.list.concat(shows), page: page, loading: false};
      this.setState({shows: shows});
    }.bind(this));
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
  selectShow: function(index) {
    this.setState({selected: index});

    var show = this.state.shows.list[index];
    if (!show.plot) {
      this.loadShowPlot(index);
    }
  },
  selectMovie: function(index) {
    this.setState({selected: index});

    var movie = this.state.movies.list[index];
    if (!movie.plot) {
      this.loadMoviePlot(index);
    }
    if (!movie.subtitles) {
      this.loadSubtitles(index);
    }
  },
  unselectMovie: function() {
    this.setState({selected: null});
  },
  loadMoviePlot: function(index) {
    var movies = this.state.movies;
    var movie = movies.list[index];

    MovieDB.movieInfo({id: movie.imdb_code }, function(err, res){
      if (res) {
        movie.plot = res.overview;
        movie.backdrop_image = 'https://image.tmdb.org/t/p/w780/' + res.backdrop_path;
        movies.list[index] = movie;
        this.setState({movies: movies});
      }
    }.bind(this));
  },
  loadShowPlot: function(index) {
    var shows = this.state.shows;
    var show = shows.list[index];

    MovieDB.find({id: show.imdb_id, external_source: 'imdb_id'}, function(err, res){
      if (res) {
        var res = res.tv_results[0];
        show.plot = res.overview;
        show.backdrop_image = 'https://image.tmdb.org/t/p/w780/' + res.backdrop_path;
        shows.list[index] = show;
        this.setState({shows: shows});
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
  changeActive: function(active) {
    this.setState({active: active});
  },
  render: function() {
    var Content;

    if (this.state.selected) {
      if (this.state.active == 'movies') {
        var movie = this.state.movies.list[this.state.selected];
        Content = <Movie movie={movie} unselectMovie={this.unselectMovie} />;
      } else {
        var show = this.state.shows.list[this.state.selected];
        Content = <Show show={show} unselectMovie={this.unselectMovie} />;
      }
    } else {
      var List;

      if (this.state.active == 'movies') {
        //Movies
        if (!this.state.movies.list.length) {
          List = (
            <div className="loadingContainer">
              <Loading />
              <p>Looking for movies...</p>
            </div>
          );
        } else {
          List = <MoviesList movies={this.state.movies.list} selectMovie={this.selectMovie} loadMoreMovies={this.loadMoreMovies} loadingMore={this.state.movies.loading} />;
        }
      } else {
        //Series
        if (!this.state.shows.list.length) {
          List = (
            <div className="loadingContainer">
              <Loading />
              <p>Looking for tv shows...</p>
            </div>
          );
        } else {
          List = <ShowsList shows={this.state.shows.list} selectShow={this.selectShow} loadMoreShows={this.loadMoreShows} loadingMore={this.state.shows.loading} />;
        }
      }

      Content = (
        <div>

          <Toolbar active={this.state.active} changeActive={this.changeActive} />

          <div className="listContainer">
            {List}
          </div>
        </div>
      );
    }
    return (
      <div>{Content}</div>
    );
  }
});

var Movie = React.createClass({
  componentWillMount: function() {
    window.resizeTo(config.film_window.w, config.film_window.h);
  },
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
            <img className="cover" src={movie.backdrop_image} width="350" height="197" />
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
