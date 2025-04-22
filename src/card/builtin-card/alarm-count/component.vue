<script setup lang="ts">
import { ref } from 'vue';
import { createLogger } from '@/utils/logger';
import { $t } from '@/locales';
import { getAlarmCount } from '../../../service/api'; // Placeholder for actual alarm count API
import { GradientBg } from './components';
const logger = createLogger('AlarmCount');

defineOptions({ name: 'AlarmCountCard' });

const cardData = ref<any>({
  id: 'alarm-count',
  title: $t('card.alarmCount'), // Assuming translation key exists
  value: 0,
  unit: $t('card.alarmUnit'), // Assuming translation key exists (e.g., '条')
  colors: ['#f97316', '#ef4444'], // Example alarm colors
  icon: 'fa-bell' // Example alarm icon
});

// 获取数据
const getData: () => void = async () => {
  try {
    // TODO: Replace with actual API call and response handling for alarm count
    const response: { data: any } = await getAlarmCount(); // Example API call
    // Mock data for now
    // const response = { data: { alarm_count: Math.floor(Math.random() * 100) } }; // Mock data

    // Check if response, response.data, and alarm_device_total exist and if alarm_device_total is a number
    if (response && response.data && typeof response.data.alarm_device_total === 'number') {
      cardData.value.value = response.data.alarm_device_total;
    } else {
      // Log the actual response structure if it's unexpected
      logger.error('Alarm count data is missing, not a number, or response structure is unexpected.', response);
      cardData.value.value = 0; // Set to 0 if data is invalid or missing
    }
  } catch (error) {
    // 处理请求数据时的错误
    logger.error('Error fetching alarm count data:', error);
    cardData.value.value = 0; // Set to 0 on error
  }
};

// 调用 getData 函数
getData();
</script>

<template>
  <GradientBg class="access" :start-color="cardData.colors[0]" :end-color="cardData.colors[1]">
    <h3 class="text-16px">{{ cardData.title }}</h3>
    <div class="icon-items flex justify-between pt-30px">
      <SvgIcon :icon="cardData.icon" class="text-32px" />
      <CountTo
        :prefix="cardData.unit"
        :start-value="0"
        :end-value="cardData.value"
        class="text-30px text-white dark:text-dark"
      />
    </div>
  </GradientBg>
</template>

<style scoped>
.access {
  width: 100%;
  height: 100%;
  min-width: max-content;
  min-height: max-content;
}

.icon-items {
  align-items: center;
}
</style>
