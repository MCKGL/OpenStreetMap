<script setup lang="ts">
import ExpandUp from "@/components/icons/ExpandUp.vue";
</script>

<template>
  <button
    class="scroll-top-btn"
  >
    <ExpandUp class="icon-scroll-top-btn" />
  </button>
</template>

<style scoped>
.scroll-top-btn {
  position: absolute;
  border: none;
  cursor: pointer;
  background: var(--color-hightlight) none repeat scroll 0 0;
  bottom: 20px;
  font-size: 30px;
  height: 50px;
  line-height: 52px;
  right: 20px;
  width: 45px;
}

.scroll-top-btn:hover {
  background: var(--color-hightlight-hover);
}

.icon-scroll-top-btn {
  stroke: var(--color-background);
  width: 24px;
  height: 24px;
}
</style>
