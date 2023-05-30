const http = require('http')
const { serveStaticFile } = require('./fileserver')
const { endPoints } = require('@/common/config')
const { dnsServer } = require('./dns')
const { getHosts } = require('./hosts')

const args = process.argv.slice(2)
const port = args[0]
const subnet = '192.168.2'
const blockList = {}
const timers = {}
const timerStop = {}

dnsServer(subnet, blockList)

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

  pattern = endPoints.block
  if (req.url?.startsWith(pattern)) {
    const query = req.url.substring(pattern.length + 1)
    const params = new URLSearchParams(query)
    const ip = params.get('ip')
    clearTimeout(timers[ip])
    delete timerStop[ip]
    blockList[ip] = ['']
    res.writeHead(200)
    res.end()
    return
  }

  pattern = endPoints.unblock
  if (req.url?.startsWith(pattern)) {
    const query = req.url.substring(pattern.length + 1)
    const params = new URLSearchParams(query)
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
