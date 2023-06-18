import { callServer } from '@/common/http-interface-client'
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

  const update = () => callServer('state').then((r) => {
    blockList.value = r.blockList
    timerStop.value = r.timerStop
    hosts.value = r.hosts.sort(hostSorter)
  })

  update()
  return { blockList, hosts, timerStop, update }
})
