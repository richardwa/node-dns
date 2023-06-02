import http from 'http'
import { serveStaticFile } from './fileserver'
import { endPoints } from '@/common/config'
// @ts-ignore
import { dnsServer } from './dns'
import { getHosts } from './hosts'
import type { BlockList, TimerStop } from '@/common/types'
import { logger } from './log'

const args = process.argv.slice(2)
const port = args[0]
const blockList: BlockList = {}
const timers: { [s: string]: NodeJS.Timeout } = {}
const timerStop: TimerStop = {}

dnsServer(blockList)

const server = http.createServer((req, res) => {
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
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    logger.getAllLogs(
      (line) => {
        res.write(line + '\n')
      },
      () => {
        res.end()
      }
    )
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

  serveStaticFile(req, res)
  return
})

server.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
