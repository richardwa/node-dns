import http from 'http'
import { serveFolder } from './fileserver'
import { endPoints } from '@/common/config'
// @ts-ignore
import { dnsServer } from './dns'
import { getHosts } from './hosts'
import type { BlockList, TimerStop } from '@/common/types'
import { logger } from './log-app'
import path from 'path'

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

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '' || req.url === null) {
    res.writeHead(302, { Location: '/index.html' })
    res.end()
    return
  }

  let pattern = endPoints.state
  if (req.url?.startsWith(pattern)) {
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
    return
  }

  pattern = endPoints.data
  if (req.url?.startsWith(pattern)) {
    const day = 1000 * 60 * 60 * 24
    const from = new Date(Date.now() - 5 * day)
    const to = new Date(Date.now() + 5 * day)
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.write('[')
    logger
      .getLogs(from, to, (line) => {
        res.write(line)
        res.write(',\n')
      })
      .then((t) => {
        res.end('{}]')
      })
    return
  }

  pattern = endPoints.block
  if (req.url?.startsWith(pattern)) {
    const query = req.url.substring(pattern.length + 1)
    const params = new URLSearchParams(query)
    const ip = params.get('ip')
    if (ip) {
      clearTimeout(timers[ip])
      delete timerStop[ip]
      blockList[ip] = ['']
      res.writeHead(200)
      res.end()
    }
    return
  }

  pattern = endPoints.unblock
  if (req.url?.startsWith(pattern)) {
    const query = req.url.substring(pattern.length + 1)
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
    return
  }

  serveClientJS(req, res)
  return
})

server.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
