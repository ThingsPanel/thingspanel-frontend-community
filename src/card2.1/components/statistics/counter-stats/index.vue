<template>
  <n-card class="counter-stats" :style="cardStyle" embedded>
    <div class="stats-content">
      <div class="stats-icon">
        <n-icon :size="config.iconSize" :color="config.iconColor">
          <TrendingUp v-if="trend === 'up'" />
          <TrendingDown v-else-if="trend === 'down'" />
          <Remove v-else />
        </n-icon>
      </div>
      
      <div class="stats-data">
        <div class="stats-value" :style="valueStyle">
          {{ formatValue(displayData.value || config.defaultValue) }}
        </div>
        
        <div class="stats-title">
          {{ displayData.title || config.title }}
        </div>
        
        <div v-if="config.showChange" class="stats-change" :class="{ positive: changeValue > 0, negative: changeValue < 0 }">
          {{ changeValue > 0 ? '+' : '' }}{{ changeValue }}%
        </div>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NIcon } from 'naive-ui'
import { TrendingUp, TrendingDown, Remove } from '@vicons/ionicons5'
import { useCard2Props } from '@/card2.1/hooks'
import type { CounterStatsConfig } from './settingConfig'

interface Props {
  config: CounterStatsConfig
  data?: Record<string, unknown>
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

const { config, displayData } = useCard2Props(props)

const changeValue = computed(() => displayData.value.change || 0)
const trend = computed(() => {
  if (changeValue.value > 0) return 'up'
  if (changeValue.value < 0) return 'down'
  return 'flat'
})

const cardStyle = computed(() => ({
  backgroundColor: config.value.backgroundColor,
  border: `1px solid ${config.value.borderColor}`,
  borderRadius: `${config.value.borderRadius}px`
}))

const valueStyle = computed(() => ({
  fontSize: `${config.value.valueSize}px`,
  fontWeight: config.value.valueBold ? 'bold' : 'normal',
  color: config.value.valueColor
}))

const formatValue = (value: unknown) => {
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return String(value || '0')
}
</script>

<style scoped>
.counter-stats {
  height: 100%;
  padding: 16px;
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 16px;
  height: 100%;
}

.stats-icon {
  flex-shrink: 0;
}

.stats-data {
  flex: 1;
  min-width: 0;
}

.stats-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--text-color-1);
  margin-bottom: 4px;
}

.stats-title {
  font-size: 14px;
  color: var(--text-color-2);
  margin-bottom: 4px;
}

.stats-change {
  font-size: 12px;
  font-weight: 500;
}

.stats-change.positive {
  color: var(--success-color);
}

.stats-change.negative {
  color: var(--error-color);
}
</style>