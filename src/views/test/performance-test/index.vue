<template>
  <div class="performance-test">
    <n-card title="Card2.1 配置性能测试" style="margin: 20px">
      <n-space vertical>
        <!-- 性能统计 -->
        <n-descriptions bordered size="small" style="margin-bottom: 16px">
          <n-descriptions-item label="操作次数">{{ operationCount }}</n-descriptions-item>
          <n-descriptions-item label="更新事件">{{ updateEventCount }}</n-descriptions-item>
          <n-descriptions-item label="平均响应时间">{{ averageResponseTime }}ms</n-descriptions-item>
          <n-descriptions-item label="最大响应时间">{{ maxResponseTime }}ms</n-descriptions-item>
        </n-descriptions>

        <!-- 控制面板 -->
        <n-space>
          <n-button type="primary" :loading="isTesting" @click="startPerformanceTest">开始性能测试</n-button>
          <n-button :disabled="isTesting" @click="resetStats">重置统计</n-button>
          <n-button :disabled="isTesting" @click="clearLogs">清除日志</n-button>
        </n-space>

        <!-- 日志区域 -->
        <n-card title="性能日志" size="small">
          <div ref="logAreaRef" class="log-area">
            <div v-for="(log, index) in logs" :key="index" class="log-item" :class="log.level">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </n-card>

        <!-- 测试组件 -->
        <n-card title="测试组件" size="small">
          <n-space vertical>
            <div v-if="selectedComponentType">
              <strong>当前测试组件：</strong>
              {{ selectedComponentType }}
            </div>

            <n-space>
              <n-button
                :type="selectedComponentType === 'simple-test-component' ? 'primary' : 'default'"
                @click="selectTestComponent('simple-test-component')"
              >
                简单测试组件
              </n-button>
              <n-button
                :type="selectedComponentType === 'data-display-card' ? 'primary' : 'default'"
                @click="selectTestComponent('data-display-card')"
              >
                数据展示卡片
              </n-button>
            </n-space>

            <!-- 配置测试区域 -->
            <div v-if="testWidget && configComponent" class="test-config-area">
              <n-divider title-placement="left">配置测试</n-divider>
              <component :is="configComponent" :widget="testWidget" :config="testConfig" @update="handleConfigUpdate" />
            </div>

            <!-- 组件预览 -->
            <div v-if="testWidget" class="test-preview-area">
              <n-divider title-placement="left">组件预览</n-divider>
              <component :is="testWidget.component" :config="testConfig" />
            </div>
          </n-space>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * Card2.1 配置性能测试页面
 * 监控配置更新的性能指标
 */

import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useVisualEditorIntegration } from '@/card2.1/hooks/useVisualEditorIntegration'

// Card2集成
const card2Integration = useVisualEditorIntegration({ autoInit: true })

// 性能统计
const operationCount = ref(0)
const updateEventCount = ref(0)
const responseTimes = ref<number[]>([])
const isTesting = ref(false)
const logs = ref<Array<{ time: string; message: string; level: string }>>([])
const logAreaRef = ref<HTMLElement>()

// 测试组件
const selectedComponentType = ref<string>('')
const testConfig = reactive({})
const testWidget = ref<any>(null)
const configComponent = ref<any>(null)

// 计算属性
const averageResponseTime = computed(() => {
  if (responseTimes.value.length === 0) return 0
  return Math.round(responseTimes.value.reduce((sum, time) => sum + time, 0) / responseTimes.value.length)
})

const maxResponseTime = computed(() => {
  if (responseTimes.value.length === 0) return 0
  return Math.max(...responseTimes.value)
})

/**
 * 添加日志
 */
const addLog = (message: string, level: 'info' | 'warn' | 'error' = 'info') => {
  const time = new Date().toLocaleTimeString()
  logs.value.push({ time, message, level })

  // 限制日志数量
  if (logs.value.length > 100) {
    logs.value.shift()
  }

  // 自动滚动到底部
  nextTick(() => {
    if (logAreaRef.value) {
      logAreaRef.value.scrollTop = logAreaRef.value.scrollHeight
    }
  })
}

/**
 * 清除日志
 */
const clearLogs = () => {
  logs.value = []
}

/**
 * 重置统计
 */
const resetStats = () => {
  operationCount.value = 0
  updateEventCount.value = 0
  responseTimes.value = []
  addLog('统计数据已重置', 'info')
}

/**
 * 选择测试组件
 */
const selectTestComponent = async (componentType: string) => {
  addLog(`切换测试组件: ${componentType}`)

  selectedComponentType.value = componentType

  try {
    // 获取组件定义
    const componentDef = card2Integration.getComponentDefinition(componentType)
    if (!componentDef) {
      addLog(`未找到组件定义: ${componentType}`, 'error')
      return
    }

    // 设置测试组件
    testWidget.value = {
      type: componentType,
      name: componentDef.name,
      component: componentDef.definition.component,
      properties: { ...componentDef.definition.config },
      metadata: { isCard2Component: true }
    }

    // 设置配置组件
    configComponent.value = componentDef.definition.configComponent

    // 初始化配置
    Object.keys(testConfig).forEach(key => delete testConfig[key])
    Object.assign(testConfig, componentDef.definition.config || {})

    addLog(`成功加载组件: ${componentDef.name}`)
  } catch (error) {
    addLog(`加载组件失败: ${error.message}`, 'error')
  }
}

/**
 * 处理配置更新
 */
const handleConfigUpdate = (newConfig: any) => {
  const startTime = performance.now()

  operationCount.value++
  updateEventCount.value++

  // 更新配置
  Object.keys(testConfig).forEach(key => delete testConfig[key])
  Object.assign(testConfig, newConfig)

  // 测量响应时间
  nextTick(() => {
    const endTime = performance.now()
    const responseTime = endTime - startTime
    responseTimes.value.push(responseTime)

    // 限制统计数量
    if (responseTimes.value.length > 100) {
      responseTimes.value.shift()
    }

    addLog(`配置更新完成，响应时间: ${responseTime.toFixed(2)}ms`)
  })
}

/**
 * 开始性能测试
 */
const startPerformanceTest = async () => {
  if (!testWidget.value) {
    addLog('请先选择一个测试组件', 'warn')
    return
  }

  isTesting.value = true
  addLog('开始自动性能测试...')

  try {
    // 模拟快速配置变更
    const testValues = [
      { title: '性能测试 1', backgroundColor: '#ff0000' },
      { title: '性能测试 2', backgroundColor: '#00ff00' },
      { title: '性能测试 3', backgroundColor: '#0000ff' },
      { title: '性能测试 4', backgroundColor: '#ffff00' },
      { title: '性能测试 5', backgroundColor: '#ff00ff' }
    ]

    for (let i = 0; i < testValues.length; i++) {
      const testConfig = { ...testWidget.value.properties, ...testValues[i] }
      handleConfigUpdate(testConfig)

      // 等待配置应用
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    addLog('自动性能测试完成')
  } catch (error) {
    addLog(`性能测试失败: ${error.message}`, 'error')
  } finally {
    isTesting.value = false
  }
}

// 初始化
onMounted(async () => {
  addLog('性能测试页面已加载')

  try {
    await card2Integration.initialize()
    addLog('Card2.1系统初始化完成')

    // 默认选择简单测试组件
    selectTestComponent('simple-test-component')
  } catch (error) {
    addLog(`初始化失败: ${error.message}`, 'error')
  }
})
</script>

<style scoped>
.performance-test {
  padding: 20px;
  background: var(--body-color);
  min-height: 100vh;
}

.log-area {
  height: 300px;
  overflow-y: auto;
  background: var(--code-color);
  padding: 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
}

.log-item {
  margin-bottom: 4px;
  line-height: 1.4;
}

.log-item.info {
  color: var(--text-color);
}

.log-item.warn {
  color: #f0a020;
}

.log-item.error {
  color: #d03050;
}

.log-time {
  opacity: 0.6;
  margin-right: 8px;
}

.log-message {
  color: inherit;
}

.test-config-area {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 16px;
  background: var(--card-color);
}

.test-preview-area {
  border: 2px dashed var(--border-color);
  border-radius: 6px;
  padding: 20px;
  background: var(--body-color);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 滚动条样式 */
.log-area::-webkit-scrollbar {
  width: 6px;
}

.log-area::-webkit-scrollbar-track {
  background: transparent;
}

.log-area::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.log-area::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}
</style>
