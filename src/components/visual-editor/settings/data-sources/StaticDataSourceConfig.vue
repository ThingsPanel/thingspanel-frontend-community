<template>
  <div class="static-data-source-config">
    <n-form :model="config" label-placement="left" label-width="auto">
      <n-form-item label="数据源名称">
        <n-input
          v-model:value="config.name"
          placeholder="请输入数据源名称"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="描述">
        <n-input
          v-model:value="config.description"
          placeholder="请输入描述"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="JSON数据">
        <n-input
          v-model:value="jsonString"
          type="textarea"
          placeholder="请输入JSON数据"
          :rows="6"
          @update:value="updateJsonData"
        />
      </n-form-item>
      
      <n-form-item label="刷新间隔(秒)">
        <n-input-number
          v-model:value="config.refreshInterval"
          :min="0"
          placeholder="0表示不自动刷新"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <!-- 多Key配置 -->
      <n-divider title-placement="left">数据路径映射</n-divider>
      
      <div class="data-paths-container">
        <div v-for="(mapping, index) in config.dataPaths" :key="index" class="data-path-item">
          <n-card size="small" :title="`映射 ${index + 1}`">
            <n-form-item label="数据路径">
              <n-input
                v-model:value="mapping.key"
                placeholder="如: data.temperature 或 data[0].value"
                @update:value="updateConfig"
              />
            </n-form-item>
            
            <n-form-item label="目标数据源名称">
              <n-input
                v-model:value="mapping.target"
                placeholder="如: temperature"
                @update:value="updateConfig"
              />
            </n-form-item>
            
            <n-form-item label="描述">
              <n-input
                v-model:value="mapping.description"
                placeholder="可选描述"
                @update:value="updateConfig"
              />
            </n-form-item>
            
            <n-button
              type="error"
              size="small"
              @click="removeDataPath(index)"
            >
              删除映射
            </n-button>
          </n-card>
        </div>
        
        <n-button
          type="primary"
          size="small"
          @click="addDataPath"
        >
          添加数据路径映射
        </n-button>
      </div>
      
      <!-- 数据预览 -->
      <n-divider title-placement="left">数据预览</n-divider>
      
      <div class="preview-container">
        <n-tabs type="line">
          <n-tab-pane name="raw" tab="原始数据">
            <pre class="json-preview">{{ formattedJson }}</pre>
          </n-tab-pane>
          
          <n-tab-pane name="resolved" tab="解析结果">
            <div v-if="resolvedData.length > 0">
              <div v-for="item in resolvedData" :key="item.path" class="resolved-item">
                <span class="path">{{ item.path }}</span>
                <span class="value">{{ item.value }}</span>
              </div>
            </div>
            <n-empty v-else description="暂无解析结果" />
          </n-tab-pane>
        </n-tabs>
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, NButton, NDivider, NCard, NTabs, NTabPane, NEmpty } from 'naive-ui'
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

const config = ref<StaticDataSource>({
  type: 'static',
  enabled: true,
  name: '静态数据源',
  description: '',
  data: {},
  dataPaths: [],
  ...props.modelValue
})

const jsonString = ref('')

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
  } catch (error) {
    console.warn('JSON解析错误:', error)
  }
}

// 添加数据路径映射
const addDataPath = () => {
  if (!config.value.dataPaths) {
    config.value.dataPaths = []
  }
  config.value.dataPaths.push({
    key: '',
    target: '',
    description: ''
  })
  updateConfig()
}

// 删除数据路径映射
const removeDataPath = (index: number) => {
  if (config.value.dataPaths) {
    config.value.dataPaths.splice(index, 1)
    updateConfig()
  }
}

// 更新配置
const updateConfig = () => {
  emit('update:modelValue', { ...config.value })
  console.log('🔧 StaticDataSourceConfig - 配置更新:', config.value)
}

// 监听外部变化
watch(() => props.modelValue, (newValue) => {
  config.value = { ...config.value, ...newValue }
  jsonString.value = JSON.stringify(config.value.data, null, 2)
}, { deep: true })

onMounted(() => {
  jsonString.value = JSON.stringify(config.value.data, null, 2)
})
</script>

<style scoped>
.static-data-source-config {
  padding: 16px;
}

.data-paths-container {
  margin-bottom: 16px;
}

.data-path-item {
  margin-bottom: 12px;
}

.preview-container {
  margin-top: 16px;
}

.json-preview {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
}

.resolved-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 4px;
  font-family: monospace;
  font-size: 12px;
}

.path {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>