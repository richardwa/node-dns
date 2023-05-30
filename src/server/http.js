const path = require('path')
const http = require('http')
const { serveStaticFile } = require('./fileserver')
const { endPoints } = require('@/common/config')
const { dnsServer } = require('./dns')
const { getHosts } = require('./hosts')

const args = process.argv.slice(2)
const port = args[0]

const http_port = 8023
const subnet = '192.168.2'
const blockList = {}
const timers = {}
const timerStop = {}

dnsServer(subnet, blockList)

const server = http.createServer((req, res) => {
  if (req.url?.startsWith(endPoints.state)) {
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

  if (req.url?.startsWith(endPoints.block)) {
    const params = new URLSearchParams(req.url.search)
    const ip = params.get('ip')
    clearTimeout(timers[ip])
    delete timerStop[ip]
    blockList[ip] = ['']
    res.writeHead(200)
    res.end()
    return
  }

  if (req.url?.startsWith(endPoints.unblock)) {
    const params = new URLSearchParams(req.url.search)
    const ip = params.get('ip')
    const duration = parseInt(params.get('duration'))
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
