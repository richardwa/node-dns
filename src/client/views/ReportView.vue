<script setup lang="ts">
import type { Host, LogData } from '@/common/types'
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { TabulatorFull as Tabulator } from 'tabulator-tables'
import { useStateStore } from '@/client/store/state-store'
import { formatDate } from '@/common/config'
import { callServer } from '@/common/http-interface-client'

const store = useStateStore()
const { hosts } = storeToRefs(store)
const day = 1000 * 60 * 60 * 24
const date1 = ref<string>(formatDate(new Date(Date.now() - 3 * day)))
const date2 = ref<string>(formatDate(new Date()))

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

const apply = () =>
  callServer('data', date1.value, date2.value).then((text) => {
    const logdata: LogData[] = []
    const lines = text.split('\n')
    for (const line of lines) {
      try {
        const d = JSON.parse(line) as LogData
        d.from = hostmap.value[d.from]?.name || d.from
        logdata.push(d)
      } catch (e) {
        console.log('error at line', line, e)
      }
    }
    data.value = logdata
    updateGrid()
  })

onMounted(() => {
  apply()
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
  <div class="v-box">
    <div class="h-box">
      <span>Date Range: </span>
      <input :class="$style.input" type="date" v-model="date1" />
      <input :class="$style.input" type="date" v-model="date2" />
      <button :class="$style.input" @click="apply">Apply</button>
    </div>
    <div :class="$style.text">{{ data.length }} rows</div>
    <div ref="gridRef" :class="$style.grid"></div>
  </div>
</template>
<style module>
.grid {
  border-top: 1px solid gray;
  width: 100%;
  min-height: 20rem;
  height: 90vh;
}
.text {
  padding: var(--gap) 0;
}
.input {
  padding: var(--gap);
  margin-right: var(--gap);
}
</style>
