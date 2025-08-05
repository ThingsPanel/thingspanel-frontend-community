<template>
  <div class="data-source-test-card">
    <!-- 组件头部 -->
    <div class="card-header">
      <div class="header-info">
        <span class="card-title">数据源测试组件</span>
        <n-tag size="small" :type="getConnectionStatus().type">
          {{ getConnectionStatus().text }}
        </n-tag>
      </div>
      <div class="header-actions">
        <n-button size="small" :type="isAutoRefreshing ? 'primary' : 'default'" @click="toggleAutoRefresh">
          <template #icon>
            <i :class="isAutoRefreshing ? 'i-carbon-pause' : 'i-carbon-play'" />
          </template>
          {{ isAutoRefreshing ? '停止' : '自动' }}刷新
        </n-button>
        <n-button size="small" secondary @click="refreshData">
          <template #icon>
            <i class="i-carbon-refresh" />
          </template>
        </n-button>
      </div>
    </div>

    <!-- 数据显示区域 -->
    <div class="data-display">
      <!-- 主要数值 -->
      <div class="main-value">
        <span class="value-number">{{ displayData.value || '--' }}</span>
        <span v-if="displayData.unit" class="value-unit">{{ displayData.unit }}</span>
      </div>

      <!-- 标题 -->
      <div v-if="displayData.title" class="value-title">
        {{ displayData.title }}
      </div>

      <!-- 数据绑定详情（调试用） -->
      <div v-if="showDebugInfo" class="debug-info">
        <n-divider title-placement="left" size="small">数据绑定状态</n-divider>

        <!-- 响应式更新状态 -->
        <div class="reactive-status">
          <div class="status-item">
            <span class="field-name">自动刷新:</span>
            <n-tag size="small" :type="isAutoRefreshing ? 'success' : 'default'">
              {{ isAutoRefreshing ? '运行中' : '已停止' }}
            </n-tag>
            <span v-if="isAutoRefreshing" class="field-value">间隔: {{ refreshInterval }}ms</span>
          </div>
          <div v-if="lastUpdateTime" class="status-item">
            <span class="field-name">最后更新:</span>
            <span class="field-value">{{ lastUpdateTime.toLocaleTimeString() }}</span>
          </div>
        </div>

        <div class="binding-status">
          <div v-for="(status, field) in bindingStatus" :key="field" class="status-item">
            <span class="field-name">{{ field }}:</span>
            <n-tag size="small" :type="status.isValid ? 'success' : 'error'">
              {{ status.isValid ? '已绑定' : '未绑定' }}
            </n-tag>
            <span class="field-value">{{ JSON.stringify(status.currentValue) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置按钮 -->
    <div class="card-footer">
      <n-space>
        <n-button size="small" @click="openConfigDialog">
          <template #icon>
            <i class="i-carbon-settings" />
          </template>
          配置数据源
        </n-button>
        <n-button size="small" secondary @click="showDebugInfo = !showDebugInfo">
          <template #icon>
            <i class="i-carbon-debug" />
          </template>
          {{ showDebugInfo ? '隐藏' : '显示' }}调试
        </n-button>
      </n-space>
    </div>

    <!-- 配置对话框 -->
    <n-modal v-model:show="showConfigModal" preset="dialog" title="配置数据源">
      <DataSourceTestConfig
        :data-source-config="dataSourceConfig"
        :component-schema="componentSchema"
        @update-config="handleConfigUpdate"
        @test-data="handleTestData"
      />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { NButton, NTag, NSpace, NDivider, NModal } from 'naive-ui'
import type { ComponentDataSchema, DataSourceConfig, ComponentData, DataBindingStatus } from './types'
import DataSourceTestConfig from './DataSourceTestConfig.vue'
import { componentSchemaManager } from '../../core/data-source/component-schema'
import { reactiveDataManager } from '../../core/data-source/reactive-data-manager'
import { StaticDataSourceFactory } from '../../core/data-source/static-data-source'
import { DeviceApiDataSourceFactory } from '../../core/data-source/device-api-data-source'

// 组件数据需求声明（核心功能）
const componentSchema: ComponentDataSchema = {
  value: {
    type: 'number',
    required: true,
    description: '显示的数值',
    defaultValue: 0
  },
  title: {
    type: 'string',
    required: false,
    description: '标题文本',
    defaultValue: '数据标题'
  },
  unit: {
    type: 'string',
    required: false,
    description: '数值单位',
    defaultValue: ''
  }
}

// 注册组件数据需求到全局管理器
componentSchemaManager.registerSchema('data-source-test', componentSchema)

// 响应式数据
const displayData = reactive<ComponentData>({
  value: 0,
  title: '数据标题',
  unit: ''
})

const bindingStatus = reactive<DataBindingStatus>({
  value: { isBound: false, isValid: false, currentValue: 0 },
  title: { isBound: false, isValid: false, currentValue: '' },
  unit: { isBound: false, isValid: false, currentValue: '' }
})

const dataSourceConfig = ref<DataSourceConfig>({
  id: 'test-data-source',
  type: 'static',
  data: {
    temperature: 25.6,
    humidity: 68.2,
    title: '温度传感器',
    unit: '°C'
  },
  fieldMappings: {
    value: 'temperature',
    title: 'title',
    unit: 'unit'
  }
})

const showConfigModal = ref(false)
const showDebugInfo = ref(true)

// 响应式更新相关状态
const subscriptionId = ref<string | null>(null)
const isAutoRefreshing = ref(false)
const lastUpdateTime = ref<Date | null>(null)
const refreshInterval = ref(5000) // 5秒间隔

// 计算属性
const getConnectionStatus = () => {
  const boundFields = Object.values(bindingStatus).filter(s => s.isBound && s.isValid)
  if (boundFields.length === 0) {
    return { type: 'warning', text: '未配置' }
  } else if (boundFields.length === Object.keys(bindingStatus).length) {
    return { type: 'success', text: '已连接' }
  } else {
    return { type: 'info', text: '部分连接' }
  }
}

// 方法
const openConfigDialog = () => {
  showConfigModal.value = true
}

const handleConfigUpdate = (newConfig: DataSourceConfig) => {
  dataSourceConfig.value = { ...newConfig }
  updateDataBinding()

  // 如果正在自动刷新，重新启动响应式更新
  if (isAutoRefreshing.value) {
    stopAutoRefresh()
    startAutoRefresh()
  }
}

const handleTestData = (testData: any) => {
  // 临时使用测试数据更新显示
  updateDisplayData(testData)
}

const refreshData = () => {
  updateDataBinding()
}

// 核心数据绑定逻辑
const updateDataBinding = () => {
  const config = dataSourceConfig.value

  // 更新绑定状态和显示数据
  Object.keys(componentSchema).forEach(field => {
    const mapping = config.fieldMappings[field]

    if (mapping && config.data) {
      try {
        // 简单的路径解析（只支持一级属性）
        const value = getValueByPath(config.data, mapping)

        // 更新绑定状态
        bindingStatus[field] = {
          isBound: true,
          isValid: value !== undefined,
          currentValue: value,
          error: value === undefined ? '路径无效' : undefined
        }

        // 更新显示数据
        if (value !== undefined) {
          displayData[field as keyof ComponentData] = value
        }
      } catch (error) {
        bindingStatus[field] = {
          isBound: true,
          isValid: false,
          currentValue: undefined,
          error: error instanceof Error ? error.message : '解析错误'
        }
      }
    } else {
      // 使用默认值
      bindingStatus[field] = {
        isBound: false,
        isValid: true,
        currentValue: componentSchema[field].defaultValue
      }
      displayData[field as keyof ComponentData] = componentSchema[field].defaultValue
    }
  })
}

const updateDisplayData = (newData: any) => {
  const config = dataSourceConfig.value

  Object.keys(componentSchema).forEach(field => {
    const mapping = config.fieldMappings[field]
    if (mapping) {
      const value = getValueByPath(newData, mapping)
      if (value !== undefined) {
        displayData[field as keyof ComponentData] = value
      }
    }
  })
}

// 简单的路径解析器（仅支持一级属性）
const getValueByPath = (obj: any, path: string): any => {
  if (!obj || !path) return undefined

  // 简单实现：只支持一级属性访问
  if (path.includes('.')) {
    const parts = path.split('.')
    let current = obj
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part]
      } else {
        return undefined
      }
    }
    return current
  } else {
    return obj[path]
  }
}

// 响应式更新方法
const startAutoRefresh = () => {
  if (isAutoRefreshing.value) return

  // 创建数据源
  const config = dataSourceConfig.value
  let dataSource: any

  try {
    if (config.type === 'static') {
      dataSource = StaticDataSourceFactory.create({
        id: 'test-static-source',
        type: 'static',
        data: config.data,
        fieldMappings: config.fieldMappings
      })
    } else if (config.type === 'device-api') {
      // 这里需要根据实际的设备API配置创建
      dataSource = DeviceApiDataSourceFactory.createSample('test-device-source')
    } else {
      console.warn('不支持的数据源类型:', config.type)
      return
    }

    // 注册数据源
    reactiveDataManager.registerDataSource(dataSource)

    // 创建响应式订阅
    subscriptionId.value = reactiveDataManager.subscribe(
      dataSource.getId(),
      data => {
        console.log('📡 [DataSourceTestCard] 收到响应式数据更新:', data)

        if (data.error) {
          console.error('响应式数据更新错误:', data.error)
          return
        }

        // 更新显示数据
        Object.keys(componentSchema).forEach(field => {
          if (data[field] !== undefined) {
            displayData[field as keyof ComponentData] = data[field]

            // 更新绑定状态
            bindingStatus[field] = {
              isBound: true,
              isValid: true,
              currentValue: data[field],
              lastUpdated: new Date()
            }
          }
        })

        lastUpdateTime.value = new Date()
      },
      {
        updateStrategy: config.type === 'static' ? 'static' : 'polling',
        updateInterval: refreshInterval.value,
        autoStart: true
      }
    )

    isAutoRefreshing.value = true
    console.log(`▶️ [DataSourceTestCard] 启动自动刷新，间隔: ${refreshInterval.value}ms`)
  } catch (error) {
    console.error('启动自动刷新失败:', error)
  }
}

const stopAutoRefresh = () => {
  if (!isAutoRefreshing.value || !subscriptionId.value) return

  reactiveDataManager.unsubscribe(subscriptionId.value)
  subscriptionId.value = null
  isAutoRefreshing.value = false
  lastUpdateTime.value = null

  console.log('⏸️ [DataSourceTestCard] 停止自动刷新')
}

const toggleAutoRefresh = () => {
  if (isAutoRefreshing.value) {
    stopAutoRefresh()
  } else {
    startAutoRefresh()
  }
}

// 初始化
onMounted(() => {
  updateDataBinding()

  // 注册到数据绑定管理器（演示用）
  console.log('🔧 [DataSourceTestCard] 组件已挂载，演示新的数据绑定系统')
})

// 组件卸载时清理资源
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.data-source-test-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  padding: 16px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.data-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin-bottom: 16px;
}

.main-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.value-number {
  font-size: 32px;
  font-weight: 700;
  color: #007bff;
  line-height: 1;
}

.value-unit {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.value-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

.debug-info {
  width: 100%;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.binding-status {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.field-name {
  font-weight: 500;
  color: #333;
  min-width: 50px;
}

.field-value {
  color: #666;
  font-family: monospace;
  background: #f5f5f5;
  padding: 2px 4px;
  border-radius: 2px;
  font-size: 11px;
}

.card-footer {
  display: flex;
  justify-content: center;
  border-top: 1px solid #f0f0f0;
  padding-top: 12px;
}

/* 响应式设计 */
@media (max-width: 300px) {
  .value-number {
    font-size: 24px;
  }

  .header-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
