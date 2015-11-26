var peerflix = require('peerflix');
var url = require('url');
var request = require('request');
var fs = require('fs');
var srt2vtt = require('srt2vtt');

const electron = require('electron');
const app = electron.remote.app;
const ipcRenderer = electron.ipcRenderer;

var BUFFERING_SIZE = 3 * 1024 * 1024;

//Prevents dock icon to display
if (process.platform == 'darwin') {
  app.dock.show();
}

var Player = React.createClass({
  player: null,
  getInitialState: function() {
    return {
      downloaded: 0,
      per: 0,
      fullscreen: false,
      params: null,
      playing: false,
      subtitles: {
        ready: false,
        path: null,
        selected: null
      }
    };
  },
  componentDidMount: function() {
    var _self = this;
    ipcRenderer.on('setMovie', function(event, movie) {
      _self.movie = movie;

      //Fetching data and starting torrent download
      var query = url.parse(window.location.href, true);
      _self.setState({params: query.query});
      var magnetLink = 'magnet:?xt=urn:btih:' + movie.torrents[_self.state.params.torrent].hash;
      var engine = peerflix(magnetLink);

      //Download selected subtitles
      var sub = _self.state.params.subtitles;
      if (sub) {
        var subtitles = movie.subtitles;

        var subUrl = subtitles[sub].url;
        var urlparts = subUrl.split('/');
        var filename = urlparts.pop();
        var filePath = app.getPath('temp') + filename;
        var out = fs.createWriteStream(filePath);

        var req = request({
          method: 'GET',
          uri: subUrl
        });
        req.on('end', function () {
          out.end(function () {
            //Save it as vtt
            var srtData = fs.readFileSync(filePath);
            srt2vtt(srtData, function(err, vttData) {
              if (err) throw new Error(err);
              fs.writeFileSync(filePath + '.vtt', vttData);

              _self.setState({
                subtitles: {
                  ready: true,
                  source: 'file://' + filePath + '.vtt',
                  selected: subtitles[sub]
                }
              });
            });
          });
        });
        req.pipe(out);
      }

      engine.server.on('listening', function () {
        _self.src = 'http://localhost:' + engine.server.address().port + '/';
      });

      setInterval(function () {
        var per = Math.round(engine.swarm.downloaded * 100 / BUFFERING_SIZE);
        _self.setState({ downloaded: engine.swarm.downloaded, per: per });
        if (_self.state.downloaded > BUFFERING_SIZE && !_self.state.playing) {
          _self.setState({playing: true});
          _self.player = videojs('player', { "autoplay": true });
          _self.player.on('fullscreenchange', function() {
            if (!_self.state.fullscreen) {
              window.resizeTo(screen.width, screen.height);
              _self.setState({fullscreen: true});
            } else {
              window.resizeTo(800, 500);
              _self.setState({fullscreen: false});
            }
          });
        }
      }, 3000);
    });
  },
  render: function() {
    var Content;
    if (!this.state.playing) {
      var progress_style = {
        width: this.state.per + '%'
      };
      Content = (
        <div className="buffering">
          <div className="percentile">{this.state.per}%</div>
          <div className="progress"><div style={progress_style}></div></div>
          <div className="description">Buffering...</div>
        </div>
      );
    } else {
      var Subtitle;
      var subtitles = this.state.subtitles;
      if (subtitles.ready) {
        Subtitle = <track label={subtitles.selected.langName} kind="subtitles" srcLang={subtitles.selected.lang} src={subtitles.source} default />;
      }
      Content = (
        <video id="player" className="video-js" controls preload="auto" width="800" height="478"  data-setup="{}">
          <source src={this.src} type="video/mp4" />
          {Subtitle}
        </video>
      );
    }
    return (
      <div>
        {Content}
      </div>
    );
  }
});

ReactDOM.render(
  <Player />,
  document.getElementById('container')
);
