<template>
  <GenericCard start-color="#0ea5e9" end-color="#0284c7">
    <template #title>{{ $t('card.tenantCount.title') }}</template>
    <template #icon>
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
import { tenant } from '@/service/api/system-data';
import GenericCard from '@/card2.1/components/common/generic-card/component.vue';
import { createLogger } from '@/utils/logger';

/**
 * @description 租户数量统计组件
 * @summary 显示系统中租户总数，支持实时数据更新
 */

const logger = createLogger('TenantCountCard');

defineOptions({ name: 'TenantCountCard' });

const { loading, startLoading, endLoading } = useLoading(false);
const value = ref<number | null>(null);
const unit = ref<string>('个');
let intervalId: number | null = null;

/**
 * 获取租户统计数据
 */
const fetchData = async () => {
  startLoading();
  try {
    const { data } = await tenant();
    logger.info('租户统计响应:', data);

    if (data && typeof data.user_total === 'number') {
      value.value = data.user_total || 0;
    } else {
      logger.warn('租户数据未找到或格式错误:', data);
      value.value = null;
    }
  } catch (error) {
    logger.error('获取租户统计失败:', error);
    value.value = null;
  } finally {
    endLoading();
  }
};

onMounted(() => {
  fetchData();
  // 每60秒更新一次租户数据
  intervalId = window.setInterval(fetchData, 60000);
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