// @ts-ignore
import dns from 'native-dns'
import { log } from './log'
import type { BlockList } from '@/common/types'

const dns_port = 8053
type DnsAnswer = {
  name: any
  type: number
  class: number
  ttl: number
  address: string
}
type DnsResponse = {
  answer: DnsAnswer[]
  send: () => void
}
type DnsQuestion = {
  name: string
}
type DnsRequest = {
  question: DnsQuestion[]
  address: { address: string }
}

export const dnsServer = (blockList: BlockList) => {
  let server = dns.createServer()
  const gateway = '192.168.2.1'

  server.on('listening', () => console.log('dns server listening on', server.address()))
  server.on('close', () => console.log('dns server closed', server.address()))
  server.on('error', (err: Error) => console.error(err.stack))
  server.on('socketError', (err: Error) => console.error(err))

  let authority = { address: gateway, port: 53, type: 'udp' }

  function proxy(from: string, question: DnsQuestion, response: DnsResponse, done: () => void) {
    const domain = question.name
    const list = blockList[from]
    if (list && list.reduce((a, v, y) => a || domain.endsWith(v), false)) {
      log.write({ action: 'block', from, domain })
      response.answer.push({
        name: domain,
        type: 1,
        class: 1,
        ttl: 57,
        address: gateway
      })
      done()
      return
    }

    var request = dns.Request({
      question: question, // forwarding the question
      server: authority, // this is the DNS server we are asking
      timeout: 1000
    })

    // when we get answers, append them to the response
    request.on('message', (err: Error, msg: DnsResponse) => {
      log.write({
        action: 'allow',
        from,
        domain,
        to: msg.answer.map((a) => a.address).join()
      })
      msg.answer.forEach((a) => response.answer.push(a))
    })

    request.on('end', done)
    request.send()
  }

  function handleRequest(request: DnsRequest, response: DnsResponse) {
    let f: Promise<void>[] = []
    // proxy all questions
    // since proxying is asynchronous, store all callbacks
    request.question.forEach((question: DnsQuestion) => {
      const from = request.address.address
      const p = new Promise<void>((res, rej) => {
        proxy(from, question, response, res)
      })
      f.push(p)
    })

    // do the proxying in parallel
    // when done, respond to the request by sending the response
    Promise.all(f).then(() => {
      response.send()
    })
  }

  server.on('request', handleRequest)
  server.serve(dns_port, '0.0.0.0')
  console.log(`dns listening on ${dns_port}`)
}
