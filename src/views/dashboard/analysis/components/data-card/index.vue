<script setup lang="ts">
import { $t } from '@/locales'
import { GradientBg } from './components'

defineOptions({ name: 'DashboardAnalysisDataCard' })

interface CardData {
  id: string
  title: string
  value: number
  unit: string
  colors: [string, string]
  icon: string
}

const cardData: CardData[] = [
  {
    id: 'visit',
    title: $t('card.visitors'),
    value: 1000000,
    unit: '',
    colors: ['#ec4786', '#b955a4'],
    icon: 'ant-design:bar-chart-outlined'
  },
  {
    id: 'amount',
    title: $t('card.volumeTransaction'),
    value: 234567.89,
    unit: '$',
    colors: ['#865ec0', '#5144b4'],
    icon: 'ant-design:money-collect-outlined'
  },
  {
    id: 'download',
    title: $t('card.downloads'),
    value: 666666,
    unit: '',
    colors: ['#56cdf3', '#719de3'],
    icon: 'carbon:document-download'
  },
  {
    id: 'trade',
    title: $t('card.turnover'),
    value: 999999,
    unit: '',
    colors: ['#fcbc25', '#f68057'],
    icon: 'ant-design:trademark-circle-outlined'
  }
]
</script>

<template>
  <NCard :bordered="false" class="h-full rounded-8px shadow-sm">
    <NGrid cols="s:1 m:2 l:4" responsive="screen" :x-gap="16" :y-gap="16">
      <NGridItem v-for="item in cardData" :key="item.id">
        <GradientBg class="h-100px" :start-color="item.colors[0]" :end-color="item.colors[1]">
          <h3 class="text-16px">{{ item.title }}</h3>
          <div class="flex justify-between pt-12px">
            <SvgIcon :icon="item.icon" class="text-32px" />
            <CountTo
              :prefix="item.unit"
              :start-value="1"
              :end-value="item.value"
              class="text-30px text-white dark:text-dark"
            />
          </div>
        </GradientBg>
      </NGridItem>
    </NGrid>
  </NCard>
</template>

<style scoped></style>
