<template>
  <div class="data-mapping-test">
    <n-card title="数据映射功能测试" size="small">
      <n-space vertical>
        <!-- 测试数据源配置 -->
        <n-card title="测试数据源" size="small">
          <n-space vertical>
            <n-button @click="generateTestData">生成测试数据</n-button>
            <n-card v-if="testData" size="small">
              <pre>{{ JSON.stringify(testData, null, 2) }}</pre>
            </n-card>
          </n-space>
        </n-card>

        <!-- 数据映射配置 -->
        <n-card title="数据映射配置" size="small">
          <DataMappingConfig
            :data="testData"
            :mappings="testMappings"
            :component-fields="componentFields"
            @update:mappings="updateTestMappings"
          />
        </n-card>

        <!-- 映射结果预览 -->
        <n-card title="映射结果预览" size="small">
          <n-space vertical>
            <n-tag :type="mappingStatus.type" size="small">{{ mappingStatus.text }}</n-tag>
            <n-card v-if="mappedResult && Object.keys(mappedResult).length > 0" size="small">
              <pre>{{ JSON.stringify(mappedResult, null, 2) }}</pre>
            </n-card>
          </n-space>
        </n-card>

        <!-- 组件模拟 -->
        <n-card title="组件模拟显示" size="small">
          <div class="component-simulation">
            <div class="simulated-component">
              <div class="value-display">
                <span class="value">{{ displayValue }}</span>
                <span class="unit">{{ displayUnit }}</span>
              </div>
              <div class="title-display">{{ displayTitle }}</div>
            </div>
          </div>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NCard, NButton, NSpace, NTag } from 'naive-ui'
import DataMappingConfig from '../settings/data-sources/DataMappingConfig.vue'
import type { DataPathMapping } from '../types/data-source'

// 测试数据
const testData = ref<any>(null)
const testMappings = ref<DataPathMapping[]>([])

// 组件字段定义
const componentFields = ref([
  {
    name: 'value',
    type: 'number' as const,
    required: true,
    description: '主要数值',
    defaultValue: 0
  },
  {
    name: 'unit',
    type: 'string' as const,
    required: false,
    description: '单位',
    defaultValue: ''
  },
  {
    name: 'title',
    type: 'string' as const,
    required: false,
    description: '标题',
    defaultValue: '数值'
  }
])

// 生成测试数据
const generateTestData = () => {
  testData.value = {
    telemetry: {
      latest: {
        value: 25.5,
        timestamp: new Date().toISOString(),
        quality: 'good',
        unit: '°C'
      }
    },
    device: {
      name: '温度传感器001',
      type: 'temperature_sensor',
      location: '实验室A'
    },
    status: {
      online: true,
      battery: 85,
      signal: 'strong'
    }
  }
}

// 更新映射
const updateTestMappings = (mappings: DataPathMapping[]) => {
  testMappings.value = mappings
  console.log('🔧 DataMappingTest - 映射更新:', mappings)
}

// 映射结果
const mappedResult = computed(() => {
  if (!testData.value || testMappings.value.length === 0) {
    return {}
  }
  
  const result: Record<string, any> = {}
  
  testMappings.value.forEach(mapping => {
    if (mapping.key && mapping.target) {
      const value = getNestedValue(testData.value, mapping.key)
      result[mapping.target] = value
    }
  })
  
  return result
})

// 映射状态
const mappingStatus = computed(() => {
  const requiredFields = componentFields.value.filter(field => field.required)
  const mappedRequiredFields = requiredFields.filter(field => 
    testMappings.value.some(mapping => mapping.target === field.name)
  )
  
  if (mappedRequiredFields.length === requiredFields.length) {
    return { type: 'success' as const, text: '映射完整' }
  } else if (mappedRequiredFields.length > 0) {
    return { type: 'warning' as const, text: '部分映射' }
  } else {
    return { type: 'error' as const, text: '缺少必需映射' }
  }
})

// 组件显示值
const displayValue = computed(() => {
  return mappedResult.value.value || 0
})

const displayUnit = computed(() => {
  return mappedResult.value.unit || ''
})

const displayTitle = computed(() => {
  return mappedResult.value.title || '数值'
})

// 获取嵌套值
const getNestedValue = (obj: any, path: string): any => {
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined
    }
    
    // 处理数组索引
    if (key.includes('[') && key.includes(']')) {
      const arrayKey = key.substring(0, key.indexOf('['))
      const indexMatch = key.match(/\[(\d+)\]/)
      if (indexMatch) {
        const index = parseInt(indexMatch[1])
        current = current[arrayKey]?.[index]
      }
    } else {
      current = current[key]
    }
  }
  
  return current
}

// 初始化
generateTestData()
</script>

<style scoped>
.data-mapping-test {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.component-simulation {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: #f5f5f5;
  border-radius: 8px;
}

.simulated-component {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.value-display {
  margin-bottom: 12px;
}

.value {
  font-size: 2em;
  font-weight: bold;
  color: #1890ff;
}

.unit {
  font-size: 1em;
  color: #666;
  margin-left: 8px;
}

.title-display {
  font-size: 1em;
  color: #333;
}
</style> 