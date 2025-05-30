<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { $t } from '@/locales'
import { useLoading } from '~/packages/hooks'
// Import the new API function
import { getSystemMetricsCurrent } from '@/service/api/system-data'
import { GradientBg } from './components'
import { createLogger } from '@/utils/logger'

const logger = createLogger('MemoryUsageCard')

defineOptions({ name: 'MemoryUsageCard' })

const { loading, startLoading, endLoading } = useLoading(false)
const value = ref<number | null>(null) // Can be null initially
const unit = ref<string>('') // Unit for memory usage
let intervalId: number | null = null

// Fetches system metrics data
const fetchData = async () => {
  startLoading()
  try {
    // Call the new API
    const response = await getSystemMetricsCurrent() // Assuming no params needed
    logger.info('System Metrics Response:', response)

    // Safely access nested data, assuming a structure
    // Adjust path based on actual API response: e.g., response.data.memory_usage_percent or similar
    const memoryUsagePercent = response?.data?.memory_usage

    if (typeof memoryUsagePercent === 'number') {
      value.value = parseFloat(memoryUsagePercent.toFixed(1)) // Keep one decimal place
      unit.value = '%' // Set unit to percentage
    } else {
      logger.warn('Memory usage percentage not found or not a number in response:', response)
      value.value = null // Set to null if data is invalid
      unit.value = '' // Clear unit
    }
  } catch (error) {
    logger.error('Error fetching system metrics:', error)
    value.value = null // Set to null on error
    unit.value = '' // Clear unit
  } finally {
    endLoading()
  }
}

// Fetch data on mount and set interval for periodic refresh (e.g., every 30 seconds)
onMounted(() => {
  fetchData() // Initial fetch
  intervalId = window.setInterval(fetchData, 30000) // Refresh every 30s
})

// Clear interval on unmount
onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<template>
  <!-- Use GradientBg as the root element, apply necessary styles -->
  <GradientBg class="card-wrapper" start-color="#56cdf3" end-color="#719de3">
    <!-- Use memoryUsage key for title -->
    <h3 class="text-16px">{{ $t('card.memoryUsage') }}</h3>
    <!-- Adjust padding-top and add items-center for alignment -->
    <div class="flex justify-between items-center pt-30px">
      <!-- Change Icon if desired (e.g., memory related icon) -->
      <SvgIcon icon="ant-design:alert-outlined" class="text-32px" />
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
        <!-- Optional: Add a subtitle or link -->
        <!-- <p class="text-12px text-gray-400">{{ $t('card.viewAll') }}</p> -->
      </div>
    </div>
  </GradientBg>
</template>

<style scoped>
/* Add styles similar to alarm-count's .access */
.card-wrapper {
  width: 100%;
  height: 100%;
  min-width: max-content;
  min-height: max-content;
  /* Inherited padding and rounding from GradientBg component */
}

/* Optional: Explicitly define items-center if needed, though Tailwind class should handle it */
/*.flex.items-center {*/
/*  align-items: center;*/
/*}*/
</style>
