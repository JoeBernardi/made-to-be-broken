import sampleSongs from './sample-songs.js'

const READY_FALLBACK_MS = 10_000
const NO_JAMS_MESSAGE = "⇊ Nuts: Couldn't find enough videos. Try again! ⇊"
const GENERIC_ERROR_MESSAGE = '⇊ Something went wrong. Try again! ⇊'

const artistInput = document.getElementById('artist')
const songInput = document.getElementById('song-title')
const errorArea = document.getElementById('error')

let playerRefs = []
let preparedVideos = 0
let readyTimer = null
let searchId = 0
let youTubeApi = null

const randomJam = () => {
  const jam = sampleSongs[Math.floor(Math.random() * sampleSongs.length)]
  artistInput.value = jam.artist
  songInput.value = jam.title
}

const loadYouTubeApi = () => {
  if (youTubeApi) return youTubeApi
  youTubeApi = new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT)
    window.onYouTubeIframeAPIReady = () => resolve(window.YT)
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })
  return youTubeApi
}

const encodeJam = (text) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(text)))

const decodeJam = (encoded) => {
  const bytes = atob(encoded)
  try {
    return new TextDecoder('utf-8', { fatal: true })
      .decode(Uint8Array.from(bytes, (c) => c.charCodeAt(0)))
  } catch {
    return bytes
  }
}

const checkForQuery = () => {
  // Read j raw: base64 can contain "+", which URLSearchParams would turn into a space.
  const match = /[?&]j=([^&]*)/.exec(window.location.search)
  if (!match) return null
  try {
    const [song, artist] = decodeJam(decodeURIComponent(match[1])).split('///')
    return artist === undefined ? null : [song, artist]
  } catch {
    return null
  }
}

const revealPlayers = () => {
  clearTimeout(readyTimer)
  readyTimer = null
  document.body.classList.remove('searching')
  document.body.classList.add('searched')
}

const onPlayerReady = () => {
  if (++preparedVideos === playerRefs.length) revealPlayers()
}

const resetState = (message) => {
  searchId++
  clearTimeout(readyTimer)
  readyTimer = null

  const videoContainer = document.getElementById('video')
  videoContainer.replaceWith(videoContainer.cloneNode(false))

  randomJam()
  window.history.pushState({}, 'Title', '/')
  if (message) errorArea.textContent = message

  document.body.className = ''
  playerRefs = []
  preparedVideos = 0
}

const stageVideoHtml = async (videoIds) => {
  const thisSearch = searchId
  const videoContainer = document.getElementById('video')
  videoIds.forEach((_, index) => {
    const node = document.createElement('div')
    node.id = `video-${index}`
    videoContainer.appendChild(node)
  })

  const YT = await loadYouTubeApi()
  if (thisSearch !== searchId) return
  playerRefs = videoIds.map((videoId, index) => new YT.Player(`video-${index}`, {
    height: '250',
    width: '640',
    videoId,
    events: { onReady: onPlayerReady }
  }))
  readyTimer = setTimeout(revealPlayers, READY_FALLBACK_MS)
}

const getResults = async (song, artist) => {
  document.body.classList.add('searching')
  errorArea.textContent = ''

  let res
  let body
  try {
    res = await fetch('/api/covers?q=' + encodeURIComponent(`${artist} ${song}`))
    body = await res.json()
  } catch (err) {
    console.error(err)
    return resetState(GENERIC_ERROR_MESSAGE)
  }

  document.getElementById('big-artist').textContent = artist
  document.getElementById('big-title').textContent = song
  if (!checkForQuery()) {
    window.history.pushState({}, 'Title', `?j=${encodeURIComponent(encodeJam(`${song}///${artist}`))}`)
  }

  if (res.status === 404 && body?.error === 'noJams') return resetState(NO_JAMS_MESSAGE)
  if (!res.ok || !Array.isArray(body?.videoIds)) return resetState(GENERIC_ERROR_MESSAGE)

  stageVideoHtml(body.videoIds)
}

randomJam()
loadYouTubeApi()

document.getElementById('submit').addEventListener('click', () =>
  getResults(songInput.value, artistInput.value))

document.getElementById('play').addEventListener('click', () =>
  playerRefs.forEach((player) => player.playVideo()))

document.getElementById('stop').addEventListener('click', () => resetState())

document.getElementById('suggestion').addEventListener('click', randomJam)

document.getElementById('about-link').addEventListener('click', (e) => {
  e.preventDefault()
  document.body.classList.toggle('about')
})

const sharedJam = checkForQuery()
if (sharedJam) getResults(...sharedJam)
