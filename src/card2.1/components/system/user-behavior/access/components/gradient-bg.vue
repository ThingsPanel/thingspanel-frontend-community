<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  startColor: {
    type: String,
    default: '#292E37',
  },
  endColor: {
    type: String,
    default: '#292E37',
  },
});

const gradientStyle = computed(() => {
  return {
    background: `linear-gradient(to right, ${props.startColor}, ${props.endColor})`,
  };
});
</script>

<template>
  <div class="w-full h-full rounded-lg p-4" :style="gradientStyle">
    <slot></slot>
  </div>
</template>

<style lang="scss" scoped></style>