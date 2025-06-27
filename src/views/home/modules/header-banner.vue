<script setup lang="ts">
import { computed } from 'vue'
import { $t } from '@/locales'
import { useAppStore } from '@/store/modules/app'
import { useAuthStore } from '@/store/modules/auth'

defineOptions({
  name: 'HeaderBanner'
})

const appStore = useAppStore()
const authStore = useAuthStore()

const gap = computed(() => (appStore.isMobile ? 0 : 16))

interface StatisticData {
  id: number
  label: string
  value: string
}

const statisticData = computed<StatisticData[]>(() => [
  {
    id: 0,
    label: "项目数",
    value: '25'
  },
  {
    id: 1,
    label: "待办",
    value: '4/16'
  },
  {
    id: 2,
    label: "消息",
    value: '12'
  }
])
</script>

<template>
  <NCard :bordered="false" class="card-wrapper">
    <NGrid :x-gap="gap" :y-gap="16" responsive="screen" item-responsive>
      <NGi span="24 s:24 m:18">
        <div class="flex-y-center">
          <div class="size-72px shrink-0 overflow-hidden rd-1/2">
            <img src="@/assets/imgs/soybean.jpg" class="size-full" />
          </div>
          <div class="pl-12px">
            <h3 class="text-18px font-semibold">
              {{ "欢迎回来，{userName}！" }}
            </h3>
            <p class="text-#999 leading-30px">{{ "今日多云转晴，20℃ - 25℃!" }}</p>
          </div>
        </div>
      </NGi>
      <NGi span="24 s:24 m:6">
        <NSpace :size="24" justify="end">
          <NStatistic v-for="item in statisticData" :key="item.id" class="whitespace-nowrap" v-bind="item" />
        </NSpace>
      </NGi>
    </NGrid>
  </NCard>
</template>

<style scoped></style>
