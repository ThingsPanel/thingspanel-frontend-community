<template>
  <div ref="cardRef" class="card-container">
    <div class="card-content" :style="{ fontSize: fontSize }">
      <div class="icon-container">
        <NIcon class="iconclass" :color="iconColor">
          <component :is="iconComponent" />
        </NIcon>
      </div>
      <div class="value-container">
        <span class="value" :title="displayValue">
          {{ displayValue }}
        </span>
      </div>
      <div class="metric-name-container">
        <span class="metric-name" :title="metricName">
          {{ metricName }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineExpose } from 'vue'
import { NIcon } from 'naive-ui'
import { icons as iconOptions } from '@/components/common/icons'
import { useDigitIndicatorData } from './useData'
import { $t } from '@/locales'

interface Props {
  properties?: Record<string, any>
  metadata?: {
    card2Data?: any
  }
}

const props = withDefaults(defineProps<Props>(), {
  properties: () => ({}),
  metadata: () => ({ card2Data: {} })
})

// 使用数据钩子
const { detail, unit, fontSize, cardRef, updateData, setSeries, initializeData } = useDigitIndicatorData(props)

// 计算属性
const iconColor = computed(() => props.properties?.color || 'blue')

const iconName = computed(() => props.properties?.iconName || 'Water')

const iconComponent = computed(() => iconOptions[iconName.value] || iconOptions.Water)

const customUnit = computed(() => props.properties?.unit || '')

const displayValue = computed(() => {
  const value = detail.value !== null && detail.value !== '' ? detail.value : '45'
  const unitText = customUnit.value || unit.value || '%'
  return `${value} ${unitText}`
})

const metricName = computed(() => {
  const dataSource = props.metadata?.card2Data?.dataSource
  return dataSource?.deviceSource?.[0]?.metricsName || $t('card.humidity')
})

// 暴露方法
defineExpose({
  updateData,
  setSeries,
  initializeData
})
</script>

<style scoped>
.card-container {
  width: 100%;
  height: 100%;
}

.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 5% 5%;
}

.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.iconclass {
  font-size: 3em;
}

.value-container {
  display: flex;
  justify-content: center;
  align-items: baseline;
  width: 100%;
}

.value {
  font-size: 2em;
  font-weight: bold;
  text-wrap: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unit {
  margin-left: 0.3em;
  font-size: 2em;
}

.metric-name-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
}

.metric-name {
  font-size: 1em;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}
</style>
