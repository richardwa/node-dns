<script setup lang="ts">
import { endPoints } from '@/common/config'
import type { LogData } from '@/common/types'
import { onMounted, ref } from 'vue'
import { TabulatorFull as Tabulator } from 'tabulator-tables'

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
      logdata.push(JSON.parse(line))
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
