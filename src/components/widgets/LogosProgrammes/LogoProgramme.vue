<script setup lang="ts">
import {onMounted, ref} from 'vue';
import type {ProgrammeCode} from "@/types/ProgrammeType.ts";

const props = defineProps<{
  programme: ProgrammeCode;
}>();

const imageExists = ref(false);
const { programme } = props;

onMounted(() => {
  const img = new Image();
  img.src = `/images/logo_${programme.toLowerCase()}.png`;
  img.onload = () => imageExists.value = true;
  img.onerror = () => imageExists.value = false;
});
</script>

<template>
  <div class="logo-programme">
    <div class="label-programme" :class="programme">{{ programme.toLowerCase() }}</div>
    <img v-if="imageExists" class="img-logo-programme"
         :src="`/images/logo_${programme.toLowerCase()}.png`"
         :alt="`Logo du programme ${programme}`"
         loading="lazy" />
  </div>
</template>

<style scoped>
.logo-programme {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: .1em;
  margin: .1em;
}

.label-programme {
  color: var(--color-text-on-hightlight);
  padding: .2em .6em;
  font-weight: 700;
  font-size: var(--subtext-font-size);
  border-radius: .25em;
  text-transform: uppercase;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.PH {
  background-color: #c09bc7;
}

.PLVP {
  background-color: #659899;
}

.REFUG {
  background-color: #002542;
}

.img-logo-programme{
  height: 31px;
  vertical-align: middle;
}
</style>
