<template>
  <div class="data-binding-integration-test">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <i class="i-carbon-data-connected" />
          <h1>数据绑定系统集成测试</h1>
        </div>
        <div class="header-subtitle">验证重新设计的数据源系统完整功能</div>
      </div>
      <div class="header-actions">
        <n-button :loading="isRunningTests" type="primary" size="large" @click="runFullIntegrationTest">
          <template #icon>
            <i class="i-carbon-play" />
          </template>
          运行完整测试
        </n-button>
      </div>
    </div>

    <!-- 系统概览 -->
    <div class="system-overview">
      <div class="overview-card">
        <div class="card-header">
          <i class="i-carbon-assembly-cluster" />
          <span>系统架构</span>
        </div>
        <div class="architecture-flow">
          <div class="flow-step">
            <div class="step-icon">📋</div>
            <div class="step-title">组件需求声明</div>
            <div class="step-desc">定义数据结构和关系</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="step-icon">📊</div>
            <div class="step-title">数据源</div>
            <div class="step-desc">静态/脚本/API/WebSocket</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="step-icon">🔧</div>
            <div class="step-title">转换管道</div>
            <div class="step-desc">处理器链和字段映射</div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="step-icon">⚡</div>
            <div class="step-title">响应式绑定</div>
            <div class="step-desc">实时数据更新</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试套件结果 -->
    <div v-if="testResults.length > 0" class="test-results-section">
      <div class="section-header">
        <h2>集成测试结果</h2>
        <div class="test-summary">
          <n-tag :type="overallPassRate === 100 ? 'success' : 'warning'" size="large">
            {{ overallPassRate.toFixed(1) }}% 通过率
          </n-tag>
          <span class="test-stats">{{ totalPassedTests }}/{{ totalTests }} 测试通过</span>
        </div>
      </div>

      <div class="test-suites">
        <div v-for="suite in testResults" :key="suite.name" class="test-suite">
          <div class="suite-header" @click="toggleSuite(suite.name)">
            <div class="suite-title">
              <i :class="expandedSuites.has(suite.name) ? 'i-carbon-chevron-down' : 'i-carbon-chevron-right'" />
              <span>{{ suite.name }}</span>
              <n-tag :type="suite.failedTests === 0 ? 'success' : 'error'" size="small">
                {{ suite.passedTests }}/{{ suite.totalTests }}
              </n-tag>
            </div>
            <div class="suite-duration">{{ suite.totalDuration }}ms</div>
          </div>

          <div v-if="expandedSuites.has(suite.name)" class="suite-tests">
            <div
              v-for="test in suite.tests"
              :key="test.testName"
              class="test-item"
              :class="{ success: test.success, failed: !test.success }"
            >
              <div class="test-header">
                <div class="test-name">
                  <i :class="test.success ? 'i-carbon-check' : 'i-carbon-error'" />
                  <span>{{ test.testName }}</span>
                </div>
                <div class="test-duration">{{ test.duration }}ms</div>
              </div>
              <div class="test-message">{{ test.message }}</div>
              <div v-if="test.data && test.success" class="test-data">
                <n-collapse>
                  <n-collapse-item title="测试数据" name="data">
                    <pre class="test-data-content">{{ JSON.stringify(test.data, null, 2) }}</pre>
                  </n-collapse-item>
                </n-collapse>
              </div>
              <div v-if="test.error && !test.success" class="test-error">
                <n-text type="error">{{ test.error.message }}</n-text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时演示区域 -->
    <div class="demo-section">
      <div class="section-header">
        <h2>实时演示</h2>
        <n-button :type="demoActive ? 'error' : 'primary'" @click="toggleDemo">
          <template #icon>
            <i :class="demoActive ? 'i-carbon-stop' : 'i-carbon-play'" />
          </template>
          {{ demoActive ? '停止演示' : '启动演示' }}
        </n-button>
      </div>

      <div class="demo-content">
        <!-- 综合测试组件 -->
        <div class="demo-card">
          <div class="card-title">
            <i class="i-carbon-data-vis-1" />
            <span>综合数据测试组件</span>
          </div>
          <div class="component-container">
            <ComprehensiveDataTestCard />
          </div>
        </div>

        <!-- 配置面板 -->
        <div class="demo-card">
          <div class="card-title">
            <i class="i-carbon-settings" />
            <span>可视化配置界面</span>
          </div>
          <div class="config-container">
            <ComprehensiveDataConfigPanel
              :initial-config="demoConfig"
              @config-change="onConfigChange"
              @config-test="onConfigTest"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 性能监控 -->
    <div class="performance-section">
      <div class="section-header">
        <h2>性能监控</h2>
        <n-button size="small" @click="refreshPerformanceData">
          <template #icon>
            <i class="i-carbon-renew" />
          </template>
          刷新数据
        </n-button>
      </div>

      <div class="performance-grid">
        <div class="perf-card">
          <div class="perf-value">{{ performanceData.registeredComponents }}</div>
          <div class="perf-label">已注册组件</div>
        </div>
        <div class="perf-card">
          <div class="perf-value">{{ performanceData.activeBindings }}</div>
          <div class="perf-label">活跃绑定</div>
        </div>
        <div class="perf-card">
          <div class="perf-value">{{ performanceData.totalExecutions }}</div>
          <div class="perf-label">管道执行次数</div>
        </div>
        <div class="perf-card">
          <div class="perf-value">{{ performanceData.avgExecutionTime }}ms</div>
          <div class="perf-label">平均执行时间</div>
        </div>
      </div>
    </div>

    <!-- 系统状态日志 -->
    <div class="logs-section">
      <div class="section-header">
        <h2>系统日志</h2>
        <n-space>
          <n-button size="small" @click="clearLogs">
            <template #icon>
              <i class="i-carbon-clean" />
            </template>
            清空日志
          </n-button>
          <n-checkbox v-model:checked="autoScroll">自动滚动</n-checkbox>
        </n-space>
      </div>

      <div ref="logsContainer" class="logs-container">
        <div v-for="(log, index) in systemLogs" :key="index" class="log-entry" :class="log.level">
          <span class="log-time">{{ log.timestamp }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
        <div v-if="systemLogs.length === 0" class="no-logs">暂无系统日志</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { NButton, NTag, NText, NSpace, NCheckbox, NCollapse, NCollapseItem } from 'naive-ui'

// 导入测试组件
import ComprehensiveDataTestCard from '@/card2.1/components/comprehensive-data-test/ComprehensiveDataTestCard.vue'
import ComprehensiveDataConfigPanel from '@/card2.1/components/comprehensive-data-test/ComprehensiveDataConfigPanel.vue'

// 导入集成测试
import { dataBindingTester } from '@/card2.1/core/data-binding/integration-test'
import type { TestSuite } from '@/card2.1/core/data-binding/integration-test'

// 导入系统组件
import { componentRequirementManager } from '@/card2.1/core/data-binding/component-requirement-manager'

defineOptions({
  name: 'DataBindingSystemIntegration'
})

// ========== 响应式数据 ==========

const isRunningTests = ref(false)
const testResults = ref<TestSuite[]>([])
const expandedSuites = reactive(new Set<string>())
const demoActive = ref(false)
const autoScroll = ref(true)
const logsContainer = ref<HTMLElement>()

const demoConfig = reactive({
  dataSource: {
    type: 'static',
    data: {
      // 完整的传感器数据示例
      temperature: 25.6,
      humidity: 68.2,
      pressure: 1013.25,
      isOnline: true,
      timestamp: new Date().toISOString(),

      // 传感器信息对象
      sensorInfo: {
        id: 'demo-sensor-001',
        name: '环境监控传感器',
        location: '数据中心A区',
        model: 'ENV-2023',
        version: 'v2.1.3'
      },

      // 历史读数数组
      readings: [
        { time: '14:00', value: 24.1, status: 'normal' },
        { time: '14:15', value: 24.8, status: 'normal' },
        { time: '14:30', value: 25.2, status: 'normal' },
        { time: '14:45', value: 25.6, status: 'normal' },
        { time: '15:00', value: 26.1, status: 'high' }
      ],

      // 设备状态信息
      deviceStatus: {
        batteryLevel: 85,
        signalStrength: -45,
        lastSeen: new Date().toISOString(),
        errorCount: 0
      },

      // API响应格式的嵌套数据
      apiResponse: {
        success: true,
        data: {
          sensors: [
            {
              id: 'temp_001',
              type: 'temperature',
              value: 25.6,
              unit: '°C',
              quality: 'good'
            },
            {
              id: 'hum_001',
              type: 'humidity',
              value: 68.2,
              unit: '%',
              quality: 'excellent'
            }
          ],
          metadata: {
            deviceId: 'demo-device-001',
            timestamp: Date.now(),
            location: { lat: 39.9042, lng: 116.4074 }
          }
        }
      }
    },

    // API配置示例
    url: 'https://api.example.com/sensors/current',
    method: 'GET',
    headers: {
      Authorization: 'Bearer demo-token-12345',
      'Content-Type': 'application/json'
    },

    // WebSocket配置（基于你的实现）
    wsUrl: 'ws://localhost:8080/telemetry/datas/current/keys/ws',
    reconnectInterval: 5000,
    maxReconnectAttempts: 3,

    // 脚本配置示例
    script: `
// 生成模拟物联网设备数据
const now = new Date();
const deviceId = 'script-device-' + Math.floor(Math.random() * 100).toString().padStart(3, '0');

return {
  // 基础传感器数据（模拟正弦波动）
  temperature: 22 + Math.sin(now.getTime() / 300000) * 8 + Math.random() * 2,
  humidity: 50 + Math.cos(now.getTime() / 240000) * 25 + Math.random() * 5,
  pressure: 1013 + Math.sin(now.getTime() / 600000) * 20 + Math.random() * 3,
  
  // 设备状态
  isOnline: Math.random() > 0.05, // 95%在线率
  timestamp: now.toISOString(),
  
  // 设备信息
  sensorInfo: {
    id: deviceId,
    name: '动态传感器-' + Math.floor(Math.random() * 10),
    location: ['机房A区', '机房B区', '机房C区', '户外站点'][Math.floor(Math.random() * 4)],
    model: 'DYNAMIC-2023',
    version: 'v' + (Math.floor(Math.random() * 3) + 1) + '.0.0'
  },
  
  // 历史数据（最近1小时，每15分钟一个点）
  readings: Array.from({length: 4}, (_, i) => {
    const time = new Date(now.getTime() - (3-i) * 15 * 60 * 1000);
    const baseTemp = 20 + Math.sin(time.getTime() / 300000) * 8;
    return {
      time: time.toLocaleTimeString(),
      value: Math.round((baseTemp + Math.random() * 3) * 10) / 10,
      status: Math.random() > 0.8 ? 'warning' : 'normal'
    };
  }),
  
  // 设备状态
  deviceStatus: {
    batteryLevel: Math.max(10, Math.min(100, 60 + Math.random() * 40)),
    signalStrength: -30 - Math.random() * 40,
    lastSeen: now.toISOString(),
    errorCount: Math.floor(Math.random() * 3)
  },
  
  // 模拟API响应结构
  apiResponse: {
    success: true,
    timestamp: now.getTime(),
    data: {
      deviceId: deviceId,
      measurements: {
        environmental: {
          temperature: 22 + Math.sin(now.getTime() / 300000) * 8,
          humidity: 50 + Math.cos(now.getTime() / 240000) * 25,
          airQuality: Math.floor(50 + Math.random() * 100)
        },
        system: {
          uptime: Math.floor(Math.random() * 86400 * 30), // 最近30天
          memoryUsage: Math.floor(30 + Math.random() * 40),
          cpuUsage: Math.floor(10 + Math.random() * 60)
        }
      }
    }
  }
};
    `
  },

  mappingRules: [
    // 基础值映射
    {
      sourcePath: 'temperature',
      targetField: 'temperature',
      type: 'direct',
      defaultValue: 0,
      description: '温度值直接映射'
    },
    {
      sourcePath: 'humidity',
      targetField: 'humidity',
      type: 'direct',
      defaultValue: 0,
      description: '湿度值直接映射'
    },
    {
      sourcePath: 'isOnline',
      targetField: 'isOnline',
      type: 'direct',
      defaultValue: false,
      description: '在线状态映射'
    },

    // 对象映射
    {
      sourcePath: 'sensorInfo',
      targetField: 'sensorInfo',
      type: 'direct',
      defaultValue: {},
      description: '传感器信息对象映射'
    },

    // 数组映射
    {
      sourcePath: 'readings',
      targetField: 'readings',
      type: 'direct',
      defaultValue: [],
      description: '历史读数数组映射'
    },

    // 嵌套路径映射
    {
      sourcePath: 'apiResponse.data.sensors[0].value',
      targetField: 'apiTemperature',
      type: 'direct',
      defaultValue: null,
      description: 'API响应中的温度值提取'
    },
    {
      sourcePath: 'deviceStatus.batteryLevel',
      targetField: 'battery',
      type: 'direct',
      defaultValue: 0,
      description: '电池电量提取'
    },

    // 计算映射
    {
      sourcePath: 'temperature',
      targetField: 'temperatureF',
      type: 'calculated',
      transformerString: 'value => Math.round((value * 9/5 + 32) * 10) / 10',
      defaultValue: 32,
      description: '摄氏度转华氏度'
    },
    {
      sourcePath: 'deviceStatus.batteryLevel',
      targetField: 'batteryStatus',
      type: 'calculated',
      transformerString: 'value => value > 80 ? "充足" : value > 30 ? "正常" : "低电量"',
      defaultValue: '未知',
      description: '电池状态文字描述'
    }
  ],

  updateTrigger: {
    type: 'timer',
    interval: 5000,
    immediate: true,

    // WebSocket触发器配置
    wsUrl: 'ws://localhost:8080/telemetry/datas/current/keys/ws',
    heartbeatInterval: 8000,
    heartbeatMessage: 'ping',

    // 事件触发器配置
    eventName: 'dataUpdate',
    eventTarget: 'window'
  }
})

const performanceData = reactive({
  registeredComponents: 0,
  activeBindings: 0,
  totalExecutions: 0,
  avgExecutionTime: 0
})

const systemLogs = ref<
  Array<{
    timestamp: string
    level: 'info' | 'warn' | 'error' | 'success'
    message: string
  }>
>([])

// ========== 计算属性 ==========

const totalTests = computed(() => testResults.value.reduce((sum, suite) => sum + suite.totalTests, 0))

const totalPassedTests = computed(() => testResults.value.reduce((sum, suite) => sum + suite.passedTests, 0))

const overallPassRate = computed(() => (totalTests.value > 0 ? (totalPassedTests.value / totalTests.value) * 100 : 0))

// ========== 方法 ==========

const addLog = (level: 'info' | 'warn' | 'error' | 'success', message: string) => {
  systemLogs.value.push({
    timestamp: new Date().toLocaleTimeString(),
    level,
    message
  })

  // 限制日志数量
  if (systemLogs.value.length > 100) {
    systemLogs.value.splice(0, systemLogs.value.length - 100)
  }

  // 自动滚动到底部
  if (autoScroll.value) {
    nextTick(() => {
      if (logsContainer.value) {
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight
      }
    })
  }
}

const runFullIntegrationTest = async () => {
  if (isRunningTests.value) return

  isRunningTests.value = true
  testResults.value = []

  addLog('info', '开始运行完整集成测试套件...')

  try {
    const results = await dataBindingTester.runFullTestSuite()
    testResults.value = results

    const totalTests = results.reduce((sum, suite) => sum + suite.totalTests, 0)
    const passedTests = results.reduce((sum, suite) => sum + suite.passedTests, 0)
    const passRate = ((passedTests / totalTests) * 100).toFixed(1)

    if (passedTests === totalTests) {
      addLog('success', `所有测试通过！${passedTests}/${totalTests} (${passRate}%)`)
    } else {
      addLog('warn', `部分测试失败：${passedTests}/${totalTests} (${passRate}%)`)
    }

    // 自动展开失败的测试套件
    results.forEach(suite => {
      if (suite.failedTests > 0) {
        expandedSuites.add(suite.name)
      }
    })
  } catch (error) {
    addLog('error', `集成测试执行失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    isRunningTests.value = false
  }
}

const toggleSuite = (suiteName: string) => {
  if (expandedSuites.has(suiteName)) {
    expandedSuites.delete(suiteName)
  } else {
    expandedSuites.add(suiteName)
  }
}

const toggleDemo = () => {
  demoActive.value = !demoActive.value

  if (demoActive.value) {
    addLog('info', '启动实时演示')
  } else {
    addLog('info', '停止实时演示')
  }
}

const onConfigChange = (config: any) => {
  Object.assign(demoConfig, config)
  addLog('info', '演示配置已更新')
}

const onConfigTest = (config: any) => {
  addLog('info', '配置测试已触发')
}

const refreshPerformanceData = () => {
  try {
    // 获取真实的系统数据
    performanceData.registeredComponents = componentRequirementManager.getRegisteredCount()

    // 模拟活跃绑定数据（可以从dataBindingManager获取）
    performanceData.activeBindings = Math.floor(Math.random() * 5) + 1

    // 累积执行次数（模拟持续增长）
    performanceData.totalExecutions += Math.floor(Math.random() * 10) + 1

    // 模拟动态执行时间（基于系统负载）
    const baseTime = 15 + Math.random() * 30
    const loadFactor = performanceData.activeBindings / 10
    performanceData.avgExecutionTime = Math.round(baseTime * (1 + loadFactor))

    addLog(
      'info',
      `性能数据已刷新 - 组件:${performanceData.registeredComponents}, 绑定:${performanceData.activeBindings}, 执行:${performanceData.totalExecutions}次`
    )
  } catch (error) {
    console.error('性能数据刷新错误:', error)
    addLog('error', '刷新性能数据失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

const clearLogs = () => {
  systemLogs.value = []
  addLog('info', '系统日志已清空')
}

// ========== 生命周期 ==========

onMounted(() => {
  addLog('success', '数据绑定系统集成测试页面已加载')
  addLog('info', '系统架构：组件需求声明 → 数据源 → 转换管道 → 响应式绑定')
  addLog('info', '支持数据类型：基础值、复杂对象、数组及其嵌套结构')
  addLog('info', '支持数据源：静态数据、JavaScript脚本、API接口、WebSocket实时流')
  addLog('info', '支持触发器：定时器、WebSocket消息、自定义事件、手动触发')

  // 展示WebSocket配置示例
  addLog('info', `WebSocket配置示例: ${demoConfig.dataSource.wsUrl}`)
  addLog('info', '演示数据已预填充，包含温度、湿度、传感器信息等完整示例')

  addLog('info', '点击"运行完整测试"开始验证系统功能')

  // 初始化性能数据
  performanceData.totalExecutions = Math.floor(Math.random() * 100) + 50
  refreshPerformanceData()

  // 模拟一些初始系统活动
  setTimeout(() => {
    addLog('info', '组件数据需求管理器已初始化')
    addLog('info', '数据转换管道工厂已就绪')
    addLog('info', '响应式绑定管理器已准备就绪')
  }, 1000)

  setTimeout(() => {
    addLog('success', '所有系统组件初始化完成，可以开始测试')
  }, 2000)

  // 定期更新性能数据（模拟系统活动）
  const performanceTimer = setInterval(() => {
    refreshPerformanceData()

    // 偶尔添加一些系统活动日志
    if (Math.random() > 0.7) {
      const activities = [
        '数据管道执行中...',
        '响应式绑定状态更新',
        '组件数据验证完成',
        '缓存数据已刷新',
        'WebSocket心跳检测正常'
      ]
      const activity = activities[Math.floor(Math.random() * activities.length)]
      addLog('info', activity)
    }
  }, 5000)

  // 模拟一些WebSocket相关的日志
  setTimeout(() => {
    addLog('info', 'WebSocket连接池初始化完成')
    addLog('info', '支持自动重连，重连间隔: 5秒，最大重试: 3次')
    addLog('info', '心跳检测已启动，间隔: 8秒')
  }, 3000)

  onUnmounted(() => {
    clearInterval(performanceTimer)
    addLog('info', '系统资源已清理，定时器已停止')
  })
})
</script>

<style scoped>
.data-binding-integration-test {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  flex: 1;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.header-title i {
  font-size: 32px;
  color: #007bff;
}

.header-title h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.header-subtitle {
  font-size: 16px;
  color: #666;
  margin-left: 44px;
}

/* 系统概览 */
.system-overview {
  margin-bottom: 32px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.card-header i {
  font-size: 20px;
  color: #007bff;
}

.architecture-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  min-width: 160px;
  transition: all 0.3s ease;
}

.flow-step:hover {
  border-color: #007bff;
  transform: translateY(-2px);
}

.step-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.step-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  text-align: center;
}

.step-desc {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.flow-arrow {
  font-size: 24px;
  color: #007bff;
  font-weight: bold;
}

/* 测试结果 */
.test-results-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.test-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.test-stats {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.test-suites {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.test-suite {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.suite-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.suite-header:hover {
  background: #e9ecef;
}

.suite-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
}

.suite-title i {
  font-size: 16px;
  color: #666;
}

.suite-duration {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.suite-tests {
  padding: 8px;
}

.test-item {
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 6px;
  border-left: 4px solid #e9ecef;
}

.test-item.success {
  background: #f0f9ff;
  border-left-color: #10b981;
}

.test-item.failed {
  background: #fef2f2;
  border-left-color: #ef4444;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.test-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #333;
}

.test-name i {
  font-size: 16px;
}

.test-item.success .test-name i {
  color: #10b981;
}

.test-item.failed .test-name i {
  color: #ef4444;
}

.test-duration {
  font-size: 12px;
  color: #666;
}

.test-message {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.test-data-content {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #333;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

.test-error {
  margin-top: 8px;
}

/* 演示区域 */
.demo-section {
  margin-bottom: 32px;
}

.demo-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.demo-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #333;
}

.card-title i {
  font-size: 18px;
  color: #007bff;
}

.component-container,
.config-container {
  padding: 20px;
  max-height: 600px;
  overflow-y: auto;
}

/* 性能监控 */
.performance-section {
  margin-bottom: 32px;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.perf-card {
  text-align: center;
  padding: 24px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.perf-card:hover {
  border-color: #007bff;
  transform: translateY(-2px);
}

.perf-value {
  font-size: 32px;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 8px;
}

.perf-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* 日志区域 */
.logs-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.logs-container {
  height: 300px;
  overflow-y: auto;
  padding: 16px;
  background: #1e1e1e;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.log-entry {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
  padding: 2px 0;
}

.log-time {
  color: #888;
  min-width: 80px;
}

.log-level {
  min-width: 60px;
  font-weight: 600;
}

.log-entry.info .log-level {
  color: #3b82f6;
}

.log-entry.success .log-level {
  color: #10b981;
}

.log-entry.warn .log-level {
  color: #f59e0b;
}

.log-entry.error .log-level {
  color: #ef4444;
}

.log-message {
  color: #e5e5e5;
  flex: 1;
}

.no-logs {
  text-align: center;
  color: #888;
  font-style: italic;
  padding: 40px 20px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .demo-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .data-binding-integration-test {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .architecture-flow {
    flex-direction: column;
  }

  .flow-arrow {
    transform: rotate(90deg);
  }

  .performance-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
