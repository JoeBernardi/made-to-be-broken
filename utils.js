const sampleSongs = require('./data/sample-songs')

function randomJam (artistInput, songInput) {
  const numberOfSamples = sampleSongs.length
  const index = Math.floor(Math.random() * numberOfSamples)
  const jam = sampleSongs[index]
  artistInput.value = jam.artist
  songInput.value = jam.title
}

module.exports = {
  randomJam
}
