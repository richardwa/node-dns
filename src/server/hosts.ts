import request from 'request'
import type { Host } from '../common/types'

const macName: { [s: string]: string } = {
  'xx:xx:xx:xx:4A:1F': 'Google TV',
  'xx:xx:xx:xx:CF:65': 'Alexa (white)',
  'xx:xx:xx:xx:F6:20': 'Microwave',
  'xx:xx:xx:xx:EA:B8': 'IPhone 8',
  'xx:xx:xx:xx:61:FF': 'Lenovo Chrome OS',
  'xx:xx:xx:xx:C9:0E': 'Nest',
  'xx:xx:xx:xx:F5:D8': 'ESP Clock'
}

let lastFetch: number, hosts: Promise<Host[]>

const fetchHosts = (): Promise<Host[]> =>
  new Promise((res, rej) => {
    request(
      {
        url: 'https://192.168.2.1/Info.live.htm',
        agentOptions: {
          rejectUnauthorized: false
        }
      },
      (_err, _resp, body: string) => {
        const hosts: Host[] = []
        const matches = body.match('{dhcp_leases:: (.*?)}')
        if (!matches) {
          rej('no hosts found')
          return
        }
        const leases = matches[1]
        const sp = leases.replace(/'/g, '').split(',')
        const chunkSize = 5
        const rows = Math.floor(sp.length / chunkSize)
        for (var i = 0; i < rows; i++) {
          const start = i * chunkSize
          const data = sp.slice(start, start + chunkSize)
          const mac = data[2]
          const host = {
            name: macName[mac] ? macName[mac] : data[0],
            ip: data[1],
            mac
          }
          hosts.push(host)
        }
        res(hosts)
        lastFetch = Date.now()
      }
    )
  })

hosts = fetchHosts()

export const getHosts = () => {
  if (Date.now() - lastFetch > 27 * 1000) {
    hosts = fetchHosts()
    lastFetch = Date.now()
  }
  return hosts
}
