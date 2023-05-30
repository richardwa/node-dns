//@ts-nocheck
import dns from 'native-dns'
import async from 'async'

const dns_port = 8053
const subnet = '192.168.2'

export const dnsServer = (blockList) => {
  let server = dns.createServer()
  const gateway = `${subnet}.1`

  server.on('listening', () => console.log('dns server listening on', server.address()))
  server.on('close', () => console.log('dns server closed', server.address()))
  server.on('error', (err, buff, req, res) => console.error(err.stack))
  server.on('socketError', (err, socket) => console.error(err))

  let authority = { address: gateway, port: 53, type: 'udp' }

  function proxy(from, question, response, cb) {
    const domain = question.name
    const list = blockList[from]
    if (list && list.reduce((a, v, y) => a || domain.endsWith(v), false)) {
      console.log('REPORT block', from, domain)
      response.answer.push({
        name: domain,
        type: 1,
        class: 1,
        ttl: 57,
        address: gateway
      })
      cb()
      return
    }

    var request = dns.Request({
      question: question, // forwarding the question
      server: authority, // this is the DNS server we are asking
      timeout: 1000
    })

    // when we get answers, append them to the response
    request.on('message', (err, msg) => {
      console.log('REPORT allow', from, domain, msg.answer.map((a) => a.address).join())
      //console.log(msg.answer);
      msg.answer.forEach((a) => response.answer.push(a))
    })

    request.on('end', cb)
    request.send()
  }

  function handleRequest(request, response) {
    let f = [] // array of functions

    // proxy all questions
    // since proxying is asynchronous, store all callbacks
    request.question.forEach((question) => {
      const from = request.address.address
      f.push((cb) => proxy(from, question, response, cb))
    })

    // do the proxying in parallel
    // when done, respond to the request by sending the response
    async.parallel(f, function () {
      response.send()
    })
  }

  server.on('request', handleRequest)
  server.serve(dns_port, '0.0.0.0')
  console.log(`dns listening on ${dns_port}`)
}
