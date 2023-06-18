<script setup lang="ts">
import { storeToRefs } from 'pinia'
import CoutDownTimer from '@/client/components/CoutDownTimer.vue'
import { useStateStore } from '@/client/store/state-store'
import { callServer } from '@/common/http-interface-client'

const store = useStateStore()
const { blockList, hosts, timerStop } = storeToRefs(store)
const { update } = store
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
        <button @click="callServer('block', h.ip).then(update)">block</button>
        <button @click="callServer('unblock', h.ip).then(update)">unblock</button>
        <button @click="callServer('unblock', h.ip, 30).then(update)">unblock 30</button>
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
  padding: var(--gap);
}
</style>
