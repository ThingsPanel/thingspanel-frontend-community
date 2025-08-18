<template>
  <div class="interaction-test-page">
    <n-card title="🧪 交互系统集成测试" class="test-container">
      <div class="test-content">
        <!-- 测试说明 -->
        <n-alert type="info" style="margin-bottom: 20px;">
          <template #header>测试目标</template>
          验证 Card2.1 组件与交互系统的完整集成，包括组件注册、事件触发、状态管理和视觉反馈。
        </n-alert>

        <!-- 测试控制面板 -->
        <n-space vertical size="large">
          <!-- 测试组件展示区 -->
          <n-card title="测试组件" size="small">
            <div class="component-display">
              <simple-test-component
                ref="testComponentRef"
                :component-id="testComponentId"
                :show-interaction-indicator="true"
                :config="componentConfig"
              />
            </div>
          </n-card>

          <!-- 交互测试控制 -->
          <n-card title="交互测试控制" size="small">
            <n-space vertical>
              <n-space>
                <n-button type="primary" @click="testClickInteraction">
                  测试点击交互
                </n-button>
                <n-button type="warning" @click="testHoverInteraction">
                  测试悬停交互
                </n-button>
                <n-button type="error" @click="testCustomInteraction">
                  测试自定义交互
                </n-button>
                <n-button @click="resetComponent">
                  重置组件
                </n-button>
              </n-space>

              <n-form-item label="自定义动作">
                <n-space>
                  <n-select 
                    v-model:value="customAction" 
                    :options="actionOptions" 
                    style="width: 200px;"
                  />
                  <n-input 
                    v-model:value="customValue" 
                    :placeholder="getValuePlaceholder()"
                    style="width: 200px;"
                  />
                  <n-button type="success" @click="executeCustomAction">
                    执行
                  </n-button>
                </n-space>
              </n-form-item>
            </n-space>
          </n-card>

          <!-- 测试结果显示 -->
          <n-card title="测试结果" size="small">
            <n-space vertical>
              <div class="test-stats">
                <n-statistic label="执行次数" :value="testStats.executions" />
                <n-statistic label="成功次数" :value="testStats.successes" />
                <n-statistic label="失败次数" :value="testStats.failures" />
                <n-statistic label="成功率" :value="successRate" suffix="%" />
              </div>

              <n-scrollbar style="max-height: 300px;">
                <n-log :log="logMessages.join('\n')" language="text" />
              </n-scrollbar>
            </n-space>
          </n-card>

          <!-- 系统状态检查 -->
          <n-card title="系统状态" size="small">
            <n-space vertical>
              <n-space>
                <n-tag :type="systemStatus.interactionManager ? 'success' : 'error'">
                  交互管理器: {{ systemStatus.interactionManager ? '正常' : '异常' }}
                </n-tag>
                <n-tag :type="systemStatus.componentRegistered ? 'success' : 'error'">
                  组件注册: {{ systemStatus.componentRegistered ? '已注册' : '未注册' }}
                </n-tag>
                <n-tag :type="systemStatus.eventListeners ? 'success' : 'error'">
                  事件监听: {{ systemStatus.eventListeners ? '正常' : '异常' }}
                </n-tag>
              </n-space>
              
              <n-button @click="checkSystemStatus">刷新状态</n-button>
            </n-space>
          </n-card>
        </n-space>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { interactionManager } from '@/card2.1/core/interaction-manager'
import SimpleTestComponent from '@/card2.1/components/simple-test-component/SimpleTestComponent.vue'

const message = useMessage()

// 测试组件引用和配置
const testComponentRef = ref()
const testComponentId = ref(`test-component-${Date.now()}`)

const componentConfig = ref({
  title: '交互测试组件',
  showTitle: true,
  content: '点击或悬停测试交互功能',
  backgroundColor: '#f0f8ff',
  textColor: '#333333',
  showButton: true,
  buttonText: '测试按钮',
  buttonType: 'primary',
  fontSize: 14,
  padding: 16,
  borderRadius: 8
})

// 自定义交互控制
const customAction = ref('changeBackgroundColor')
const customValue = ref('#ff6b6b')

const actionOptions = [
  { label: '改变背景颜色', value: 'changeBackgroundColor' },
  { label: '改变文字颜色', value: 'changeTextColor' },
  { label: '改变边框颜色', value: 'changeBorderColor' },
  { label: '改变大小', value: 'changeSize' },
  { label: '改变透明度', value: 'changeOpacity' },
  { label: '触发动画', value: 'triggerAnimation' }
]

// 测试统计
const testStats = ref({
  executions: 0,
  successes: 0,
  failures: 0
})

const successRate = computed(() => {
  if (testStats.value.executions === 0) return 0
  return Math.round((testStats.value.successes / testStats.value.executions) * 100)
})

// 日志记录
const logMessages = ref<string[]>([])

// 系统状态
const systemStatus = ref({
  interactionManager: false,
  componentRegistered: false,
  eventListeners: false
})

// 辅助函数
const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  const emoji = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  }[type]
  
  logMessages.value.push(`[${timestamp}] ${emoji} ${message}`)
  console.log(`[InteractionTest] ${message}`)
}

const getValuePlaceholder = () => {
  switch (customAction.value) {
    case 'changeBackgroundColor':
    case 'changeTextColor':
    case 'changeBorderColor':
      return '输入颜色值，如：#ff6b6b'
    case 'changeSize':
      return '输入尺寸，如：300x200'
    case 'changeOpacity':
      return '输入透明度，如：0.5'
    case 'triggerAnimation':
      return '输入动画时长(ms)，如：1000'
    default:
      return '输入参数值'
  }
}

// 测试方法
const executeInteraction = async (event: string, action: string, value: any) => {
  try {
    testStats.value.executions++
    addLog(`开始执行交互测试: ${event} -> ${action}`, 'info')

    // 创建临时配置
    const testConfig = {
      id: `test-${Date.now()}`,
      name: `测试${action}`,
      event: event as any,
      responses: [{
        action: action as any,
        value: value,
        duration: 500
      }],
      enabled: true,
      priority: 999
    }

    // 获取现有配置
    const existingConfigs = interactionManager.getComponentConfigs(testComponentId.value) || []
    
    // 临时添加配置
    interactionManager.updateComponentConfigs(testComponentId.value, [...existingConfigs, testConfig])
    addLog(`临时配置已添加: ${JSON.stringify(testConfig)}`, 'info')

    // 触发事件
    const results = interactionManager.triggerEvent(testComponentId.value, event as any)
    addLog(`交互事件已触发，结果: ${JSON.stringify(results)}`, 'info')

    // 检查结果
    if (results.some(r => r.success)) {
      testStats.value.successes++
      addLog(`交互执行成功: ${action}`, 'success')
      message.success(`交互执行成功: ${action}`)
    } else {
      testStats.value.failures++
      const errorResult = results.find(r => !r.success)
      addLog(`交互执行失败: ${errorResult?.error || '未知错误'}`, 'error')
      message.error(`交互执行失败: ${errorResult?.error || '未知错误'}`)
    }

    // 3秒后清除测试配置
    setTimeout(() => {
      interactionManager.updateComponentConfigs(testComponentId.value, existingConfigs)
      addLog('测试配置已清除', 'info')
    }, 3000)

  } catch (error) {
    testStats.value.failures++
    addLog(`交互测试失败: ${error}`, 'error')
    message.error(`交互测试失败: ${error}`)
  }
}

const testClickInteraction = () => {
  executeInteraction('click', 'changeBackgroundColor', '#ff6b6b')
}

const testHoverInteraction = () => {
  executeInteraction('hover', 'changeTextColor', '#e91e63')
}

const testCustomInteraction = () => {
  executeInteraction('click', 'triggerAnimation', 1000)
}

const executeCustomAction = () => {
  let processedValue = customValue.value

  // 处理特殊值格式
  switch (customAction.value) {
    case 'changeSize':
      if (customValue.value.includes('x')) {
        const [width, height] = customValue.value.split('x').map(Number)
        processedValue = { width, height }
      }
      break
    case 'changeOpacity':
      processedValue = parseFloat(customValue.value) || 0.8
      break
    case 'triggerAnimation':
      processedValue = parseInt(customValue.value) || 1000
      break
  }

  executeInteraction('click', customAction.value, processedValue)
}

const resetComponent = () => {
  interactionManager.resetComponentState(testComponentId.value)
  addLog('组件状态已重置', 'success')
  message.success('组件状态已重置')
}

const checkSystemStatus = () => {
  addLog('开始检查系统状态...', 'info')
  
  // 检查交互管理器
  systemStatus.value.interactionManager = !!interactionManager
  addLog(`交互管理器状态: ${systemStatus.value.interactionManager ? '正常' : '异常'}`, 
    systemStatus.value.interactionManager ? 'success' : 'error')
  
  // 检查组件注册
  systemStatus.value.componentRegistered = interactionManager.hasComponent(testComponentId.value)
  addLog(`组件注册状态: ${systemStatus.value.componentRegistered ? '已注册' : '未注册'}`, 
    systemStatus.value.componentRegistered ? 'success' : 'warning')
  
  // 检查事件监听器
  const registeredComponents = interactionManager.getRegisteredComponents()
  systemStatus.value.eventListeners = registeredComponents.includes(testComponentId.value)
  addLog(`事件监听状态: ${systemStatus.value.eventListeners ? '正常' : '异常'}`, 
    systemStatus.value.eventListeners ? 'success' : 'warning')
  
  addLog(`系统状态检查完成。注册组件数: ${registeredComponents.length}`, 'info')
}

// 生命周期
onMounted(() => {
  addLog('交互系统测试页面已加载', 'success')
  
  // 等待组件挂载后检查状态
  setTimeout(() => {
    checkSystemStatus()
  }, 1000)
})
</script>

<style scoped>
.interaction-test-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-container {
  margin-bottom: 20px;
}

.component-display {
  padding: 20px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.test-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.test-content {
  max-width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .interaction-test-page {
    padding: 10px;
  }
  
  .test-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>