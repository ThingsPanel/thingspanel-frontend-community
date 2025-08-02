<template>
  <div ref="containerRef" class="responsive-chart">
    <div class="chart-title">Sales Data</div>
    <div class="chart-bars">
      <div
        v-for="bar in bars"
        :key="bar.id"
        class="chart-bar"
        :style="{ height: bar.height + '%' }"
        :title="`Value: ${bar.value}`"
      >
        <span class="bar-label">{{ bar.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useElementSize } from '@vueuse/core'

defineProps<{
  item: object
}>()

const containerRef = ref(null)
const { width } = useElementSize(containerRef)

const allData = [
  { id: 1, value: 50, label: 'Jan' },
  { id: 2, value: 75, label: 'Feb' },
  { id: 3, value: 60, label: 'Mar' },
  { id: 4, value: 85, label: 'Apr' },
  { id: 5, value: 95, label: 'May' },
  { id: 6, value: 70, label: 'Jun' },
  { id: 7, value: 65, label: 'Jul' },
  { id: 8, value: 80, label: 'Aug' },
  { id: 9, value: 90, label: 'Sep' },
  { id: 10, value: 100, label: 'Oct' },
  { id: 11, value: 88, label: 'Nov' },
  { id: 12, value: 92, label: 'Dec' },
]

const bars = computed(() => {
  const numBars = Math.floor(width.value / 40) // 40px per bar approx
  if (numBars <= 0) return []
  const data = allData.slice(0, numBars)
  const maxValue = Math.max(...data.map(d => d.value), 1)
  return data.map(d => ({ ...d, height: (d.value / maxValue) * 100 }))
})
</script>

<style scoped>
.responsive-chart {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px;
  box-sizing: border-box;
  overflow: hidden;
}
.chart-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 10px;
  flex-shrink: 0;
}
.chart-bars {
  width: 100%;
  flex-grow: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 5px;
  border-left: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  padding-left: 5px;
}
.chart-bar {
  width: 100%;
  background: linear-gradient(to top, #3b82f6, #60a5fa);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  position: relative;
  display: flex;
  justify-content: center;
}
.bar-label {
    position: absolute;
    bottom: -20px;
    font-size: 10px;
    color: #666;
    white-space: nowrap;
}
</style>