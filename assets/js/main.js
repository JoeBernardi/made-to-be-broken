const request = require('browser-request'),
      youTubeIframeLoader = require('youtube-iframe'),
      base64 = require('base-64'),
      utils = require('../../utils');

let preparedVideos = 0,
    playerRefs = [];

document.addEventListener("DOMContentLoaded", function() {
  checkForQuery() ? getResults(...checkForQuery()) : ''

  const searchButton = document.getElementById("submit"),
        playButton = document.getElementById("play"),
        stopButton = document.getElementById("stop"),
        suggestion = document.getElementById("suggestion");
        artistInput = document.getElementById("artist")
        songInput = document.getElementById("song-title")

  utils.randomJam(artistInput, songInput);

  searchButton.addEventListener("click", () =>
    getResults(songInput.value, artistInput.value))

  playButton.addEventListener("click", function() {
    playerRefs.forEach((video) => video.playVideo());
  });

  suggestion.addEventListener("click", () => utils.randomJam(artistInput, songInput));

  stopButton.addEventListener("click", () => resetState())
});

function getResults(song, artist) {
  document.body.classList.add("searching");
  const data = {
    search: `${artist} ${song}`
  }
  const headers = {
    'Content-Type': 'application/json'
  }
  request.post({url: '/', body: JSON.stringify(data), headers: headers}, function(err, resp) {
    document.getElementById("big-artist").innerHTML = artist;
    document.getElementById("big-title").innerHTML = song;
    if(!checkForQuery()) {
      const hash = base64.encode(`${song}///${artist}`);
      window.history.pushState({}, 'Title', `?j=${hash}`);
    }
    resp.body === "noJams" ? resetState('&#8650; Nuts: couldn\'t find enough videos. try again &#8650;') : stageVideoHtml(JSON.parse(resp.body))
  })
}

function stageVideoHtml(videoArray) {
  videoArray.forEach((videoId, index) => {
    const node = document.createElement("div");
    node.setAttribute("id",`video-${index}`);
    video.appendChild(node)
    youTubeIframeLoader.load(function(YT) {
      playerRefs.push(new YT.Player(`video-${index}`, {
          height: '250',
          width: '640',
          videoId: videoId,
          events: {
            'onReady': onPlayerReady
          }
      }));
    });
  })
}

function onPlayerReady(event) {
  if(++preparedVideos === playerRefs.length-1) {
    document.body.classList.remove("searching")
    document.body.classList.add("searched")
  }
}

function resetState(err) {
  const videoContainer = document.getElementById("video");
  var cNode = videoContainer.cloneNode(false);
  videoContainer.parentNode.replaceChild(cNode,videoContainer);

  utils.randomJam(artistInput, songInput)
  window.history.pushState({}, 'Title', '/');
  if(err) {
    document.getElementById("error").innerHTML = err;
  }
  document.body.classList = "";
  let playerRefs = [];
  let preparedVideos = 0;
}

function checkForQuery() {
  var match = RegExp('[?&]j=([^&]*)').exec(window.location.search);
  return match ?
    base64.decode(decodeURIComponent(match[1].replace(/\+/g, ' '))).split('///') :
    false;
}
