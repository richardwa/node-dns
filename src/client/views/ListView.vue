<script setup lang="ts">
import { ref } from 'vue'
import { endPoints } from '@/common/config'
import CoutDownTimer from '@/client/components/CoutDownTimer.vue'
import type { BlockList, Host, TimerStop } from '@/common/types'

const blockList = ref<BlockList>({})
const hosts = ref<Host[]>([])
const timerStop = ref<TimerStop>({})

function send(url: string) {
  fetch(url).then(() => {
    update()
  })
}

const update = () =>
  fetch(endPoints.state)
    .then((r) => r.json())
    .then((r) => {
      blockList.value = r.blockList
      timerStop.value = r.timerStop
      hosts.value = r.hosts.sort((a: Host, b: Host) => {
        const x = parseInt(a.ip.split('.')[3])
        const y = parseInt(b.ip.split('.')[3])
        if (x < y) {
          return -1
        }
        if (x > y) {
          return 1
        }
        return 0
      })
    })
update()
</script>
<template>
  <table>
    <tr>
      <th>Actions</th>
      <th style="width: 25rem">Host</th>
      <th style="width: 10rem">IP</th>
      <th style="width: 10rem">Status</th>
    </tr>
    <tr v-for="h in hosts" :key="h.ip">
      <td>
        <button @click="send(`${endPoints.block}?ip=${h.ip}`)">block</button>
        <button @click="send(`${endPoints.unblock}?ip=${h.ip}`)">unblock</button>
        <button @click="send(`${endPoints.unblock}?ip=${h.ip}&duration=30`)">unblock 30</button>
      </td>
      <td>{{ h.name }}</td>
      <td>{{ h.ip }}</td>
      <td>
        {{ h.ip in blockList ? 'Blocked' : 'Free' }}
        <CoutDownTimer :key="timerStop[h.ip]" :stop-time="timerStop[h.ip]" @done="update" />
      </td>
    </tr>
  </table>
</template>

<style scoped>
table,
th,
td {
  border: 1px solid black;
  border-collapse: collapse;
}

button {
  margin: 0 10px;
  cursor: pointer;
}

th,
td {
  padding: 15px;
}
</style>
