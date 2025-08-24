<template>
  <div class="test-page">
    <h1>数据源配置测试页面</h1>
    
    <!-- 配置表单 -->
    <div class="config-section">
      <h2>配置表单</h2>
      <DataSourceConfigForm
        v-model="configData"
        :data-sources="dataSources"
        @update:model-value="onConfigUpdate"
      />
    </div>

    <!-- 当前配置显示 -->
    <div class="current-config">
      <h2>当前配置数据</h2>
      <pre>{{ JSON.stringify(configData, null, 2) }}</pre>
    </div>

    <!-- 组件数据显示 -->
    <div class="component-data">
      <h2>组件数据 (执行器输出)</h2>
      <div v-if="componentData">
        <pre>{{ JSON.stringify(componentData, null, 2) }}</pre>
      </div>
      <div v-else>
        <p>暂无数据</p>
      </div>
    </div>

    <!-- 测试按钮 -->
    <div class="test-buttons">
      <n-button @click="executeDataSource" type="primary">
        执行数据源
      </n-button>
      <n-button @click="resetConfig" type="default">
        重置配置
      </n-button>
      <n-button @click="addRandomConfig" type="info">
        添加随机配置
      </n-button>
    </div>

    <!-- 日志显示 -->
    <div class="logs">
      <h2>操作日志</h2>
      <div class="log-list">
        <div v-for="(log, index) in logs" :key="index" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { NButton } from 'naive-ui'
import DataSourceConfigForm from './components/data-source-config-form/DataSourceConfigForm.vue'
import { simpleDataExecutor } from './core/simple-data-executor'
import type { ModelValue, DataSource, ComponentData } from './types'

// 测试用的数据源定义
const dataSources = reactive<Record<string, DataSource>>({
  staticData: {
    key: 'staticData',
    name: '静态数据',
    description: '静态数据源，用于测试',
    defaultConfig: {
      data: { message: 'Hello World', count: 0 },
      enabled: true
    }
  },
  apiData: {
    key: 'apiData', 
    name: 'API数据',
    description: 'HTTP API数据源',
    defaultConfig: {
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET',
      interval: 5000
    }
  },
  mockData: {
    key: 'mockData',
    name: '模拟数据',
    description: '模拟动态数据',
    defaultConfig: {
      type: 'random',
      min: 0,
      max: 100,
      precision: 2
    }
  }
})

// 配置数据 - v-model绑定
const configData = ref<ModelValue>({
  activeDataSourceKey: 'staticData',
  dataSourceBindings: {
    staticData: {
      data: { message: 'Hello World', count: 0 },
      enabled: true
    }
  }
})

// 组件数据 - 执行器输出
const componentData = ref<ComponentData | null>(null)

// 操作日志
const logs = ref<Array<{ time: string; message: string }>>([])

// 添加日志
function addLog(message: string) {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message
  })
  // 保持最多50条日志
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
}

// 配置更新回调
function onConfigUpdate(newConfig: ModelValue) {
  addLog(`配置已更新: activeKey=${newConfig.activeDataSourceKey}`)
  console.log('配置更新:', newConfig)
}

// 执行数据源
async function executeDataSource() {
  try {
    addLog('开始执行数据源...')
    
    // 构建简化的配置
    const simpleConfig = {
      id: 'test-component',
      componentId: 'test-component',
      dataSources: [],
      triggers: [],
      enabled: true
    }
    
    // 如果有激活的数据源，添加到配置中
    if (configData.value.activeDataSourceKey && configData.value.dataSourceBindings) {
      const activeKey = configData.value.activeDataSourceKey
      const activeConfig = configData.value.dataSourceBindings[activeKey]
      
      if (activeConfig) {
        simpleConfig.dataSources.push({
          id: activeKey,
          type: 'static', // 简化处理，都当作静态数据
          config: activeConfig
        })
      }
    }
    
    // 执行数据源
    const result = await simpleDataExecutor.execute(simpleConfig)
    
    if (result.success && result.data) {
      componentData.value = result.data
      addLog(`数据源执行成功，耗时: ${result.executionTime}ms`)
    } else {
      addLog(`数据源执行失败: ${result.error || '未知错误'}`)
    }
  } catch (error) {
    addLog(`执行出错: ${error}`)
    console.error('执行数据源出错:', error)
  }
}

// 重置配置
function resetConfig() {
  configData.value = {
    activeDataSourceKey: 'staticData',
    dataSourceBindings: {
      staticData: {
        data: { message: 'Hello World', count: 0 },
        enabled: true
      }
    }
  }
  componentData.value = null
  addLog('配置已重置')
}

// 添加随机配置
function addRandomConfig() {
  const activeKey = configData.value.activeDataSourceKey
  if (activeKey && configData.value.dataSourceBindings) {
    const currentConfig = configData.value.dataSourceBindings[activeKey] || {}
    
    // 添加随机数据
    const randomData = {
      ...currentConfig,
      randomValue: Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      randomString: Math.random().toString(36).substring(7)
    }
    
    configData.value.dataSourceBindings[activeKey] = randomData
    addLog(`已添加随机配置到 ${activeKey}`)
  }
}

// 监听配置变化
watch(
  () => configData.value,
  (newConfig) => {
    console.log('配置变化监听:', newConfig)
  },
  { deep: true }
)

// 初始化日志
addLog('测试页面已加载')
</script>

<style scoped>
.test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.config-section,
.current-config,
.component-data,
.test-buttons,
.logs {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

h2 {
  color: #555;
  margin-bottom: 15px;
  font-size: 18px;
}

pre {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
}

.test-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.log-list {
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.log-time {
  color: #666;
  font-size: 12px;
  min-width: 80px;
}

.log-message {
  color: #333;
  font-size: 14px;
}
</style>