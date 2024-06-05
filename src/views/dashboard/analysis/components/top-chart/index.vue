<script setup lang="ts">
import LineChart from '@/views/home/modules/line-chart.vue';
import PieChart from '@/views/home/modules/pie-chart.vue';
import { $t } from '@/locales';

defineOptions({ name: 'DashboardAnalysisTopCard' });
</script>

<template>
  <NGrid :x-gap="16" :y-gap="16" :item-responsive="true">
    <NGridItem span="0:24 640:24 1024:6">
      <NCard :bordered="false" class="rounded-8px shadow-sm">
        <div class="h-360px w-full py-12px">
          <h3 class="text-16px font-bold">Dashboard</h3>
          <p class="text-#aaa">上月概览</p>
          <h3 class="pt-32px text-24px font-bold">
            <CountTo prefix="$" :start-value="0" :end-value="7754" />
          </h3>
          <p class="text-#aaa">{{ $t('generate.earningsOfCurrentMonth') }}</p>
          <h3 class="pt-32px text-24px font-bold">
            <CountTo :start-value="0" :end-value="1234" />
          </h3>
          <p class="text-#aaa">{{ $t('generate.salesOfCurrentMonth') }}</p>
          <NButton class="mt-24px whitespace-pre-wrap" type="primary">{{ $t('generate.summaryOfLastMonth') }}</NButton>
        </div>
      </NCard>
    </NGridItem>
    <NGridItem span="0:24 640:24 1024:10">
      <NCard :bordered="false" class="rounded-8px shadow-sm">
        <LineChart />
      </NCard>
    </NGridItem>
    <NGridItem span="0:24 640:24 1024:8">
      <NCard :bordered="false" class="rounded-8px shadow-sm">
        <PieChart />
      </NCard>
    </NGridItem>
  </NGrid>
</template>

<style scoped></style>
