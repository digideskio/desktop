const config = require('../../config.js');

var Show = React.createClass({
  componentWillMount: function() {
    window.resizeTo(config.film_window.w, config.film_window.h);
  },
  getInitialState: function() {
    return {
      scene: 'main',
      subtitle: null,
      episode: null,
      season: null,
      torrent: 0,
    };
  },
  play: function() {
    // var movie = this.props.movie;
    //
    // var PlayerWindow = new BrowserWindow({
    //   title: movie.title,
    //   width: 800,
    //   height: 500,
    //   show: true,
    //   resizable: false,
    //   alwaysOnTop: false,
    //   skipTaskbar: false,
    //   frame: true,
    //   type: "dock"
    // });
    //
    // var params = [];
    // params.push('torrent=' + this.state.torrent);
    // if (this.state.subtitle) {
    //   params.push('subtitles=' + this.state.subtitle);
    // }
    // var query = params.join('&');
    // PlayerWindow.loadURL('file://' + __dirname + '/player.html?' + query);
    // PlayerWindow.webContents.openDevTools();
    // PlayerWindow.webContents.on('did-finish-load', function() {
    //   PlayerWindow.webContents.send('setMovie', movie);
    // });
  },
  qualityScene: function() {
    // this.setState({scene: 'quality'});
  },
  subtitlesScene: function() {
    // this.setState({scene: 'subtitles'});
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
    // this.setState({torrent: index, scene: 'main'});
  },
  selectSubtitle: function(key, event) {
    // this.setState({subtitle: key, scene: 'main'});
  },
  render: function() {
    var Scene;
    var show = this.props.show;

    switch (this.state.scene) {
      case 'quality':
        // Scene = <QualityScene
        //   movie={movie}
        //   selectQuality={this.selectQuality} />;
        break;
      case 'subtitles':
        // Scene = <SubtitlesScene
        //   selectSubtitle={this.selectSubtitle}
        //   movie={movie} />;
        break;
      default:
        // Scene = <MovieMain {...this.props}
        //   quality={this.state.torrent}
        //   subtitle={this.state.subtitle}
        //   qualityScene={this.qualityScene}
        //   subtitlesScene={this.subtitlesScene}
        //   playMovie={this.playMovie} />;
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
          <div className="item title">{show.title}</div>
        </div>
        <div className="content">
          <div className="main">
            <img className="cover" src={show.backdrop_image} width="350" height="197" />
            <h1 className="title">{show.title}</h1>
            <div className="play" onClick={this.play}></div>
          </div>
          {Scene}
        </div>
      </div>
    );
  }
});

module.exports = Show;
