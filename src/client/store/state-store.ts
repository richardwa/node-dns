import { EndPoint as E, getEndpoint } from '@/common/config'
import type { BlockList, Host, TimerStop } from '@/common/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const hostSorter = (a: Host, b: Host) => {
  const x = parseInt(a.ip.split('.')[3])
  const y = parseInt(b.ip.split('.')[3])
  if (x < y) {
    return -1
  }
  if (x > y) {
    return 1
  }
  return 0
}

export const useStateStore = defineStore('state', () => {
  const blockList = ref<BlockList>({})
  const hosts = ref<Host[]>([])
  const timerStop = ref<TimerStop>({})

  function send(url: string) {
    fetch(url).then(() => {
      update()
    })
  }

  const update = () =>
    fetch(getEndpoint(E.state))
      .then((r) => r.json())
      .then((r) => {
        blockList.value = r.blockList
        timerStop.value = r.timerStop
        hosts.value = r.hosts.sort(hostSorter)
      })

  update()
  return { blockList, hosts, timerStop, send, update }
})
