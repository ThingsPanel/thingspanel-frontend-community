<template>
  <div class="data-source-test-page">
    <h1>数据源配置测试页面</h1>

    <!-- 配置表单 -->
    <div class="config-section">
      <h2>配置表单</h2>
      <DataSourceConfigForm v-model="configData" :data-sources="dataSources" @update:model-value="onConfigUpdate" />
    </div>

    <!-- 当前配置显示 -->
    <div class="current-config">
      <h2>当前配置数据</h2>
      <pre>{{ JSON.stringify(configData, null, 2) }}</pre>
    </div>

    <!-- 测试按钮 -->
    <div class="test-buttons">
      <n-button type="default" @click="resetConfig">重置配置</n-button>
      <n-button type="info" @click="addRandomConfig">添加随机配置</n-button>
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
import { ref, reactive } from 'vue'
import { NButton } from 'naive-ui'
import DataSourceConfigForm from '@/core/data-source-system/components/DataSourceConfigForm.vue'
import type { ModelValue, DataSource } from '@/core/data-source-system/types'

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
  addLog('配置已重置')
}

// 添加随机配置
function addRandomConfig() {
  const randomKey = `random_${Date.now()}`
  const randomConfig = {
    value: Math.random(),
    timestamp: Date.now(),
    enabled: Math.random() > 0.5
  }

  if (configData.value.dataSourceBindings && configData.value.activeDataSourceKey) {
    configData.value.dataSourceBindings[configData.value.activeDataSourceKey] = {
      ...configData.value.dataSourceBindings[configData.value.activeDataSourceKey],
      [randomKey]: randomConfig
    }
  }

  addLog(`添加随机配置: ${randomKey}`)
}
</script>

<style lang="scss" scoped>
.data-source-test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  h1 {
    color: #333;
    margin-bottom: 30px;
    text-align: center;
  }

  h2 {
    color: #666;
    margin-bottom: 15px;
    border-bottom: 2px solid #eee;
    padding-bottom: 8px;
  }

  .config-section {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .current-config {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;

    pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      line-height: 1.4;
    }
  }

  .test-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 20px;
  }

  .logs {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;

    .log-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .log-item {
      display: flex;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .log-time {
        color: #999;
        font-size: 12px;
        min-width: 80px;
      }

      .log-message {
        color: #333;
        font-size: 14px;
      }
    }
  }
}
</style>
