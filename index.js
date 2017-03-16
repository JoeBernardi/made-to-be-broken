const Express = require('express')
const bodyParser = require('body-parser')
const browserify = require('browserify-middleware')
const sassMiddleware = require('node-sass-middleware')

const getVideos = require('./videos')

const app = new Express()
const root = __dirname

app.get('/assets/js/bundle.js', browserify(root + '/assets/js/main.js'))

app.use(
  sassMiddleware({
    src: '/sass',
    dest: '/css',
    root: `${root}/assets`,
    debug: true
  })
)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(Express.static('templates'))
app.use(Express.static('assets'))

app.post('/', function (req, res) {
  res.setHeader('Content-Type', 'application/json')
  getVideos(req.body.search)
    .then((videoIds) => res.status(200).send(JSON.stringify(videoIds)),
          (err) => res.send(err))
})

app.get('/', function (req, res) {
  res.sendFile('index.html')
})

app.listen(8080, () => console.log('🐚  🐚  🐚   S E R V E R  U P  🐚  🐚  🐚'))
