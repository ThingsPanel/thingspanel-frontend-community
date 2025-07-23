<template>
  <div class="paneldemo-page">
    <SimpleDemo />
  </div>
</template>

<script lang="ts" setup>
import SimpleDemo from '@/components/panelv2/demo/SimpleDemo.vue';
</script>

<style scoped>
.paneldemo-page {
  height: calc(100vh - 120px); /* 减去header+tab的大概高度 */
  width: 100%;
  min-height: 600px; /* 最小高度保证可用性 */
}
</style>