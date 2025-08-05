<template>
  <div class="data-source-system-test">
    <div class="test-header">
      <h2>数据源系统测试</h2>
      <p>测试新的数据源系统功能</p>
    </div>

    <div class="test-content">
      <!-- 直接使用测试组件 -->
      <div class="test-section">
        <h3>数据源测试组件</h3>
        <div class="component-container">
          <DataSourceTestCard />
        </div>
      </div>

      <!-- 系统状态 -->
      <div class="test-section">
        <h3>系统状态</h3>
        <div class="status-grid">
          <div class="status-card">
            <div class="status-number">{{ registeredComponents.length }}</div>
            <div class="status-label">已注册组件</div>
          </div>
          <div class="status-card">
            <div class="status-number">{{ registeredDataSources.length }}</div>
            <div class="status-label">数据源</div>
          </div>
          <div class="status-card">
            <div class="status-number">{{ activeSubscriptions.length }}</div>
            <div class="status-label">活跃订阅</div>
          </div>
        </div>
      </div>

      <!-- 快速测试 -->
      <div class="test-section">
        <h3>快速测试</h3>
        <n-space>
          <n-button type="primary" @click="testStaticDataSource">测试静态数据源</n-button>
          <n-button type="info" @click="testSystemInfo">显示系统信息</n-button>
          <n-button type="default" @click="clearResults">清空结果</n-button>
        </n-space>
      </div>

      <!-- 测试结果 -->
      <div v-if="testResults.length > 0" class="test-section">
        <h3>测试结果</h3>
        <div class="results-list">
          <div
            v-for="(result, index) in testResults"
            :key="index"
            class="result-item"
            :class="result.success ? 'success' : 'error'"
          >
            <div class="result-header">
              <span class="result-title">{{ result.title }}</span>
              <n-tag :type="result.success ? 'success' : 'error'" size="small">
                {{ result.success ? '成功' : '失败' }}
              </n-tag>
            </div>
            <div class="result-message">{{ result.message }}</div>
            <div v-if="result.data" class="result-data">
              <pre>{{ JSON.stringify(result.data, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { NButton, NSpace, NTag } from 'naive-ui'
import DataSourceTestCard from '@/card2.1/components/data-source-test/DataSourceTestCard.vue'
import { componentSchemaManager } from '@/card2.1/core/data-source/component-schema'
import { dataBindingManager } from '@/card2.1/core/data-source/data-binding-manager'
import { reactiveDataManager } from '@/card2.1/core/data-source/reactive-data-manager'
import { StaticDataSourceFactory } from '@/card2.1/core/data-source/static-data-source'

defineOptions({
  name: 'DataSourceSystemTest'
})

interface TestResult {
  title: string
  message: string
  success: boolean
  data?: any
}

const registeredComponents = ref<string[]>([])
const registeredDataSources = ref<any[]>([])
const activeSubscriptions = ref<any[]>([])
const testResults = ref<TestResult[]>([])

let statusUpdateTimer: NodeJS.Timeout | null = null

const testStaticDataSource = async () => {
  try {
    console.log('🧪 开始测试静态数据源...')

    const dataSource = StaticDataSourceFactory.create({
      id: 'test-static-001',
      type: 'static',
      data: {
        temperature: 25.6,
        humidity: 68.2,
        title: '环境传感器',
        unit: '°C',
        status: 'normal'
      },
      fieldMappings: {
        value: 'temperature',
        title: 'title',
        unit: 'unit'
      }
    })

    const result = await dataSource.getValue()
    console.log('✅ 静态数据源测试结果:', result)

    testResults.value.unshift({
      title: '静态数据源测试',
      message: '成功创建静态数据源并提取数据',
      success: true,
      data: result
    })
  } catch (error) {
    console.error('❌ 静态数据源测试失败:', error)
    testResults.value.unshift({
      title: '静态数据源测试',
      message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
      success: false
    })
  }
}

const testSystemInfo = () => {
  try {
    const components = componentSchemaManager.getRegisteredComponents()
    const dataSources = dataBindingManager.getDataSourceList()
    const subscriptions = reactiveDataManager.getAllSubscriptions()

    console.log('📊 系统信息:', { components, dataSources, subscriptions })

    testResults.value.unshift({
      title: '系统信息',
      message: `组件: ${components.length}, 数据源: ${dataSources.length}, 订阅: ${subscriptions.length}`,
      success: true,
      data: {
        registeredComponents: components,
        dataSources: dataSources,
        activeSubscriptions: subscriptions.map(sub => ({
          id: sub.id,
          dataSourceId: sub.dataSourceId,
          isActive: sub.isActive,
          lastUpdate: sub.lastUpdate
        }))
      }
    })
  } catch (error) {
    console.error('❌ 获取系统信息失败:', error)
    testResults.value.unshift({
      title: '系统信息',
      message: `获取失败: ${error instanceof Error ? error.message : '未知错误'}`,
      success: false
    })
  }
}

const clearResults = () => {
  testResults.value = []
}

const updateStatus = () => {
  try {
    registeredComponents.value = componentSchemaManager.getRegisteredComponents()
    registeredDataSources.value = dataBindingManager.getDataSourceList()
    activeSubscriptions.value = reactiveDataManager.getAllSubscriptions()
  } catch (error) {
    console.warn('更新状态失败:', error)
  }
}

onMounted(() => {
  console.log('🧪 [DataSourceSystemTest] 数据源系统测试页面已加载')
  console.log('📋 测试说明:')
  console.log('  1. 点击上方的测试组件进行完整的配置测试')
  console.log('  2. 使用下方的快速测试按钮验证系统功能')
  console.log('  3. 查看系统状态了解当前注册情况')

  updateStatus()

  // 每2秒更新一次状态
  statusUpdateTimer = setInterval(updateStatus, 2000)

  // 自动运行一次系统信息测试
  setTimeout(testSystemInfo, 1000)
})

onUnmounted(() => {
  if (statusUpdateTimer) {
    clearInterval(statusUpdateTimer)
  }
})
</script>

<style scoped>
.data-source-system-test {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
}

.test-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-header h2 {
  color: #333;
  margin: 0 0 8px 0;
  font-size: 24px;
}

.test-header p {
  color: #666;
  margin: 0;
  font-size: 16px;
}

.test-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.test-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-section h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.component-container {
  max-width: 500px;
  margin: 0 auto;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.status-card {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  transition: all 0.2s ease;
}

.status-card:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.status-number {
  font-size: 32px;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 8px;
}

.status-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #ccc;
  background: #f9f9f9;
}

.result-item.success {
  border-left-color: #10b981;
  background: #f0fdf4;
}

.result-item.error {
  border-left-color: #ef4444;
  background: #fef2f2;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-title {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.result-message {
  color: #666;
  margin-bottom: 12px;
  line-height: 1.5;
}

.result-data {
  background: #f5f5f5;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #ddd;
  overflow-x: auto;
}

.result-data pre {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-source-system-test {
    padding: 16px;
  }

  .test-header {
    padding: 16px;
  }

  .test-section {
    padding: 16px;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .result-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>
