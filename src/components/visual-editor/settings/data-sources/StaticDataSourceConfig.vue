<template>
  <div class="static-data-source-config">
    <n-form label-placement="left" label-width="auto" size="small">
      <n-form-item label="数据源名称">
        <n-input 
          v-model:value="config.name" 
          placeholder="静态数据源"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="描述">
        <n-input 
          v-model:value="config.description" 
          placeholder="数据源描述"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="JSON数据">
        <n-input 
          v-model:value="jsonString" 
          type="textarea"
          placeholder='{"data": {"value": 45, "value2": 87, "key": "shuju"}}'
          :rows="6"
          @update:value="updateJsonData"
        />
      </n-form-item>
      
      <n-form-item label="数据路径">
        <n-select
          v-model:value="config.dataPath"
          :options="availablePaths"
          placeholder="选择数据路径"
          filterable
          @update:value="updateConfig"
        />
        <template #suffix>
          <n-button size="small" @click="refreshPaths">刷新</n-button>
        </template>
      </n-form-item>
      
      <n-form-item label="刷新间隔">
        <n-input-number 
          v-model:value="config.refreshInterval" 
          :min="0"
          :max="3600000"
          placeholder="0表示不自动刷新"
          @update:value="updateConfig"
        />
        <template #suffix>
          <span style="margin-left: 8px; color: #999;">毫秒</span>
        </template>
      </n-form-item>
      
      <n-form-item label="数据预览">
        <div class="data-preview">
          <div class="preview-item">
            <strong>原始数据:</strong>
            <pre>{{ JSON.stringify(config.data, null, 2) }}</pre>
          </div>
          <div class="preview-item">
            <strong>解析结果:</strong>
            <pre>{{ JSON.stringify(resolvedValue, null, 2) }}</pre>
          </div>
        </div>
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, NSelect, NButton } from 'naive-ui'
import type { StaticDataSource } from '../../types/data-source'
import { dataPathResolver } from '../../utils/data-path-resolver'

interface Props {
  modelValue: StaticDataSource
}

interface Emits {
  'update:modelValue': [value: StaticDataSource]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const config = ref<StaticDataSource>({ ...props.modelValue })
const jsonString = ref('')

// 可用的数据路径
const availablePaths = computed(() => {
  const paths = dataPathResolver.getAvailablePaths(config.value.data)
  return paths.map(path => ({
    label: dataPathResolver.formatPath(path),
    value: path
  }))
})

// 解析后的值
const resolvedValue = computed(() => {
  return dataPathResolver.resolve(config.value.data, config.value.dataPath)
})

// 初始化JSON字符串
const initJsonString = () => {
  try {
    jsonString.value = JSON.stringify(config.value.data || {}, null, 2)
  } catch (error) {
    jsonString.value = '{}'
  }
}

// 更新JSON数据
const updateJsonData = (value: string) => {
  try {
    const parsed = JSON.parse(value)
    config.value.data = parsed
    updateConfig()
  } catch (error) {
    // JSON格式错误时不更新
    console.warn('JSON格式错误:', error)
  }
}

// 刷新路径
const refreshPaths = () => {
  // 触发重新计算
  updateConfig()
}

// 更新配置
const updateConfig = () => {
  // 确保数据路径变化时能触发重新订阅
  const newConfig = { ...config.value }
  emit('update:modelValue', newConfig)
  
  // 触发父组件的重新订阅
  console.log('🔧 StaticDataSourceConfig - 配置更新:', {
    dataPath: newConfig.dataPath,
    resolvedValue: resolvedValue.value
  })
}

// 监听外部变化
watch(() => props.modelValue, (newValue) => {
  config.value = { ...newValue }
  initJsonString()
}, { deep: true })

// 初始化
initJsonString()
</script>

<style scoped>
.static-data-source-config {
  padding: 8px 0;
}

.data-preview {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  background-color: #f9f9f9;
}

.preview-item {
  margin-bottom: 8px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-item strong {
  display: block;
  margin-bottom: 4px;
  color: #666;
  font-size: 12px;
}

.preview-item pre {
  margin: 0;
  font-size: 11px;
  color: #333;
  background-color: #fff;
  padding: 4px;
  border-radius: 2px;
  max-height: 100px;
  overflow-y: auto;
}
</style> 