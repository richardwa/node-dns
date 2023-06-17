<script setup lang="ts">
import { endPoints } from '@/common/config'
import type { Host, LogData } from '@/common/types'
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { TabulatorFull as Tabulator } from 'tabulator-tables'
import { useStateStore } from '@/client/store/state-store'

const store = useStateStore()
const { hosts } = storeToRefs(store)
type HostMap = {
  [s: string]: Host
}
const hostmap = computed(() =>
  hosts.value.reduce((a, v) => {
    if (v.name !== '*') {
      a[v.ip] = v
    }
    return a
  }, {} as HostMap)
)
const gridRef = ref<HTMLElement | null>(null)
const data = ref<LogData[]>([])
let grid: Tabulator
const updateGrid = () => {
  if (grid) {
    grid.replaceData(data.value)
  }
}

fetch(endPoints.data)
  .then((r) => r.text())
  .then((r) => {
    const logdata: LogData[] = []
    const lines = r.split('\n')
    for (const line of lines) {
      try {
        const d = JSON.parse(line) as LogData
        d.from = hostmap.value[d.from].name || d.from
        logdata.push(d)
      } catch (e) {
        console.log('error parsing', line)
      }
    }
    data.value = logdata
    updateGrid()
  })

onMounted(() => {
  const _grid = new Tabulator(gridRef.value!, {
    selectable: false,
    columns: [
      { title: 'Date', field: 'date' },
      { title: 'Allow', field: 'action' },
      { title: 'From', field: 'from' },
      { title: 'Domain', field: 'domain' }
    ]
  })
  _grid.on('tableBuilt', () => {
    grid = _grid
    updateGrid()
  })
})
</script>
<template>
  <div ref="gridRef" :class="$style.grid"></div>
</template>
<style module>
.grid {
  border-top: 1px solid gray;
  width: 100%;
  min-height: 20rem;
  height: 90vh;
}
</style>
