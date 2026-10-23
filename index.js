import express from 'express'
import path from 'node:path'

import { searchCovers } from './videos.js'

if (!process.env.YOUTUBE_API_KEY) {
  console.error('YOUTUBE_API_KEY is not set: copy .env.example to .env and add a YouTube Data API v3 key.')
  process.exit(1)
}

const root = import.meta.dirname
const port = process.env.PORT ?? 8081
const mobileUserAgent = /Mobi|Android|iPhone|iPad|iPod|Tablet/i

const app = express()

app.use(express.static(path.join(root, 'assets'), { maxAge: '1d' }))

app.get('/api/covers', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
  if (!q || q.length > 200) {
    return res.status(400).json({ error: 'bad_request' })
  }

  try {
    const videoIds = await searchCovers(q)
    return res.json({ videoIds })
  } catch (err) {
    if (err.code === 'noJams') {
      return res.status(404).json({ error: 'noJams' })
    }
    console.error(err)
    return res.status(502).json({ error: 'youtube_unavailable' })
  }
})

app.get('/', (req, res) => {
  const isMobile = mobileUserAgent.test(req.get('user-agent') ?? '')
  const template = isMobile ? 'index-mobile.html' : 'index.html'
  res.sendFile(path.join(root, 'templates', template))
})

app.listen(port, () => console.log('🐚  🐚  🐚   S E R V E R  U P  🐚  🐚  🐚'))
