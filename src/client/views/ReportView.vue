<script setup lang="ts">
import { endPoints } from '@/common/config'

fetch(endPoints.data)
  .then((r) => r.text())
  .then((r) => {
    console.log(r)
  })
</script>

<template>
  <main>Report data</main>
</template>
