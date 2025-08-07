<script setup lang="ts">
</script>

<template>
  <div  class="loading">
    <span>En cours de chargement…</span>
    <img class="loading-icon" src="/icons/refresh.svg" alt="Chargement en cours" />
  </div>
</template>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-icon {
  width: 50px;
  animation: spin 2s linear infinite;
}

.loading {
  justify-content: center;
  display: flex;
  align-items: center;
  font-family: var(--text-font-size),sans-serif;
}
</style>
