<template>
  <GenericCard :start-color="cardData.colors[0]" :end-color="cardData.colors[1]">
    <template #title>{{ cardData.title }}</template>
    <template #icon>
      <SvgIcon :icon="cardData.icon" class="text-32px" />
    </template>
    <template #value>
      <CountTo
        :prefix="cardData.unit"
        :start-value="1"
        :end-value="cardData.value"
        class="text-30px text-white dark:text-dark"
      />
    </template>
  </GenericCard>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useAuthStore } from '@/store/modules/auth';
import { createLogger } from '@/utils/logger';
import { $t } from '@/locales';
import { sumData, totalNumber } from '@/service/api';
import GenericCard from '@/card2.1/components/common/generic-card/component.vue';

// 与原版保持1:1一致
const logger = createLogger('OffLine');

defineOptions({ name: 'NumCard' });

const authStore = useAuthStore();

// 卡片数据配置，与原版保持1:1一致
const cardData = ref<any>({
  id: 'download',
  title: $t('card.offlineDev'),
  value: 0,
  unit: $t('card.deviceUnit'),
  colors: ['#56cdf3', '#719de3'], // 与原版保持一致的颜色
  icon: 'fa-ban'
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
      logger.error('Data does not contain the required properties or they are not numbers.');
    }
  } catch (error) {
    // 处理请求数据时的错误
    logger.error('Error fetching data:', error);
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