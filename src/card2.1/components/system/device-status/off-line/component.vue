<template>
  <GenericCard :start-color="cardData.colors[0]" :end-color="cardData.colors[1]">
    <template #title>{{ cardData.title }}</template>
    <template #icon>
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-wifi-off">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 18l.01 0" />
        <path d="M9.172 15.172a4 4 0 0 1 5.656 0" />
        <path d="M6.343 12.343a7.963 7.963 0 0 1 3.414 -2.082" />
        <path d="M16.97 9.515a12 12 0 0 0 -14.455 0" />
        <path d="M3 3l18 18" />
      </svg>
    </template>
    <template #value>{{ cardData.value }}</template>
  </GenericCard>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { createLogger } from '@/utils/logger';
import { $t } from '@/locales';
import { sumData, totalNumber } from '@/service/api';
import GenericCard from '@/card2.1/components/common/generic-card/component.vue';

// 日志记录器
const logger = createLogger('OffLineCard');

// 定义组件选项
defineOptions({ name: 'OffLineCard' });

// 认证状态
const authStore = useAuthStore();

// 卡片数据
const cardData = ref<any>({
  title: $t('card.offlineDev'),
  value: 0,
  colors: ['#ff6b6b', '#ee5a52'], // 橙红色渐变，表示离线状态的警示
});

/**
 * @description 获取数据
 */
const getData = async () => {
  try {
    const response: { data: any } =
      authStore?.$state.userInfo.authority === 'TENANT_ADMIN' ? await sumData() : await totalNumber();
    if (response.data && typeof response.data.device_total === 'number' && typeof response.data.device_on === 'number') {
      cardData.value.value = response.data.device_total - response.data.device_on;
    } else {
      logger.error('数据格式不正确，无法获取离线设备数。');
    }
  } catch (error) {
    logger.error('请求数据时出错:', error);
  }
};

// 获取数据
getData();
</script>

<style scoped>
.icon {
  color: #fff;
}
</style>