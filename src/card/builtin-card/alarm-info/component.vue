<template>
  <div class="bg-[#000]">
    <!-- 卡片内容将在这里实现 -->
    <!-- {{ $t('cards.reportedData') }} -->
88888
  </div>
</template>

<script setup lang="ts">
import { defineComponent, onMounted } from 'vue';
import { $t } from '@/locales';
import { getLatestTelemetryData } from '@/service/api';

defineOptions({
  name: 'AlarmInfoCard'
});

// 在这里添加组件的逻辑
onMounted(async () => {
  try {
    const data = await getLatestTelemetryData();
    console.log('Latest Telemetry Data:', data);
  } catch (error) {
    console.error('Error fetching latest telemetry data:', error);
  }
});

</script>

<style scoped>
/* 在这里添加组件的样式 */
</style>
