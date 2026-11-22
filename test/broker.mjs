// Local MQTT-over-WebSocket broker + static server for testing
import { Aedes } from 'aedes'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { WebSocketServer, createWebSocketStream } from 'ws'

const broker = await Aedes.createBroker()
const root = path.resolve(process.argv[2] || '.')
const port = +(process.argv[3] || 8899)

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p === '/') p = '/index.html'
  const f = path.join(root, p)
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end('nf') }
  const ext = path.extname(f)
  res.writeHead(200, { 'content-type': ext === '.html' ? 'text/html; charset=utf-8' : 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
})
const wss = new WebSocketServer({ server, path: '/mqtt' })
wss.on('connection', (ws) => {
  const stream = createWebSocketStream(ws)
  broker.handle(stream)
})
let n = 0
broker.on('publish', (p, c) => { if (c) n++ })
setInterval(() => { if (n) { console.log('msgs', n); n = 0 } }, 5000)
server.listen(port, () => console.log('listening', port))
