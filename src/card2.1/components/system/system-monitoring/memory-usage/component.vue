<template>
  <GenericCard start-color="#8b5cf6" end-color="#7c3aed">
    <template #title>{{ $t('card.memoryUsage') }}</template>
    <template #icon>
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
        <line x1="7" y1="7" x2="7" y2="13"/>
        <line x1="11" y1="7" x2="11" y2="13"/>
        <line x1="15" y1="7" x2="15" y2="13"/>
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
 * @description 内存使用率组件
 * @summary 显示系统内存使用率百分比，每30秒自动刷新
 */

const logger = createLogger('MemoryUsageCard');

defineOptions({ name: 'MemoryUsageCard' });

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

    const memoryUsagePercent = response?.data?.memory_usage;

    if (typeof memoryUsagePercent === 'number') {
      value.value = parseFloat(memoryUsagePercent.toFixed(1));
      unit.value = '%';
    } else {
      logger.warn('Memory usage percentage not found or not a number in response:', response); // 与原版保持一致
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