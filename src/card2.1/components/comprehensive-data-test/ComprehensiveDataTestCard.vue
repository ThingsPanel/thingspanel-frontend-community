<template>
  <div class="comprehensive-data-test-card">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="header-title">
        <i class="i-carbon-data-connected" />
        <span>综合数据测试组件</span>
      </div>
      <div class="header-status">
        <n-tag size="small" :type="bindingStatus.type">
          {{ bindingStatus.text }}
        </n-tag>
      </div>
    </div>

    <!-- 数据需求声明展示 -->
    <div class="data-requirements-section">
      <n-collapse>
        <n-collapse-item title="数据需求声明" name="requirements">
          <div class="requirements-display">
            <div class="requirement-category">
              <h4>基础数据字段:</h4>
              <div class="field-list">
                <div v-for="(field, name) in componentRequirement.fields" :key="name" class="field-item">
                  <span class="field-name">{{ name }}</span>
                  <n-tag size="small" :type="field.required ? 'error' : 'info'">
                    {{ field.type }}
                  </n-tag>
                  <span class="field-desc">{{ field.description }}</span>
                </div>
              </div>
            </div>

            <div v-if="componentRequirement.relationships" class="requirement-category">
              <h4>数据关系:</h4>
              <div class="relationship-list">
                <div v-for="(rel, name) in componentRequirement.relationships" :key="name" class="relationship-item">
                  <span class="relationship-name">{{ name }}</span>
                  <n-tag size="small" type="success">{{ rel.type }}</n-tag>
                  <span class="relationship-inputs">依赖: {{ rel.inputs.join(', ') }}</span>
                </div>
              </div>
            </div>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>

    <!-- 实时数据显示 -->
    <div class="live-data-section">
      <div class="section-title">
        <span>实时数据</span>
        <div class="data-stats">
          <n-tag size="small" type="info">更新: {{ updateCount }}</n-tag>
          <n-tag v-if="lastUpdateTime" size="small" type="success">
            {{ formatTime(lastUpdateTime) }}
          </n-tag>
        </div>
      </div>

      <!-- 基础数据字段展示 -->
      <div class="data-display-grid">
        <!-- 单值数据 -->
        <div class="data-card value-card">
          <div class="data-label">温度值</div>
          <div class="data-value">{{ currentData.temperature || '--' }}°C</div>
          <div class="data-meta">{{ getFieldType('temperature') }}</div>
        </div>

        <div class="data-card value-card">
          <div class="data-label">湿度值</div>
          <div class="data-value">{{ currentData.humidity || '--' }}%</div>
          <div class="data-meta">{{ getFieldType('humidity') }}</div>
        </div>

        <div class="data-card value-card">
          <div class="data-label">在线状态</div>
          <div class="data-value">
            <n-tag :type="currentData.isOnline ? 'success' : 'error'" size="small">
              {{ currentData.isOnline ? '在线' : '离线' }}
            </n-tag>
          </div>
          <div class="data-meta">{{ getFieldType('isOnline') }}</div>
        </div>

        <!-- 对象数据 -->
        <div class="data-card object-card">
          <div class="data-label">传感器信息</div>
          <div class="data-value">
            <div v-if="currentData.sensorInfo" class="object-content">
              <div class="object-field">
                <span class="field-key">ID:</span>
                <span class="field-value">{{ currentData.sensorInfo.id || '--' }}</span>
              </div>
              <div class="object-field">
                <span class="field-key">名称:</span>
                <span class="field-value">{{ currentData.sensorInfo.name || '--' }}</span>
              </div>
              <div class="object-field">
                <span class="field-key">位置:</span>
                <span class="field-value">{{ currentData.sensorInfo.location || '--' }}</span>
              </div>
            </div>
            <div v-else class="no-data">无数据</div>
          </div>
          <div class="data-meta">{{ getFieldType('sensorInfo') }}</div>
        </div>

        <!-- 数组数据 -->
        <div class="data-card array-card">
          <div class="data-label">历史读数</div>
          <div class="data-value">
            <div v-if="currentData.readings && currentData.readings.length > 0" class="array-content">
              <div class="array-summary">共 {{ currentData.readings.length }} 条记录</div>
              <div class="array-items">
                <div v-for="(reading, index) in currentData.readings.slice(0, 3)" :key="index" class="array-item">
                  <span class="item-time">{{ reading.time }}</span>
                  <span class="item-value">{{ reading.value }}</span>
                </div>
                <div v-if="currentData.readings.length > 3" class="array-more">
                  ...还有 {{ currentData.readings.length - 3 }} 条
                </div>
              </div>
            </div>
            <div v-else class="no-data">无数据</div>
          </div>
          <div class="data-meta">{{ getFieldType('readings') }}</div>
        </div>
      </div>

      <!-- 关系计算结果 -->
      <div v-if="calculatedData && Object.keys(calculatedData).length > 0" class="calculated-data-section">
        <div class="section-subtitle">计算字段</div>
        <div class="calculated-grid">
          <div v-for="(value, name) in calculatedData" :key="name" class="calculated-item">
            <span class="calculated-name">{{ name }}</span>
            <span class="calculated-value">{{ formatCalculatedValue(value) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据源配置和控制 -->
    <div class="control-section">
      <div class="control-header">
        <span>数据源控制</span>
        <n-space size="small">
          <n-button
            size="small"
            type="primary"
            :disabled="isBindingActive"
            :loading="isStarting"
            @click="startDataBinding"
          >
            <template #icon>
              <i class="i-carbon-play" />
            </template>
            启动绑定
          </n-button>
          <n-button size="small" type="error" :disabled="!isBindingActive" @click="stopDataBinding">
            <template #icon>
              <i class="i-carbon-stop" />
            </template>
            停止绑定
          </n-button>
          <n-button size="small" :disabled="!isBindingActive" :loading="isRefreshing" @click="refreshData">
            <template #icon>
              <i class="i-carbon-renew" />
            </template>
            手动刷新
          </n-button>
        </n-space>
      </div>

      <!-- 数据源选择 -->
      <div class="data-source-selector">
        <div class="selector-label">数据源类型:</div>
        <n-radio-group v-model:value="selectedDataSource" @update:value="onDataSourceChange">
          <n-space>
            <n-radio value="static">静态数据</n-radio>
            <n-radio value="dynamic">动态脚本</n-radio>
            <n-radio value="timer">定时更新</n-radio>
          </n-space>
        </n-radio-group>
      </div>

      <!-- 更新间隔设置（仅定时更新模式） -->
      <div v-if="selectedDataSource === 'timer'" class="timer-config">
        <div class="config-label">更新间隔:</div>
        <n-input-number
          v-model:value="updateInterval"
          :min="1000"
          :max="60000"
          :step="1000"
          size="small"
          style="width: 120px"
        />
        <span class="config-unit">毫秒</span>
      </div>
    </div>

    <!-- 系统状态信息 -->
    <div class="status-section">
      <n-collapse>
        <n-collapse-item title="系统状态" name="status">
          <div class="status-grid">
            <div class="status-item">
              <div class="status-label">数据管道</div>
              <div class="status-value">{{ pipelineStats.isValid ? '正常' : '异常' }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">执行次数</div>
              <div class="status-value">{{ pipelineStats.executionCount }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">处理器数量</div>
              <div class="status-value">{{ pipelineStats.processorCount }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">映射规则</div>
              <div class="status-value">{{ pipelineStats.mappingRulesCount }}</div>
            </div>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>

    <!-- 错误信息显示 -->
    <div v-if="errorMessage" class="error-section">
      <n-alert type="error" closable @close="clearError">
        <template #header>数据绑定错误</template>
        {{ errorMessage }}
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { NTag, NButton, NSpace, NCollapse, NCollapseItem, NRadioGroup, NRadio, NInputNumber, NAlert } from 'naive-ui'

defineOptions({
  name: 'ComprehensiveDataTestCard'
})

// ========== 组件数据需求声明 ==========

const componentRequirement = {
  fields: {
    // 基础值类型
    temperature: {
      type: 'value',
      valueType: 'number',
      required: true,
      description: '环境温度，单位摄氏度',
      defaultValue: 0,
      example: 25.6
    },
    humidity: {
      type: 'value',
      valueType: 'number',
      required: true,
      description: '环境湿度，百分比',
      defaultValue: 0,
      example: 68.2
    },
    isOnline: {
      type: 'value',
      valueType: 'boolean',
      required: false,
      description: '设备在线状态',
      defaultValue: false,
      example: true
    },

    // 对象类型
    sensorInfo: {
      type: 'object',
      required: false,
      description: '传感器基本信息',
      structure: {
        fields: {
          id: {
            type: 'value',
            valueType: 'string',
            required: true,
            description: '传感器ID'
          },
          name: {
            type: 'value',
            valueType: 'string',
            required: true,
            description: '传感器名称'
          },
          location: {
            type: 'value',
            valueType: 'string',
            required: false,
            description: '传感器位置'
          }
        }
      }
    },

    // 数组类型
    readings: {
      type: 'array',
      required: false,
      description: '历史读数数组',
      structure: {
        fields: {
          time: {
            type: 'value',
            valueType: 'string',
            required: true,
            description: '读数时间'
          },
          value: {
            type: 'value',
            valueType: 'number',
            required: true,
            description: '读数值'
          }
        }
      }
    }
  },

  // 数据关系定义
  relationships: {
    // 独立字段
    temperatureDisplay: {
      type: 'independent',
      inputs: ['temperature'],
      description: '温度显示值'
    },

    // 计算字段
    comfortIndex: {
      type: 'calculated',
      inputs: ['temperature', 'humidity'],
      calculator: (inputs: any) => {
        const temp = inputs.temperature || 0
        const hum = inputs.humidity || 0
        // 简单的舒适度计算
        if (temp >= 20 && temp <= 26 && hum >= 40 && hum <= 70) {
          return '舒适'
        } else if (temp >= 18 && temp <= 28 && hum >= 30 && hum <= 80) {
          return '一般'
        } else {
          return '不适'
        }
      },
      description: '基于温湿度计算的舒适度指数',
      realtime: true
    },

    // 派生字段
    sensorStatus: {
      type: 'derived',
      inputs: ['isOnline'],
      description: '传感器状态描述'
    }
  },

  version: '1.0.0',
  description: '综合数据测试组件的完整数据需求定义'
}

// ========== 响应式数据 ==========

const currentData = reactive<any>({})
const calculatedData = reactive<any>({})
const updateCount = ref(0)
const lastUpdateTime = ref<Date | null>(null)
const isBindingActive = ref(false)
const isStarting = ref(false)
const isRefreshing = ref(false)
const selectedDataSource = ref<'static' | 'dynamic' | 'timer'>('static')
const updateInterval = ref(5000)
const errorMessage = ref('')

// 管道统计信息
const pipelineStats = reactive({
  isValid: false,
  executionCount: 0,
  processorCount: 0,
  mappingRulesCount: 0
})

// 模拟定时器
let dataUpdateTimer: NodeJS.Timeout | null = null

// ========== 计算属性 ==========

const bindingStatus = computed(() => {
  if (errorMessage.value) {
    return { type: 'error', text: '绑定错误' }
  } else if (isBindingActive.value) {
    return { type: 'success', text: '绑定活跃' }
  } else {
    return { type: 'info', text: '未绑定' }
  }
})

// ========== 方法 ==========

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString()
}

const getFieldType = (fieldName: string): string => {
  const field = componentRequirement.fields[fieldName]
  if (!field) return 'unknown'

  if (field.type === 'value') {
    return field.valueType || 'any'
  }
  return field.type
}

const formatCalculatedValue = (value: any): string => {
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

// 生成模拟数据
const generateMockData = () => {
  switch (selectedDataSource.value) {
    case 'static':
      return {
        temperature: 25.6,
        humidity: 68.2,
        isOnline: true,
        sensorInfo: {
          id: 'sensor-001',
          name: '环境传感器',
          location: '机房A区'
        },
        readings: [
          { time: '14:00', value: 24.5 },
          { time: '14:30', value: 25.1 },
          { time: '15:00', value: 25.6 }
        ]
      }

    case 'dynamic': {
      return {
        temperature: Math.round((Math.random() * 20 + 15) * 10) / 10,
        humidity: Math.round((Math.random() * 40 + 40) * 10) / 10,
        isOnline: Math.random() > 0.2,
        sensorInfo: {
          id: `sensor-${Math.floor(Math.random() * 100)
            .toString()
            .padStart(3, '0')}`,
          name: '动态传感器',
          location: ['机房A区', '机房B区', '机房C区'][Math.floor(Math.random() * 3)]
        },
        readings: Array.from({ length: Math.floor(Math.random() * 5) + 3 }, (_, i) => {
          const now = new Date()
          const time = new Date(now.getTime() - (4 - i) * 15 * 60 * 1000)
          return {
            time: time.toLocaleTimeString(),
            value: Math.round((Math.random() * 20 + 15) * 10) / 10
          }
        })
      }
    }
    case 'timer': {
      const now = new Date()
      return {
        temperature: Math.round((20 + Math.sin(now.getTime() / 60000) * 10 + Math.random() * 2) * 10) / 10,
        humidity: Math.round((50 + Math.cos(now.getTime() / 45000) * 20 + Math.random() * 5) * 10) / 10,
        isOnline: Math.random() > 0.1,
        sensorInfo: {
          id: 'timer-sensor-001',
          name: '定时更新传感器',
          location: '测试区域'
        },
        readings: Array.from({ length: 6 }, (_, i) => {
          const time = new Date(now.getTime() - (5 - i) * 10 * 60 * 1000)
          return {
            time: time.toLocaleTimeString(),
            value: Math.round((20 + Math.sin(time.getTime() / 30000) * 8 + Math.random() * 3) * 10) / 10
          }
        })
      }
    }
    default:
      return {}
  }
}

// 启动数据绑定
const startDataBinding = async () => {
  if (isBindingActive.value) return

  isStarting.value = true
  errorMessage.value = ''

  try {
    console.log(`🚀 [ComprehensiveDataTestCard] 启动数据绑定...`)

    // 模拟数据绑定启动
    await new Promise(resolve => setTimeout(resolve, 500))

    // 更新管道统计信息
    pipelineStats.isValid = true
    pipelineStats.processorCount = 2
    pipelineStats.mappingRulesCount = 5

    isBindingActive.value = true

    // 立即更新一次数据
    updateData()

    // 如果是定时更新模式，启动定时器
    if (selectedDataSource.value === 'timer') {
      dataUpdateTimer = setInterval(updateData, updateInterval.value)
    }

    console.log(`✅ [ComprehensiveDataTestCard] 数据绑定启动成功`)
  } catch (error) {
    console.error(`❌ [ComprehensiveDataTestCard] 数据绑定启动失败:`, error)
    errorMessage.value = error instanceof Error ? error.message : '启动失败'
  } finally {
    isStarting.value = false
  }
}

// 停止数据绑定
const stopDataBinding = () => {
  if (!isBindingActive.value) return

  console.log(`🛑 [ComprehensiveDataTestCard] 停止数据绑定...`)

  if (dataUpdateTimer) {
    clearInterval(dataUpdateTimer)
    dataUpdateTimer = null
  }

  isBindingActive.value = false

  console.log(`✅ [ComprehensiveDataTestCard] 数据绑定已停止`)
}

// 手动刷新数据
const refreshData = async () => {
  if (!isBindingActive.value) return

  isRefreshing.value = true

  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    updateData()
  } catch (error) {
    console.error('手动刷新数据失败:', error)
    errorMessage.value = error instanceof Error ? error.message : '刷新失败'
  } finally {
    isRefreshing.value = false
  }
}

// 更新数据
const updateData = () => {
  try {
    const newData = generateMockData()

    // 更新基础数据
    Object.assign(currentData, newData)

    // 计算关系字段
    if (componentRequirement.relationships) {
      Object.entries(componentRequirement.relationships).forEach(([relationName, relation]) => {
        try {
          if (relation.type === 'calculated' && relation.calculator) {
            const inputs: any = {}
            relation.inputs.forEach((inputField: string) => {
              inputs[inputField] = newData[inputField]
            })
            calculatedData[relationName] = relation.calculator(inputs)
          } else if (relation.type === 'independent') {
            calculatedData[relationName] = newData[relation.inputs[0]]
          } else if (relation.type === 'derived') {
            calculatedData[relationName] = newData[relation.inputs[0]]
          }
        } catch (error) {
          console.warn(`计算关系字段失败: ${relationName}`, error)
        }
      })
    }

    // 更新统计信息
    updateCount.value++
    lastUpdateTime.value = new Date()
    pipelineStats.executionCount++
  } catch (error) {
    console.error('数据更新失败:', error)
    errorMessage.value = error instanceof Error ? error.message : '数据更新失败'
  }
}

// 数据源类型变化
const onDataSourceChange = () => {
  if (isBindingActive.value) {
    stopDataBinding()
  }
}

// 清除错误
const clearError = () => {
  errorMessage.value = ''
}

// ========== 生命周期 ==========

onMounted(() => {
  console.log(`🧪 [ComprehensiveDataTestCard] 综合数据测试组件已加载`)
  console.log(`📋 组件数据需求:`, componentRequirement)
})

onUnmounted(() => {
  if (isBindingActive.value) {
    stopDataBinding()
  }
})
</script>

<style scoped>
.comprehensive-data-test-card {
  padding: 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 800px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-title i {
  font-size: 20px;
  color: #007bff;
}

/* 数据需求声明 */
.data-requirements-section {
  margin-bottom: 24px;
}

.requirements-display {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.requirement-category {
  margin-bottom: 16px;
}

.requirement-category h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.field-list,
.relationship-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-item,
.relationship-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #dee2e6;
}

.field-name,
.relationship-name {
  font-weight: 500;
  color: #333;
  min-width: 100px;
}

.field-desc,
.relationship-inputs {
  font-size: 12px;
  color: #666;
}

/* 实时数据显示 */
.live-data-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.data-stats {
  display: flex;
  gap: 8px;
}

.data-display-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.data-card {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  background: #f8f9fa;
}

.value-card {
  background: linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%);
}

.object-card {
  background: linear-gradient(135deg, #f3e5f5 0%, #f8f9fa 100%);
}

.array-card {
  background: linear-gradient(135deg, #e8f5e8 0%, #f8f9fa 100%);
}

.data-label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.data-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.data-meta {
  font-size: 10px;
  color: #999;
  font-style: italic;
}

.object-content {
  font-size: 14px;
}

.object-field {
  display: flex;
  margin-bottom: 4px;
}

.field-key {
  font-weight: 500;
  color: #666;
  min-width: 40px;
}

.field-value {
  color: #333;
}

.array-content {
  font-size: 14px;
}

.array-summary {
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.array-item {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  border-bottom: 1px solid #e9ecef;
}

.item-time {
  color: #666;
  font-size: 12px;
}

.item-value {
  font-weight: 500;
  color: #333;
}

.array-more {
  font-size: 12px;
  color: #999;
  font-style: italic;
  margin-top: 4px;
}

.no-data {
  font-size: 14px;
  color: #999;
  font-style: italic;
}

/* 计算字段 */
.calculated-data-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.section-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: #495057;
  margin-bottom: 12px;
}

.calculated-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.calculated-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #fff3cd;
  border-radius: 6px;
  border: 1px solid #ffeaa7;
}

.calculated-name {
  font-weight: 500;
  color: #856404;
}

.calculated-value {
  font-weight: 600;
  color: #856404;
}

/* 控制区域 */
.control-section {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-weight: 600;
  color: #333;
}

.data-source-selector {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.selector-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.timer-config {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.config-unit {
  font-size: 12px;
  color: #666;
}

/* 状态区域 */
.status-section {
  margin-bottom: 16px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.status-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.status-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.status-value {
  font-size: 16px;
  font-weight: 600;
  color: #007bff;
}

/* 错误区域 */
.error-section {
  margin-top: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .comprehensive-data-test-card {
    padding: 16px;
  }

  .data-display-grid {
    grid-template-columns: 1fr;
  }

  .control-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .data-source-selector {
    flex-direction: column;
    align-items: flex-start;
  }

  .timer-config {
    flex-wrap: wrap;
  }
}
</style>
