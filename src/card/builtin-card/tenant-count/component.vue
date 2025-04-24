<script setup lang="ts">
import { ref } from 'vue';
import { createLogger } from '@/utils/logger';
import { $t } from '@/locales';
import { tenant } from '@/service/api/system-data';
import { GradientBg } from './components';


const logger = createLogger('TenantCountCard');

defineOptions({ name: 'TenantCountCard' });

const cardData = ref<any>({
  id: 'tenant-count',
  title: $t('card.tenantCount.title'),
  value: 0,
  unit: $t('card.tenantCount.unit', '个'),
  colors: ['#3b82f6', '#60a5fa'],
  icon: 'mdi:account-group'
});

const getData = async () => {
  try {
    const {data} = await tenant();
    console.log('Tenant board data response:', data);
  

    if (data &&  typeof data.user_total === 'number') {
      cardData.value.value = data.user_total||0
    }
  } catch (error) {
    cardData.value.value = 0;
  }
};

getData();
</script>

<template>
  <GradientBg class="data-card" :start-color="cardData.colors[0]" :end-color="cardData.colors[1]">
    <h3 class="text-16px font-medium text-white">{{ cardData.title }}</h3>
    <div class="flex justify-between items-end pt-12px">
      <SvgIcon :icon="cardData.icon" class="text-32px text-white" />
      <CountTo
        :suffix="cardData.unit"
        :start-value="0"
        :end-value="cardData.value"
        class="text-30px text-white dark:text-white"
      />
    </div>
  </GradientBg>
</template>

<style scoped>
.data-card {
  width: 100%;
  height: 100%;
}
</style>
