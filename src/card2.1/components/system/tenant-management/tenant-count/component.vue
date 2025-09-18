<template>
  <GenericCard :colors="cardData.colors">
    <template #title>{{ cardData.title }}</template>
    <template #icon>
      <SvgIcon :icon="cardData.icon" class="text-32px" />
    </template>
    <template #value>
      <CountTo
        :suffix="cardData.unit"
        :start-value="0"
        :end-value="cardData.value"
        class="text-30px text-white dark:text-dark"
      />
    </template>
  </GenericCard>
</template>

<script lang="ts" setup>
/**
 * @file 租户数量卡片 (Card 2.1)
 * @description 使用 GenericCard 重构，展示系统当前的租户总数。
 */
import { ref } from "vue";
import GenericCard from "@/card2.1/components/common/generic-card/component.vue";
import { CountTo } from 'vue3-count-to';
import { $t } from '@/locales';
import { tenant } from '@/service/api/system-data';
import { createLogger } from '@/utils/logger';

// 定义组件名称
defineOptions({ name: 'TenantCountCardV2' });

// 日志记录器
const logger = createLogger('TenantCountCardV2');

// 卡片响应式数据
const cardData = ref({
  title: $t('card.tenantCount.title'),
  value: 0,
  unit: $t('card.tenantCount.unit', '个'),
  colors: ['#3b82f6', '#60a5fa'],
  icon: 'mdi:account-group',
});

/**
 * @function getData
 * @description 从 API 获取租户数量并更新卡片。
 */
const getData = async () => {
  try {
    const { data } = await tenant();
    // 验证响应数据的有效性
    if (data && typeof data.user_total === 'number') {
      cardData.value.value = data.user_total || 0;
    } else {
      logger.error('租户数量数据缺失、非数字或响应结构不符合预期。', data);
      cardData.value.value = 0; // 数据无效时重置为0
    }
  } catch (error) {
    logger.error('获取租户数量时出错:', error);
    cardData.value.value = 0; // 发生错误时重置为0
  }
};

// 初始化时获取数据
getData();
</script>