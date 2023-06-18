import http, { type IncomingMessage, type ServerResponse } from 'http'
import { serveFolder } from './fileserver'
// @ts-ignore
import { dnsServer } from './dns'
import { getHosts } from './hosts'
import type { BlockList, State, TimerStop } from '@/common/types'
import { logger } from './log-app'
import path from 'path'
import { InterfaceServerManager } from '@/common/http-interface-server'

// catch-all to prevent node from exiting
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise)
  console.error('Reason:', reason)
})
const manager = new InterfaceServerManager()
const args = process.argv.slice(2)
const port = args[0]
const blockList: BlockList = {}
const timers: { [s: string]: NodeJS.Timeout } = {}
const timerStop: TimerStop = {}

dnsServer(blockList)
const clientJS = path.join(process.cwd(), 'build', 'client')
const serveClientJS = serveFolder({
  folder: clientJS,
  useCache: true
})

manager.register('state', async () => {
  const hosts = await getHosts()
  const state: State = {
    blockList,
    hosts,
    timerStop
  }
  return state
})

manager.registerStream('data', (req, res, date1, date2) => {
  const from = new Date(date1)
  const to = new Date(date2)
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  logger
    .getLogs(from, to, (line) => {
      res.write(line)
      res.write('\n')
    })
    .then((t) => {
      res.end()
    })
})
manager.register('block', (ip) => {
  clearTimeout(timers[ip])
  delete timerStop[ip]
  blockList[ip] = ['']
})
manager.register('unblock', (ip, durationMinutes?: number) => {
  clearTimeout(timers[ip])
  delete timerStop[ip]
  delete blockList[ip]

  if (durationMinutes) {
    const durationMillis = durationMinutes * 60 * 1000
    timerStop[ip] = Date.now() + durationMillis
    timers[ip] = setTimeout(() => {
      blockList[ip] = ['']
      delete timerStop[ip]
    }, durationMillis)
  } else {
    delete timerStop[ip]
  }
})

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '' || req.url === null) {
    res.writeHead(302, { Location: '/index.html' })
    res.end()
    return
  }

  manager.exec(req, res) || serveClientJS(req, res)
})

server.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
