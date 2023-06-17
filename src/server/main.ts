import http, { type IncomingMessage, type ServerResponse } from 'http'
import { serveFolder } from './fileserver'
import { EndPoint as E, getEndpoint } from '@/common/config'
// @ts-ignore
import { dnsServer } from './dns'
import { getHosts } from './hosts'
import type { BlockList, TimerStop } from '@/common/types'
import { logger } from './log-app'
import path from 'path'

// catch-all to prevent node from exiting
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise)
  console.error('Reason:', reason)
})

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

const handlers: {
  [s: string]: (req: IncomingMessage, res: ServerResponse, matched: string) => boolean
} = {}

handlers[getEndpoint(E.state)] = (req, res, m) => {
  getHosts().then((hosts) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end(
      JSON.stringify({
        blockList,
        hosts,
        timerStop
      })
    )
  })
  return true
}

handlers[getEndpoint(E.data)] = (req, res, m) => {
  const query = req.url?.substring(m.length + 1)
  const params = new URLSearchParams(query)
  const date1 = params.get('date1')!
  const date2 = params.get('date2')!

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
  return true
}

handlers[getEndpoint(E.block)] = (req, res, m) => {
  const query = req.url?.substring(m.length + 1)
  const params = new URLSearchParams(query)
  const ip = params.get('ip')
  if (ip) {
    clearTimeout(timers[ip])
    delete timerStop[ip]
    blockList[ip] = ['']
    res.writeHead(200)
    res.end()
  }
  return true
}

handlers[getEndpoint(E.unblock)] = (req, res, m) => {
  const query = req.url?.substring(m.length + 1)
  const params = new URLSearchParams(query)
  const ip = params.get('ip') || ''
  const duration = parseInt(params.get('duration') || '0')
  clearTimeout(timers[ip])
  delete timerStop[ip]
  delete blockList[ip]

  if (duration) {
    const durationMillis = duration * 60 * 1000
    timerStop[ip] = Date.now() + durationMillis
    timers[ip] = setTimeout(() => {
      blockList[ip] = ['']
      delete timerStop[ip]
    }, durationMillis)
  } else {
    delete timerStop[ip]
  }
  res.writeHead(200)
  res.end()
  return true
}

const handlerKeys = Object.keys(handlers)
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '' || req.url === null) {
    res.writeHead(302, { Location: '/index.html' })
    res.end()
    return
  }

  for (const key of handlerKeys) {
    if (req.url?.startsWith(key)) {
      const handled = handlers[key](req, res, key)
      if (handled) return
    }
  }

  serveClientJS(req, res)
  return
})

server.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
