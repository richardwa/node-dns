<script setup lang="ts">
import { ref } from 'vue'

const { stopTime } = defineProps<{
  stopTime: number
}>()
const emit = defineEmits(['done'])
const remainingSeconds = () => Math.floor((stopTime - Date.now()) / 1000)
const formatSeconds = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`
const countDown = ref('')

const decrement = () => {
  const seconds = remainingSeconds()
  if (seconds > 0) {
    const text = formatSeconds(seconds)
    countDown.value = text
    setTimeout(decrement, 1000)
  } else {
    countDown.value = ''
    emit('done')
  }
}
decrement()
</script>

<template>
  <span>{{ countDown }}</span>
</template>

<style scoped></style>
