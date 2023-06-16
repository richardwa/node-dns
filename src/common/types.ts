export type Host = {
  name: string
  ip: string
  mac: string
}

export type BlockList = {
  [fromIP: string]: string[] // list of blocked domains, i.e. ['youtube.com']
}

export type TimerStop = {
  [fromIP: string]: number // date in epoch time
}

export type LogData = {
  date: Date
  time: string
  now: number
  action: 'allow' | 'block'
  from: string
  domain: string
  to: string
}
