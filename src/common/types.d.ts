type Host = {
  name: string
  ip: string
  mac: string
}

type BlockList = {
  [fromIP: string]: string[] // list of blocked domains, i.e. ['youtube.com']
}

type TimerStop = {
  [fromIP: string]: number // date in epoch time
}
