<template>
  <GenericCard :start-color="cardData.colors[0]" :end-color="cardData.colors[1]">
    <template #title>{{ cardData.title }}</template>
    <template #icon>
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </svg>
    </template>
    <template #value>
      <CountTo
        :start-value="0"
        :end-value="cardData.value"
        :suffix="cardData.unit"
      />
    </template>
  </GenericCard>
</template>

<script lang="ts" setup>
/**
 * @file 告警统计卡片 (Card 2.1)
 * @description 使用 GenericCard 重构，展示系统当前的告警总数。
 */
import { ref } from "vue";
import GenericCard from "@/card2.1/components/common/generic-card/component.vue";
import { CountTo } from 'vue3-count-to';
import { $t } from '@/locales';
import { getAlarmCount } from '@/service/api';
import { createLogger } from '@/utils/logger';

// 定义组件名称
defineOptions({ name: 'AlarmCountCardV2' });

// 日志记录器
const logger = createLogger('AlarmCountCardV2');

// 卡片响应式数据，与原版保持1:1一致
const cardData = ref({
  title: $t('card.alarmCount'),
  value: 0,
  unit: $t('card.alarmUnit'), // 使用国际化，与原版一致
  colors: ['#f97316', '#ef4444'], // 与原版保持一致的颜色配置
});

/**
 * @function getData
 * @description 从 API 获取告警统计数据并更新卡片。
 */
const getData = async () => {
  try {
    const response: { data: any } = await getAlarmCount();
    // 验证响应数据的有效性
    if (response && response.data && typeof response.data.alarm_device_total === 'number') {
      cardData.value.value = response.data.alarm_device_total;
    } else {
      logger.error('告警统计数据缺失、非数字或响应结构不符合预期。', response);
      cardData.value.value = 0; // 数据无效时重置为0
    }
  } catch (error) {
    logger.error('获取告警统计数据时出错:', error);
    cardData.value.value = 0; // 发生错误时重置为0
  }
};

// 初始化时获取数据
getData();
</script>

<style scoped>
.icon {
  color: #fff;
}
</style>