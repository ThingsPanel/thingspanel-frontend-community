<template>
  <div class="data-source-system-test">
    <div class="test-header">
      <h2>数据源系统测试页面</h2>
      <p>这个页面用于测试新的数据源系统功能</p>
    </div>

    <div class="test-content">
      <!-- 直接使用测试组件 -->
      <div class="test-section">
        <h3>数据源测试组件</h3>
        <div class="component-container">
          <DataSourceTestCard />
        </div>
      </div>

      <!-- 系统状态显示 -->
      <div class="test-section">
        <h3>系统状态</h3>
        <div class="status-info">
          <div class="status-item">
            <span class="label">已注册组件:</span>
            <span class="value">{{ registeredComponents.length }}</span>
          </div>
          <div class="status-item">
            <span class="label">已注册数据源:</span>
            <span class="value">{{ registeredDataSources.length }}</span>
          </div>
          <div class="status-item">
            <span class="label">活跃订阅:</span>
            <span class="value">{{ activeSubscriptions.length }}</span>
          </div>
        </div>
      </div>

      <!-- 快速测试按钮 -->
      <div class="test-section">
        <h3>快速测试</h3>
        <div class="quick-tests">
          <n-button type="primary" @click="testStaticDataSource">测试静态数据源</n-button>
          <n-button type="info" @click="testDeviceApiDataSource">测试设备API数据源</n-button>
          <n-button type="default" @click="showSystemInfo">显示系统信息</n-button>
        </div>
      </div>

      <!-- 测试结果显示 -->
      <div v-if="testResults.length > 0" class="test-section">
        <h3>测试结果</h3>
        <div class="test-results">
          <div
            v-for="(result, index) in testResults"
            :key="index"
            class="result-item"
            :class="{ success: result.success, error: !result.success }"
          >
            <div class="result-title">{{ result.title }}</div>
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
import { ref, onMounted } from 'vue'
import { NButton } from 'naive-ui'
import DataSourceTestCard from '@/card2.1/components/data-source-test/DataSourceTestCard.vue'
import { componentSchemaManager } from '@/card2.1/core/data-source/component-schema'
import { dataBindingManager } from '@/card2.1/core/data-source/data-binding-manager'
import { reactiveDataManager } from '@/card2.1/core/data-source/reactive-data-manager'
import { StaticDataSourceFactory } from '@/card2.1/core/data-source/static-data-source'
import { DeviceApiDataSourceFactory } from '@/card2.1/core/data-source/device-api-data-source'

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

// 测试静态数据源
const testStaticDataSource = async () => {
  try {
    const dataSource = StaticDataSourceFactory.create({
      id: 'test-static-001',
      type: 'static',
      data: {
        temperature: 25.6,
        humidity: 68.2,
        title: '环境传感器',
        unit: '°C'
      },
      fieldMappings: {
        value: 'temperature',
        title: 'title',
        unit: 'unit'
      }
    })

    const result = await dataSource.getValue()

    testResults.value.push({
      title: '静态数据源测试',
      message: '静态数据源创建和数据提取成功',
      success: true,
      data: result
    })
  } catch (error) {
    testResults.value.push({
      title: '静态数据源测试',
      message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
      success: false
    })
  }
}

// 测试设备API数据源
const testDeviceApiDataSource = async () => {
  try {
    const dataSource = DeviceApiDataSourceFactory.createTelemetryDataSource(
      'test-device-001',
      'sample-device-123',
      'temperature,humidity',
      {
        value: 'data[0].value',
        title: 'data[0].name',
        unit: 'data[0].unit'
      }
    )

    // 注意：这个测试可能会失败，因为没有真实的设备数据
    testResults.value.push({
      title: '设备API数据源测试',
      message: '设备API数据源创建成功，实际调用需要真实设备数据',
      success: true,
      data: {
        note: '需要配置真实的设备ID和指标Keys才能获取数据',
        config: dataSource.exportConfig()
      }
    })
  } catch (error) {
    testResults.value.push({
      title: '设备API数据源测试',
      message: `测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
      success: false
    })
  }
}

// 显示系统信息
const showSystemInfo = () => {
  const components = componentSchemaManager.getRegisteredComponents()
  const dataSources = dataBindingManager.getDataSourceList()
  const subscriptions = reactiveDataManager.getAllSubscriptions()

  testResults.value.push({
    title: '系统信息',
    message: '数据源系统状态信息',
    success: true,
    data: {
      registeredComponents: components,
      dataSources: dataSources,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        isActive: sub.isActive,
        lastUpdate: sub.lastUpdate
      }))
    }
  })
}

// 更新状态信息
const updateStatus = () => {
  registeredComponents.value = componentSchemaManager.getRegisteredComponents()
  registeredDataSources.value = dataBindingManager.getDataSourceList()
  activeSubscriptions.value = reactiveDataManager.getAllSubscriptions()
}

onMounted(() => {
  updateStatus()

  // 定期更新状态
  setInterval(updateStatus, 2000)

  console.log('🧪 [DataSourceSystemTest] 测试页面已加载')
  console.log('📋 可用的测试功能:')
  console.log('  1. 数据源测试组件 - 完整的配置和显示界面')
  console.log('  2. 静态数据源测试 - 测试JSON数据解析')
  console.log('  3. 设备API数据源测试 - 测试API调用')
  console.log('  4. 系统状态监控 - 查看注册组件和订阅状态')
})
</script>

<style scoped>
.data-source-system-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.test-header h2 {
  color: #333;
  margin-bottom: 8px;
}

.test-header p {
  color: #666;
  margin: 0;
}

.test-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.test-section {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  padding: 20px;
}

.test-section h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.component-container {
  max-width: 400px;
  margin: 0 auto;
}

.status-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.status-item .label {
  font-weight: 500;
  color: #666;
}

.status-item .value {
  font-weight: 600;
  color: #007bff;
  font-size: 18px;
}

.quick-tests {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.test-results {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  padding: 16px;
  border-radius: 6px;
  border-left: 4px solid #ccc;
}

.result-item.success {
  background: #f0f9ff;
  border-left-color: #10b981;
}

.result-item.error {
  background: #fef2f2;
  border-left-color: #ef4444;
}

.result-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.result-message {
  color: #666;
  margin-bottom: 8px;
}

.result-data {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 12px;
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
    padding: 12px;
  }

  .status-info {
    grid-template-columns: 1fr;
  }

  .quick-tests {
    flex-direction: column;
  }
}
</style>
