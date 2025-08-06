<template>
  <div class="static-data-source-config">
    <n-form :model="config" label-placement="top" size="small">
      <n-form-item label="JSON数据">
        <div class="json-editor-container">
          <CodemirrorEditor v-model:value="jsonString" :options="editorOptions" @update:modelValue="updateJsonData" />
          <div class="json-actions">
            <n-button size="tiny" @click="loadExampleData">示例</n-button>
            <n-button size="tiny" @click="formatJson">格式化</n-button>
          </div>
        </div>
      </n-form-item>

      <!-- 使用通用的数据映射组件 -->
      <DataMappingConfig :data="config.data" :mappings="config.dataPaths || []" @update:mappings="updateDataPaths" />

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
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue'
import { NForm, NFormItem, NButton, NDivider, NTabs, NTabPane, NEmpty } from 'naive-ui'
import CodemirrorEditor from 'codemirror-editor-vue3'
import DataMappingConfig from './DataMappingConfig.vue'
import type { StaticDataSource, DataPathMapping } from '@/components/visual-editor/types/data-source'
import { dataPathResolver } from '@/components/visual-editor/utils/data-path-resolver'
import { DataSourceType } from '@/components/visual-editor/types/data-source'

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

// 更新数据路径映射
const updateDataPaths = (mappings: DataPathMapping[]) => {
  config.value.dataPaths = mappings
  updateConfig()
}

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
    sensors: {
      temperature: 25.5,
      humidity: 65.2,
      pressure: 1013.25
    },
    device: {
      status: '运行中',
      mode: '自动'
    },
    timestamp: '2024-01-01T12:00:00Z'
  }

  // 直接设置JSON字符串
  jsonString.value = JSON.stringify(exampleJson, null, 2)

  // 更新配置
  config.value.data = exampleJson
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

// 防抖更新配置
let updateConfigTimer: NodeJS.Timeout | null = null
const updateConfig = () => {
  // 清除之前的定时器
  if (updateConfigTimer) {
    clearTimeout(updateConfigTimer)
  }

  // 设置新的定时器，防抖100ms
  updateConfigTimer = setTimeout(() => {
    emit('update:modelValue', { ...config.value })
    console.log('🔧 StaticDataSourceConfig - 配置更新:', config.value)
  }, 100)
}

// 监听外部变化
watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    // 防止递归更新：只有当值真正不同时才更新
    if (JSON.stringify(newValue) === JSON.stringify(oldValue)) {
      return
    }

    // 使用nextTick来避免同步更新导致的递归
    nextTick(() => {
      config.value = { ...config.value, ...newValue }
      jsonString.value = JSON.stringify(config.value.data, null, 2)

      // 如果外部传入了dataPaths，使用外部的映射
      if (newValue?.dataPaths && newValue.dataPaths.length > 0) {
        config.value.dataPaths = newValue.dataPaths
      }
    })
  },
  { deep: true }
)

onMounted(() => {
  // 如果没有数据，提供默认示例
  if (!config.value.data || Object.keys(config.value.data).length === 0) {
    const defaultJson = {
      sensors: {
        temperature: 25.5,
        humidity: 65.2,
        pressure: 1013.25
      },
      device: {
        status: '运行中',
        mode: '自动'
      },
      timestamp: '2024-01-01T12:00:00Z'
    }

    config.value.data = defaultJson
    jsonString.value = JSON.stringify(defaultJson, null, 2)
    updateConfig()
  } else {
    jsonString.value = JSON.stringify(config.value.data, null, 2)
  }

  // 确保示例数据始终显示
  if (!jsonString.value) {
    loadExampleData()
  }
})

onUnmounted(() => {
  if (updateConfigTimer) {
    clearTimeout(updateConfigTimer)
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
