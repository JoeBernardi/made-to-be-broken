const youTubeSearch = require('youtube-search')
const keys = require('./data/keys')

const youtubeOpts = {
  maxResults: 50,
  type: 'video',
  videoEmbeddable: "true",
  key: keys.youTubeKey
}

function getVideoIds (term) {
  return new Promise((resolve, reject) => {
    youTubeSearch(`${term} acoustic cover`, youtubeOpts, (err, results) => {
      console.log(results);
      let validResults = results.filter((result) => {
        let title = result.title
        let predicate = (
           title.match(/cover/i) &&
           title.match(/acoustic/i) &&
           !title.match(/live/i) &&
           !title.match(/lyrics/i)
         )
        return predicate
      })
      if (err) {
        reject(err)
      } else if (validResults.length < 2) {
        reject('noJams')
      } else {
        resolve(validResults.splice(0, 5).map((result) => result.id))
      }
    })
  })
}

module.exports = getVideoIds
