<template>
  <GenericCard start-color="#fb923c" end-color="#f97316">
    <template #title>{{ $t('card.diskUsage') }}</template>
    <template #icon>
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
        <line x1="22" y1="12" x2="2" y2="12"/>
        <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
        <line x1="6" y1="16" x2="6.01" y2="16"/>
        <line x1="10" y1="16" x2="10.01" y2="16"/>
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
 * @description 磁盘使用率组件
 * @summary 显示系统磁盘使用率百分比，每30秒自动刷新
 */

const logger = createLogger('DiskUsageCard');

defineOptions({ name: 'DiskUsageCard' });

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
    logger.info('系统指标响应:', response);

    const diskUsagePercent = response?.data?.disk_usage;

    if (typeof diskUsagePercent === 'number') {
      value.value = parseFloat(diskUsagePercent.toFixed(1));
      unit.value = '%';
    } else {
      logger.warn('Disk usage percentage not found or not a number in response:', response); // 与原版保持一致
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