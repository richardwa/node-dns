<script setup lang="ts">
import { endPoints } from '@/common/config'
import { ref } from 'vue'

const text = ref<string>()
fetch(endPoints.data)
  .then((r) => r.text())
  .then((r) => {
    text.value = r
  })
</script>

<template>
  <pre>{{ text }}</pre>
</template>
