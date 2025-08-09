<template>
  <div class="data-mapping-config">
    <n-divider title-placement="left">数据映射</n-divider>

    <div v-if="dataPaths && dataPaths.length > 0" class="mapping-list">
      <div v-for="(mapping, index) in dataPaths" :key="index" class="mapping-item">
        <div class="mapping-row">
          <span class="mapping-label">{{ mapping.target }}</span>
          <n-select
            v-model:value="mapping.key"
            :options="availablePathOptions"
            placeholder="选择JSON路径"
            size="small"
            @update:value="updateMapping"
          />
        </div>
      </div>
    </div>

    <div class="mapping-actions">
      <n-button size="small" @click="generateDefaultMappings">自动映射</n-button>
    </div>

    <n-divider title-placement="left">预览</n-divider>

    <n-tabs type="line" size="small">
      <n-tab-pane name="raw" tab="原始">
        <pre class="json-preview">{{ formattedJson }}</pre>
      </n-tab-pane>
      <n-tab-pane name="resolved" tab="解析">
        <div v-if="resolvedData.length > 0" class="resolved-list">
          <div v-for="item in resolvedData" :key="item.path" class="resolved-item">
            <span class="path">{{ item.path }}</span>
            <span class="value">{{ item.value }}</span>
          </div>
        </div>
        <n-empty v-else description="无结果" size="small" />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NDivider, NSelect, NButton, NTabs, NTabPane, NEmpty } from 'naive-ui'
import { dataPathResolver } from '../../utils/data-path-resolver'
import type { DataPathMapping } from '../../types/data-source'

interface Props {
  dataPaths: DataPathMapping[]
  jsonData: any
  onUpdateMapping: (mapping: DataPathMapping[]) => void
}

const props = defineProps<Props>()

// 可用的数据路径选项
const availablePathOptions = computed(() => {
  if (!props.jsonData) return []

  const paths = dataPathResolver.getAvailablePaths(props.jsonData)
  return paths.map(path => ({
    label: path,
    value: path
  }))
})

// 格式化JSON显示
const formattedJson = computed(() => {
  try {
    return JSON.stringify(props.jsonData, null, 2)
  } catch {
    return '无效的JSON数据'
  }
})

// 解析数据预览
const resolvedData = computed(() => {
  const results: Array<{ path: string; value: any }> = []

  props.dataPaths?.forEach(mapping => {
    try {
      const value = dataPathResolver.resolve(props.jsonData, mapping.key)
      results.push({
        path: `${mapping.key} → ${mapping.target}`,
        value: JSON.stringify(value)
      })
    } catch (error) {
      results.push({
        path: `${mapping.key} → ${mapping.target}`,
        value: `错误: ${error}`
      })
    }
  })

  return results
})

// 更新映射
const updateMapping = () => {
  props.onUpdateMapping([...props.dataPaths])
}

// 生成默认映射
const generateDefaultMappings = () => {
  if (!props.jsonData || Object.keys(props.jsonData).length === 0) return

  const availablePaths = dataPathResolver.getAvailablePaths(props.jsonData)

  const newMappings = props.dataPaths.map(mapping => {
    const targetKey = mapping.target
    const exactMatch = availablePaths.find(path => {
      const pathKey = path.split('.').pop() || path
      return pathKey === targetKey
    })

    if (exactMatch) {
      return { ...mapping, key: exactMatch }
    }

    return mapping
  })

  props.onUpdateMapping(newMappings)
}
</script>

<style scoped>
.data-mapping-config {
  padding: 8px;
}

.mapping-list {
  margin-bottom: 8px;
}

.mapping-item {
  margin-bottom: 8px;
}

.mapping-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mapping-label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  min-width: 60px;
  text-align: right;
}

.mapping-row .n-select {
  flex: 1;
}

.mapping-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.json-preview {
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  max-height: 120px;
  overflow: auto;
  white-space: pre-wrap;
}

.resolved-list {
  max-height: 120px;
  overflow: auto;
}

.resolved-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 3px;
  margin-bottom: 2px;
  font-size: 11px;
}

.path {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
