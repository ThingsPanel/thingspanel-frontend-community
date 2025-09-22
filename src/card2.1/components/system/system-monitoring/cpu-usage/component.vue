<template>
  <GenericCard start-color="#4ade80" end-color="#22c55e">
    <template #title>{{ $t('card.cpuUsage') }}</template>
    <template #icon>
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
        <rect x="4" y="4" width="16" height="16" rx="2"/>
        <rect x="9" y="9" width="6" height="6"/>
        <line x1="9" y1="1" x2="9" y2="4"/>
        <line x1="15" y1="1" x2="15" y2="4"/>
        <line x1="9" y1="20" x2="9" y2="23"/>
        <line x1="15" y1="20" x2="15" y2="23"/>
        <line x1="20" y1="9" x2="23" y2="9"/>
        <line x1="20" y1="14" x2="23" y2="14"/>
        <line x1="1" y1="9" x2="4" y2="9"/>
        <line x1="1" y1="14" x2="4" y2="14"/>
      </svg>
    </template>
    <template #value>
      <template v-if="loading">
        {{ $t('card.loading') }}
      </template>
      <template v-else-if="value !== null">
        <CountTo :start-value="0" :end-value="value" :suffix="unit" />
      </template>
      <template v-else>
        {{ $t('card.noData') }}
      </template>
    </template>
  </GenericCard>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { CountTo } from 'vue3-count-to';
import { $t } from '@/locales';
import { useLoading } from '~/packages/hooks';
import { getSystemMetricsCurrent } from '@/service/api/system-data';
import GenericCard from '@/card2.1/components/common/generic-card/component.vue';
import { createLogger } from '@/utils/logger';

/**
 * @description CPU 使用率组件
 * @summary 显示系统 CPU 使用率百分比，每30秒自动刷新
 */

const logger = createLogger('CpuUsageCard');

defineOptions({ name: 'CpuUsageCard' });

const { loading, startLoading, endLoading } = useLoading(false);
const value = ref<number | null>(null);
const unit = ref<string>('');
let intervalId: number | null = null;

/**
 * 获取系统指标数据
 */
const fetchData = async () => {
  startLoading();
  try {
    const response = await getSystemMetricsCurrent();
    logger.info('System Metrics Response:', response); // 与原版保持1:1一致

    const cpuUsagePercent = response?.data?.cpu_usage;

    if (typeof cpuUsagePercent === 'number') {
      value.value = parseFloat(cpuUsagePercent.toFixed(1)); // Keep one decimal place
      unit.value = '%'; // Set unit to percentage
    } else {
      logger.warn('CPU usage percentage not found or not a number in response:', response); // 与原版保持一致
      value.value = null;
      unit.value = '';
    }
  } catch (error) {
    logger.error('Error fetching system metrics:', error); // 与原版保持一致
    value.value = null;
    unit.value = '';
  } finally {
    endLoading();
  }
};

onMounted(() => {
  fetchData();
  intervalId = window.setInterval(fetchData, 30000);
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<style scoped>
.icon {
  color: #fff;
}
</style>