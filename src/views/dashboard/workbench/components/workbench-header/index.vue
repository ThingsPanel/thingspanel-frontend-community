<script setup lang="ts">
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';

defineOptions({ name: 'DashboardWorkbenchHeader' });

const auth = useAuthStore();

interface StatisticData {
  id: number;
  label: string;
  value: string;
}

const statisticData: StatisticData[] = [
  {
    id: 0,
    label: $t('card.projects'),
    value: '25'
  },
  {
    id: 1,
    label: $t('card.todo'),
    value: '4/16'
  },
  {
    id: 2,
    label: $t('card.message'),
    value: '12'
  }
];
</script>

<template>
  <NCard :bordered="false" class="rounded-8px shadow-sm">
    <div class="flex-y-center justify-between">
      <div class="flex-y-center">
        <IconLocalAvatar class="text-70px" />
        <div class="pl-12px">
          <h3 class="text-18px font-semibold">
            <span>{{ $t('card.goodMorning') }}</span>
            ，{{ auth.userInfo.userName }},
            <span>{{ $t('card.anotherEnergeticDay') }}</span>
            ！
          </h3>
          <p class="text-#999 leading-30px">{{ $t('generate.weather-forecast') }}</p>
        </div>
      </div>
      <NSpace :size="24" :wrap="false">
        <NStatistic v-for="item in statisticData" :key="item.id" class="whitespace-nowrap" v-bind="item"></NStatistic>
      </NSpace>
    </div>
  </NCard>
</template>

<style scoped></style>
