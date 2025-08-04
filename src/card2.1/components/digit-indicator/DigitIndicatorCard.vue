<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed, watch } from 'vue'
import { NIcon } from 'naive-ui'
import { icons as iconOptions } from '@/components/common/icons'
import { universalDataSourceManager } from '@/components/visual-editor/core/universal-data-source-manager'
import type { DataSource, DataSourceValue } from '@/components/visual-editor/types/data-source'

interface Props {
  properties?: {
    unit?: string
    color?: string
    iconName?: string
    title?: string
    value?: string | number
    fontSize?: number
  }
  metadata?: {
    dataSource?: DataSource
  }
}

const props = withDefaults(defineProps<Props>(), {
  properties: () => ({})
})

const cardRef = ref<HTMLElement | null>(null)
const fontSize = ref('14px')
let resizeObserver: ResizeObserver | null = null

// 数据源相关状态
const dataSourceValue = ref<DataSourceValue | null>(null)
let unsubscribeDataSource: (() => void) | null = null

// 计算显示值
const displayValue = computed(() => {
  // 优先使用数据源的值
  if (dataSourceValue.value?.values) {
    console.log('🔧 DigitIndicatorCard - 显示值计算:', {
      mappedValues: dataSourceValue.value.values,
      value: dataSourceValue.value.values.value
    })
    return dataSourceValue.value.values.value || 0
  }

  // 回退到属性配置
  return props.properties?.value || 0
})

// 计算显示单位
const displayUnit = computed(() => {
  // 优先使用数据源的值
  if (dataSourceValue.value?.values) {
    return dataSourceValue.value.values.unit || ''
  }

  // 回退到属性配置
  return props.properties?.unit || ''
})

// 计算显示标题
const displayTitle = computed(() => {
  // 优先使用数据源的值
  if (dataSourceValue.value?.values) {
    return dataSourceValue.value.values.title || ''
  }

  // 回退到属性配置
  return props.properties?.title || '数值'
})

const displayColor = computed(() => {
  return props.properties?.color ?? '#1890ff'
})

const displayFontSize = computed(() => {
  return props.properties?.fontSize ?? 24
})

const displayIcon = computed(() => {
  return props.properties?.iconName ?? 'Water'
})

// 处理数据源
const handleDataSource = (dataSource: DataSource | undefined) => {
  // 取消之前的订阅
  if (unsubscribeDataSource) {
    unsubscribeDataSource()
    unsubscribeDataSource = null
  }

  // 重置数据源值
  dataSourceValue.value = null

  // 如果有新的数据源，订阅它
  if (dataSource && dataSource.enabled) {
    console.log('🔧 DigitIndicatorCard - 订阅数据源:', {
      type: dataSource.type,
      dataPaths: dataSource.dataPaths,
      name: dataSource.name
    })
    unsubscribeDataSource = universalDataSourceManager.subscribe(dataSource, value => {
      console.log('🔧 DigitIndicatorCard - 收到数据源更新:', {
        values: value.values,
        dataPaths: value.metadata?.dataPaths,
        originalData: value.metadata?.originalData
      })
      dataSourceValue.value = value
    })
  }
}

// 监听数据源变化
watch(() => props.metadata?.dataSource, handleDataSource, { immediate: true, deep: true })

const handleResize = (entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect
    const newFontSize = `${Math.min(width, height) / 10}px`
    fontSize.value = newFontSize
  }
}

onMounted(() => {
  if (cardRef.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(cardRef.value)
    handleResize([{ contentRect: cardRef.value.getBoundingClientRect() }] as ResizeObserverEntry[])
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }

  if (unsubscribeDataSource) {
    unsubscribeDataSource()
    unsubscribeDataSource = null
  }
})
</script>

<template>
  <div ref="cardRef" class="card-container">
    <div class="card-content" :style="{ fontSize: displayFontSize + 'px' }">
      <div class="icon-container">
        <NIcon class="iconclass" :color="displayColor">
          <component :is="iconOptions[displayIcon]" />
        </NIcon>
      </div>
      <div class="value-container">
        <span class="value" :title="displayValue + displayUnit">{{ displayValue }} {{ displayUnit }}</span>
      </div>
      <div class="metric-name-container">
        <span class="metric-name" :title="displayTitle">
          {{ displayTitle }}
        </span>
      </div>
    </div>
  </div>
</template>

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
