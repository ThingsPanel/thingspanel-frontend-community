<template>
  <div class="static-data-source-config">
    <n-form :model="config" label-placement="top" size="small">
      <n-form-item label="JSON数据">
        <div class="json-editor-container">
          <CodemirrorEditor
            v-model="jsonString"
            :options="editorOptions"
            @update:modelValue="updateJsonData"
          />
          <div class="json-actions">
            <n-button size="tiny" @click="loadExampleData">示例</n-button>
            <n-button size="tiny" @click="formatJson">格式化</n-button>
          </div>
        </div>
      </n-form-item>
      
      <n-divider title-placement="left">数据映射</n-divider>
      
      <div v-if="config.dataPaths && config.dataPaths.length > 0" class="mapping-list">
        <div v-for="(mapping, index) in config.dataPaths" :key="index" class="mapping-item">
          <div class="mapping-row">
            <span class="mapping-label">{{ mapping.target }}</span>
            <n-select
              v-model:value="mapping.key"
              :options="availablePathOptions"
              placeholder="选择JSON路径"
              size="small"
              @update:value="updateConfig"
            />
          </div>
        </div>
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
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, NButton, NDivider, NCard, NTabs, NTabPane, NEmpty, NSpace, NIcon } from 'naive-ui'
import CodemirrorEditor from 'codemirror-editor-vue3'
import type { StaticDataSource } from '../../types/data-source'
import { dataPathResolver } from '../../utils/data-path-resolver'
import { DataSourceType } from '../../types/data-source'

interface Props {
  modelValue: StaticDataSource
}

interface Emits {
  'update:modelValue': [value: StaticDataSource]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const config = ref<StaticDataSource>({
  ...props.modelValue,
  type: DataSourceType.STATIC,
  enabled: true,
  data: props.modelValue?.data || {},
  dataPaths: props.modelValue?.dataPaths || []
})

const jsonString = ref('')
const jsonError = ref('')

// CodeMirror 编辑器配置
const editorOptions = {
  mode: 'application/json',
  theme: 'default',
  lineNumbers: true,
  lineWrapping: true,
  foldGutter: true,
  gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
  autoCloseBrackets: true,
  matchBrackets: true,
  indentUnit: 2,
  tabSize: 2,
  indentWithTabs: false,
  extraKeys: {
    'Ctrl-Space': 'autocomplete'
  }
}

// 可用的数据路径选项
const availablePathOptions = computed(() => {
  if (!config.value.data) return []
  
  const paths = dataPathResolver.getAvailablePaths(config.value.data)
  return paths.map(path => ({
    label: path,
    value: path
  }))
})

// 格式化JSON显示
const formattedJson = computed(() => {
  try {
    return JSON.stringify(config.value.data, null, 2)
  } catch {
    return '无效的JSON数据'
  }
})

// 解析数据预览
const resolvedData = computed(() => {
  const results: Array<{ path: string; value: any }> = []
  
  config.value.dataPaths?.forEach(mapping => {
    try {
      const value = dataPathResolver.resolve(config.value.data, mapping.key)
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

// 更新JSON数据
const updateJsonData = (value: string) => {
  jsonString.value = value
  try {
    config.value.data = JSON.parse(value)
    // 自动生成数据路径映射
    generateDefaultMappings()
    updateConfig()
    jsonError.value = '' // 清除错误提示
  } catch (error) {
    jsonError.value = 'JSON解析错误，请检查输入的JSON格式'
    console.warn('JSON解析错误:', error)
  }
}

// 加载示例数据
const loadExampleData = () => {
  const exampleJson = {
    "sensors": {
      "temperature": 25.5,
      "humidity": 65.2,
      "pressure": 1013.25
    },
    "device": {
      "status": "运行中",
      "mode": "自动"
    },
    "timestamp": "2024-01-01T12:00:00Z"
  }
  
  // 直接设置JSON字符串
  jsonString.value = JSON.stringify(exampleJson, null, 2)
  
  // 更新配置
  config.value.data = exampleJson
  
  // 自动生成映射
  generateDefaultMappings()
  
  // 更新配置
  updateConfig()
  
  console.log('🔧 StaticDataSourceConfig - 示例数据已加载:', exampleJson)
}

// 格式化JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(jsonString.value)
    jsonString.value = JSON.stringify(parsed, null, 2)
  } catch (error) {
    jsonError.value = 'JSON格式化失败，请检查输入的JSON格式'
    console.warn('JSON格式化失败:', error)
  }
}

// 生成默认的数据路径映射 - 基于组件定义的mappingKeys
const generateDefaultMappings = () => {
  if (!config.value.data || Object.keys(config.value.data).length === 0) return
  
  console.log('🔧 StaticDataSourceConfig - 开始生成映射:', {
    data: config.value.data,
    dataPaths: config.value.dataPaths
  })
  
  // 获取可用的数据路径
  const availablePaths = dataPathResolver.getAvailablePaths(config.value.data)
  console.log('🔧 StaticDataSourceConfig - 可用路径:', availablePaths)
  
  // 为每个映射生成映射，优先匹配同名路径
  config.value.dataPaths = config.value.dataPaths.map(mapping => {
    const targetKey = mapping.target
    console.log('🔧 StaticDataSourceConfig - 处理映射:', { targetKey, currentKey: mapping.key })
    
    // 1. 优先选择与target完全同名的JSON路径
    const exactMatch = availablePaths.find(path => {
      const pathKey = path.split('.').pop() || path
      return pathKey === targetKey
    })
    
    if (exactMatch) {
      console.log('🔧 StaticDataSourceConfig - 找到精确匹配:', exactMatch)
      return { ...mapping, key: exactMatch }
    }
    
    // 2. 如果没有精确匹配，查找包含targetKey的路径
    const partialMatch = availablePaths.find(path => {
      return path.includes(targetKey)
    })
    
    if (partialMatch) {
      console.log('🔧 StaticDataSourceConfig - 找到部分匹配:', partialMatch)
      return { ...mapping, key: partialMatch }
    }
    
    // 3. 如果都没有找到，保持原来的key或设为空
    console.log('🔧 StaticDataSourceConfig - 未找到匹配，保持原值')
    return mapping
  })
  
  console.log('🔧 StaticDataSourceConfig - 最终映射:', config.value.dataPaths)
  updateConfig()
}

// 删除添加和删除映射的方法，因为映射数量由组件定义决定
// const addDataPath = () => { ... }
// const removeDataPath = () => { ... }

// 更新配置
const updateConfig = () => {
  emit('update:modelValue', { ...config.value })
  console.log('🔧 StaticDataSourceConfig - 配置更新:', config.value)
}

// 监听外部变化
watch(() => props.modelValue, (newValue) => {
  config.value = { ...config.value, ...newValue }
  jsonString.value = JSON.stringify(config.value.data, null, 2)
  
  // 如果外部传入了dataPaths，使用外部的映射
  if (newValue?.dataPaths && newValue.dataPaths.length > 0) {
    config.value.dataPaths = newValue.dataPaths
  }
  
  // 如果有数据，自动生成映射
  if (config.value.data && Object.keys(config.value.data).length > 0) {
    generateDefaultMappings()
  }
}, { deep: true })

onMounted(() => {
  // 如果没有数据，提供默认示例
  if (!config.value.data || Object.keys(config.value.data).length === 0) {
    const defaultJson = {
      "sensors": {
        "temperature": 25.5,
        "humidity": 65.2,
        "pressure": 1013.25
      },
      "device": {
        "status": "运行中",
        "mode": "自动"
      },
      "timestamp": "2024-01-01T12:00:00Z"
    }
    
    config.value.data = defaultJson
    jsonString.value = JSON.stringify(defaultJson, null, 2)
    
    // 自动生成映射
    generateDefaultMappings()
    
    updateConfig()
  } else {
    jsonString.value = JSON.stringify(config.value.data, null, 2)
    // 如果有数据，也自动生成映射
    generateDefaultMappings()
  }
  
  // 确保示例数据始终显示
  if (!jsonString.value) {
    loadExampleData()
  }
})
</script>

<style scoped>
.static-data-source-config {
  padding: 8px;
}

.json-editor-container {
  position: relative;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  width: 100%;
  min-width: 400px;
}

.json-editor-container :deep(.cm-editor) {
  height: 300px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  width: 100%;
}

.json-editor-container :deep(.cm-editor .cm-scroller) {
  overflow: auto;
  min-width: 400px;
}

.json-editor-container :deep(.cm-content) {
  min-width: 400px;
  white-space: pre;
}

.json-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  display: flex;
  gap: 4px;
}

.json-actions .n-button {
  font-size: 11px;
  padding: 2px 6px;
  height: 24px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #d9d9d9;
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

.json-preview {
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 11px;
  max-height: 120px;
  overflow: auto;
  white-space: pre-wrap;
  min-width: 400px;
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