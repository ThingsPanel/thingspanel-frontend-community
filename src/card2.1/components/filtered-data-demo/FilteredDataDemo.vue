<template>
  <div class="filtered-data-demo">
    <div class="demo-header">
      <n-icon><FunnelOutline /></n-icon>
      <span>过滤数据展示</span>
      <n-tag size="small" :type="hasData ? 'success' : 'default'">
        {{ getDataStatus() }}
      </n-tag>
    </div>

    <div class="demo-content">
      <!-- 最终数据显示 -->
      <div v-if="hasData" class="final-data-display">
        <div class="data-type-info">
          <n-space size="small">
            <n-tag size="tiny" type="info">类型: {{ getDataType(finalData) }}</n-tag>
            <n-tag v-if="Array.isArray(finalData)" size="tiny" type="default">长度: {{ finalData.length }}</n-tag>
            <n-tag v-else-if="typeof finalData === 'object' && finalData !== null" size="tiny" type="default">
              字段: {{ Object.keys(finalData).length }}
            </n-tag>
          </n-space>
        </div>

        <!-- 数据内容展示 -->
        <div class="data-content">
          <!-- 数组类型 -->
          <div v-if="Array.isArray(finalData)" class="array-display">
            <div v-for="(item, index) in finalData.slice(0, 5)" :key="index" class="array-item">
              <span class="item-index">#{{ index + 1 }}</span>
              <span class="item-value">{{ formatValue(item) }}</span>
            </div>
            <div v-if="finalData.length > 5" class="more-indicator">
              <n-text depth="3">... 还有 {{ finalData.length - 5 }} 项</n-text>
            </div>
          </div>

          <!-- 对象类型 -->
          <div v-else-if="typeof finalData === 'object' && finalData !== null" class="object-display">
            <div v-for="(value, key) in finalData" :key="key" class="object-item">
              <span class="key">{{ key }}:</span>
              <span class="value">{{ formatValue(value) }}</span>
            </div>
          </div>

          <!-- 基础类型 -->
          <div v-else class="primitive-display">
            <div class="primitive-value">{{ formatValue(finalData) }}</div>
          </div>
        </div>
      </div>

      <!-- 无数据状态 -->
      <div v-else class="no-data">
        <n-empty description="暂无过滤数据" size="small">
          <template #extra>
            <n-text depth="3" style="font-size: 11px">💡 在右侧"数据源"配置中设置过滤路径</n-text>
          </template>
        </n-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 过滤数据展示组件
 * 用于显示经过数据过滤器处理后的最终数据
 */

import { computed, toRefs, watch } from 'vue'
import { NIcon, NTag, NEmpty, NText, NSpace } from 'naive-ui'
import { FunnelOutline } from '@vicons/ionicons5'

interface Props {
  finalData?: any // 经过过滤器处理的最终数据
}

const props = withDefaults(defineProps<Props>(), {
  finalData: undefined
})

const { finalData } = toRefs(props)

// 是否有数据
const hasData = computed(() => {
  return finalData.value !== undefined && finalData.value !== null
})

// 监听数据变化，用于调试
watch(
  finalData,
  newValue => {
    console.log('🔍 [FilteredDataDemo] 接收到过滤后的数据:', newValue)
  },
  { deep: true }
)

// 获取数据类型
const getDataType = (data: any): string => {
  if (data === null) return 'null'
  if (data === undefined) return 'undefined'
  if (Array.isArray(data)) return 'array'
  return typeof data
}

// 获取数据状态描述
const getDataStatus = (): string => {
  if (!hasData.value) return '无数据'

  const data = finalData.value
  if (Array.isArray(data)) {
    return `${data.length} 项数据`
  } else if (typeof data === 'object' && data !== null) {
    return `${Object.keys(data).length} 个字段`
  } else {
    return `${typeof data} 类型`
  }
}

// 格式化值用于显示
const formatValue = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `[${value.length} items]`
    } else {
      const keys = Object.keys(value)
      if (keys.length <= 3) {
        return JSON.stringify(value)
      } else {
        const preview = keys.slice(0, 3).reduce((acc, key) => {
          acc[key] = value[key]
          return acc
        }, {} as any)
        return `${JSON.stringify(preview).slice(0, -1)}...}`
      }
    }
  }

  const str = String(value)
  return str.length > 50 ? str.substring(0, 47) + '...' : str
}
</script>

<style scoped>
.filtered-data-demo {
  width: 100%;
  height: 100%;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.demo-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.demo-content {
  flex: 1;
  overflow-y: auto;
}

.final-data-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-type-info {
  padding: 8px;
  background: var(--body-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.data-content {
  background: var(--body-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 12px;
}

.array-display {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.array-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: var(--card-color);
  border-radius: 3px;
}

.item-index {
  font-size: 11px;
  color: var(--text-color-3);
  min-width: 20px;
}

.item-value {
  font-size: 12px;
  color: var(--text-color);
  flex: 1;
  word-break: break-all;
}

.object-display {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.object-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: var(--card-color);
  border-radius: 3px;
}

.key {
  font-weight: 500;
  color: var(--primary-color);
  font-size: 12px;
  min-width: 80px;
}

.value {
  color: var(--text-color);
  font-size: 12px;
  flex: 1;
  word-break: break-all;
}

.primitive-display {
  text-align: center;
  padding: 20px;
}

.primitive-value {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  padding: 12px;
  background: var(--card-color);
  border-radius: 6px;
  border: 2px dashed var(--border-color);
}

.more-indicator {
  text-align: center;
  padding: 6px;
  font-size: 11px;
}

.no-data {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
