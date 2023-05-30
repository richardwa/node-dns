<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { staticPaths } from './router'
</script>

<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink :to="staticPaths.home">Home</RouterLink> |
        <RouterLink :to="staticPaths.hello">Server</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped></style>
