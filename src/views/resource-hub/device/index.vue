<script setup lang="ts">
import MarketTemplateList from '@/views/device/config/modules/market-template-list.vue'
</script>

<template>
  <div class="resource-hub-device">
    <MarketTemplateList />
  </div>
</template>

<style scoped>
.resource-hub-device {
  /* 留白由 list 组件自行控制，避免双重 padding */
  min-height: 100%;
}
</style>
