<template>
  <div class="json-data-input-test">
    <n-card title="JSON数据输入组件测试" :bordered="false">
      <n-space vertical :size="24">
        <!-- 基础用法示例 -->
        <n-card title="基础用法" size="small" :bordered="true">
          <JsonDataInput
            v-model="basicJsonData"
            show-label
            label="基础JSON输入"
            placeholder="请输入JSON数据..."
            :rows="6"
            @validation-change="handleValidationChange"
            @format="handleFormat"
            @validate="handleValidate"
            @clear="handleClear"
          />

          <n-divider />

          <n-space vertical :size="8">
            <n-text strong>当前数据:</n-text>
            <n-code :code="basicJsonData || '(空)'" language="json" />

            <n-text strong>验证状态:</n-text>
            <n-tag :type="validationStatus.type">{{ validationStatus.text }} - {{ validationStatus.detail }}</n-tag>
          </n-space>
        </n-card>

        <!-- 自动格式化示例 -->
        <n-card title="自动格式化模式" size="small" :bordered="true">
          <JsonDataInput
            v-model="autoFormatJsonData"
            show-label
            label="自动格式化JSON"
            placeholder="失焦时自动格式化..."
            :auto-format="true"
            :auto-validate="true"
            :rows="6"
          />

          <n-divider />

          <n-space vertical :size="8">
            <n-text strong>当前数据:</n-text>
            <n-code :code="autoFormatJsonData || '(空)'" language="json" />
          </n-space>
        </n-card>

        <!-- 无标签模式示例 -->
        <n-card title="无标签模式" size="small" :bordered="true">
          <JsonDataInput v-model="noLabelJsonData" placeholder="无标签的JSON编辑器..." :rows="5" />

          <n-divider />

          <n-space vertical :size="8">
            <n-text strong>当前数据:</n-text>
            <n-code :code="noLabelJsonData || '(空)'" language="json" />
          </n-space>
        </n-card>

        <!-- 只读模式示例 -->
        <n-card title="只读模式" size="small" :bordered="true">
          <JsonDataInput v-model="readonlyJsonData" show-label label="只读JSON" :readonly="true" :rows="4" />
        </n-card>

        <!-- 控制面板 -->
        <n-card title="组件控制" size="small" :bordered="true">
          <n-space>
            <n-button @click="loadSampleData">加载示例数据</n-button>
            <n-button type="warning" @click="clearAllData">清空所有数据</n-button>
            <n-button type="primary" @click="validateAllData">验证所有数据</n-button>
          </n-space>
        </n-card>

        <!-- 事件日志 -->
        <n-card title="事件日志" size="small" :bordered="true">
          <div class="event-log">
            <div v-for="(log, index) in eventLogs" :key="index" class="log-entry">
              <n-tag size="small" :type="log.type">{{ log.timestamp }}</n-tag>
              <span class="log-message">{{ log.message }}</span>
            </div>
            <div v-if="eventLogs.length === 0" class="no-logs">
              <n-text depth="3">暂无事件日志</n-text>
            </div>
          </div>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * JSON数据输入组件测试页面
 * 演示JsonDataInput组件的各种使用方式和功能
 */

import { ref } from 'vue'
import JsonDataInput from '@/core/data-source-system/components/JsonDataInput.vue'
import type { TagType } from 'naive-ui'

// 响应式数据
const basicJsonData = ref('')
const autoFormatJsonData = ref('')
const noLabelJsonData = ref('')
const readonlyJsonData = ref(`{
  "name": "只读示例",
  "description": "这是一个只读的JSON编辑器",
  "readonly": true,
  "features": ["语法高亮", "工具栏", "验证状态"]
}`)

// 验证状态
const validationStatus = ref<{
  type: TagType
  text: string
  detail: string
}>({
  type: 'default',
  text: '未验证',
  detail: '请输入数据'
})

// 事件日志
const eventLogs = ref<
  Array<{
    timestamp: string
    message: string
    type: TagType
  }>
>([])

/**
 * 添加事件日志
 */
const addLog = (message: string, type: TagType = 'info') => {
  eventLogs.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    message,
    type
  })

  // 限制日志数量
  if (eventLogs.value.length > 10) {
    eventLogs.value = eventLogs.value.slice(0, 10)
  }
}

/**
 * 处理验证状态变化
 */
const handleValidationChange = (status: any) => {
  validationStatus.value = status
  addLog(`验证状态更新: ${status.text}`, status.type)
}

/**
 * 处理格式化事件
 */
const handleFormat = () => {
  addLog('JSON格式化完成', 'success')
}

/**
 * 处理验证事件
 */
const handleValidate = (status: any) => {
  addLog(`JSON验证: ${status.text}`, status.type)
}

/**
 * 处理清空事件
 */
const handleClear = () => {
  addLog('JSON内容已清空', 'warning')
}

/**
 * 加载示例数据
 */
const loadSampleData = () => {
  const sampleData = {
    basic: {
      name: '基础示例',
      type: 'demo',
      values: [1, 2, 3, 4, 5],
      config: {
        enabled: true,
        timeout: 30000
      }
    },
    autoFormat: {
      deviceInfo: {
        id: 'device_001',
        name: '温湿度传感器',
        location: '办公室A区',
        metrics: [
          { name: 'temperature', value: 25.6, unit: '°C' },
          { name: 'humidity', value: 60.2, unit: '%' }
        ]
      }
    },
    noLabel: {
      simpleData: '这是一个简单的JSON对象',
      timestamp: new Date().toISOString(),
      status: 'active'
    }
  }

  basicJsonData.value = JSON.stringify(sampleData.basic, null, 2)
  autoFormatJsonData.value = JSON.stringify(sampleData.autoFormat, null, 2)
  noLabelJsonData.value = JSON.stringify(sampleData.noLabel, null, 2)

  addLog('示例数据加载完成', 'success')
  window.$message?.success('示例数据已加载')
}

/**
 * 清空所有数据
 */
const clearAllData = () => {
  basicJsonData.value = ''
  autoFormatJsonData.value = ''
  noLabelJsonData.value = ''

  addLog('所有数据已清空', 'warning')
  window.$message?.info('所有数据已清空')
}

/**
 * 验证所有数据
 */
const validateAllData = () => {
  const dataToValidate = [
    { name: '基础JSON', data: basicJsonData.value },
    { name: '自动格式化JSON', data: autoFormatJsonData.value },
    { name: '无标签JSON', data: noLabelJsonData.value }
  ]

  let validCount = 0
  let totalCount = 0

  dataToValidate.forEach(({ name, data }) => {
    if (!data.trim()) return

    totalCount++
    try {
      JSON.parse(data)
      validCount++
      addLog(`${name}: 验证通过`, 'success')
    } catch (error) {
      addLog(`${name}: 验证失败 - ${error.message}`, 'error')
    }
  })

  if (totalCount === 0) {
    window.$message?.warning('没有数据需要验证')
    return
  }

  const message = `验证完成: ${validCount}/${totalCount} 个数据有效`
  addLog(message, validCount === totalCount ? 'success' : 'warning')
  window.$message?.info(message)
}

// 页面加载时添加欢迎日志
addLog('JSON数据输入组件测试页面已加载', 'info')
</script>

<style scoped>
/**
 * JSON数据输入组件测试页面样式
 */

.json-data-input-test {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 事件日志样式 */
.event-log {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
  background: var(--card-color);
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid var(--divider-color);
}

.log-entry:last-child {
  border-bottom: none;
}

.log-message {
  font-family: monospace;
  font-size: 12px;
  color: var(--text-color);
}

.no-logs {
  text-align: center;
  padding: 20px;
}

/* 暗主题适配 */
[data-theme='dark'] .event-log {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .json-data-input-test {
    padding: 8px;
  }

  .log-entry {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
