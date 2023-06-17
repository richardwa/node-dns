<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { endPoints } from '@/common/config'
import CoutDownTimer from '@/client/components/CoutDownTimer.vue'
import { useStateStore } from '@/client/store/state-store'

const store = useStateStore()
const { blockList, hosts, timerStop } = storeToRefs(store)
const { send, update } = store
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
        <CoutDownTimer
          v-if="h.ip in timerStop"
          :key="timerStop[h.ip]"
          :stop-time="timerStop[h.ip]"
          @done="update"
        />
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
