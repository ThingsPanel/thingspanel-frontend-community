<script setup lang="ts">
import MarketBrowse from '@/views/device/market/MarketBrowse.vue'
</script>

<template>
  <div class="resource-hub-dashboard">
    <MarketBrowse />
  </div>
</template>

<style scoped>
.resource-hub-dashboard {
  /* 留白由 browse 组件自行控制，避免双重 padding */
  min-height: 100%;
}
</style>
