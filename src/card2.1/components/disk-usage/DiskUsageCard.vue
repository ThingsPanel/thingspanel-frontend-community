<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { $t } from '@/locales'
import { useLoading } from '~/packages/hooks'
// Import the API function for system metrics
import { getSystemMetricsCurrent } from '@/service/api/system-data'
// Import GradientBg using the index file in components directory
import GradientBg from '../tenant-count/GradientBg.vue'
import { createLogger } from '@/utils/logger'

const logger = createLogger('DiskUsageCard') // Changed logger name

defineOptions({ name: 'DiskUsageCard' }) // Changed component name

// 组件属性
interface Props {
  title?: string
  unit?: string
  colors?: string[]
  icon?: string
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '磁盘使用率',
  unit: '%',
  colors: ['#fb923c', '#f97316'],
  icon: 'ant-design:hdd-outlined',
  refreshInterval: 30000
})

const { loading, startLoading, endLoading } = useLoading(false)
const value = ref<number | null>(null)
const unit = ref<string>(props.unit)
let intervalId: number | null = null

// Fetches system metrics data
const fetchData = async () => {
  startLoading()
  try {
    const response = await getSystemMetricsCurrent()
    logger.info('System Metrics Response:', response)

    // Extract Disk usage from the response data
    const diskUsagePercent = response?.data?.disk_usage

    if (typeof diskUsagePercent === 'number') {
      value.value = parseFloat(diskUsagePercent.toFixed(1)) // Keep one decimal place
      unit.value = props.unit // Set unit to percentage
    } else {
      logger.warn('Disk usage percentage not found or not a number in response:', response)
      value.value = null
      unit.value = props.unit
    }
  } catch (error) {
    logger.error('Error fetching system metrics:', error)
    value.value = null
    unit.value = props.unit
  } finally {
    endLoading()
  }
}

// Fetch data on mount and set interval
onMounted(() => {
  fetchData()
  intervalId = window.setInterval(fetchData, props.refreshInterval)
})

// Clear interval on unmount
onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<template>
  <!-- Changed gradient colors to orange -->
  <GradientBg class="card-wrapper" :start-color="props.colors[0]" :end-color="props.colors[1]">
    <h3 class="text-16px">{{ props.title }}</h3>
    <!-- Changed title key -->
    <div class="flex justify-between items-center pt-30px">
      <SvgIcon :icon="props.icon" class="text-32px" />
      <!-- Changed Icon -->
      <div class="flex flex-col items-end">
        <template v-if="loading">
          <span class="text-30px text-white dark:text-dark">{{ $t('card.loading') }}</span>
        </template>
        <template v-else-if="value !== null">
          <CountTo :start-value="0" :end-value="value" :suffix="unit" class="text-30px text-white dark:text-dark" />
        </template>
        <template v-else>
          <span class="text-20px text-white dark:text-dark">{{ $t('card.noData') }}</span>
        </template>
      </div>
    </div>
  </GradientBg>
</template>

<style scoped>
.card-wrapper {
  width: 100%;
  height: 100%;
  min-width: max-content;
  min-height: max-content;
}
</style>
