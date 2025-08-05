<template>
  <div class="data-source-system-test-card">
    <!-- 卡片头部 -->
    <div class="card-header">
      <div class="header-title">
        <i class="i-carbon-data-vis-1" />
        <span>数据源系统测试</span>
      </div>
      <div class="header-status">
        <n-tag size="small" :type="systemStatus.type">
          {{ systemStatus.text }}
        </n-tag>
      </div>
    </div>

    <!-- 系统状态 -->
    <div class="system-stats">
      <div class="stat-item">
        <div class="stat-number">{{ systemStats.components }}</div>
        <div class="stat-label">组件</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ systemStats.dataSources }}</div>
        <div class="stat-label">数据源</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">{{ systemStats.subscriptions }}</div>
        <div class="stat-label">订阅</div>
      </div>
    </div>

    <!-- 快速测试区域 -->
    <div class="test-area">
      <div class="test-section">
        <div class="section-title">静态数据源测试</div>
        <div class="test-controls">
          <n-button size="small" :loading="testing.static" @click="testStaticDataSource">
            <template #icon>
              <i class="i-carbon-document" />
            </template>
            测试静态数据
          </n-button>
          <div v-if="results.static" class="test-result">
            <n-tag size="small" :type="results.static.success ? 'success' : 'error'">
              {{ results.static.success ? '成功' : '失败' }}
            </n-tag>
            <span class="result-text">{{ results.static.message }}</span>
          </div>
        </div>
      </div>

      <div class="test-section">
        <div class="section-title">设备API数据源测试</div>
        <div class="test-controls">
          <n-button size="small" :loading="testing.deviceApi" @click="testDeviceApiDataSource">
            <template #icon>
              <i class="i-carbon-api" />
            </template>
            测试设备API
          </n-button>
          <div v-if="results.deviceApi" class="test-result">
            <n-tag size="small" :type="results.deviceApi.success ? 'success' : 'error'">
              {{ results.deviceApi.success ? '成功' : '失败' }}
            </n-tag>
            <span class="result-text">{{ results.deviceApi.message }}</span>
          </div>
        </div>
      </div>

      <div class="test-section">
        <div class="section-title">响应式更新测试</div>
        <div class="test-controls">
          <n-button size="small" :type="reactiveTest.active ? 'error' : 'primary'" @click="toggleReactiveTest">
            <template #icon>
              <i :class="reactiveTest.active ? 'i-carbon-stop' : 'i-carbon-play'" />
            </template>
            {{ reactiveTest.active ? '停止测试' : '开始测试' }}
          </n-button>
          <div v-if="reactiveTest.count > 0" class="test-result">
            <n-tag size="small" type="info">已更新 {{ reactiveTest.count }} 次</n-tag>
            <span class="result-text">{{ reactiveTest.lastUpdate }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时数据显示 -->
    <div v-if="liveData" class="live-data">
      <div class="data-header">
        <span>实时数据</span>
        <n-tag size="small" type="success">
          {{ new Date().toLocaleTimeString() }}
        </n-tag>
      </div>
      <div class="data-content">
        <div class="data-grid">
          <div v-for="(value, key) in liveData" :key="key" class="data-item">
            <div class="data-label">{{ key }}</div>
            <div class="data-value">{{ formatValue(value) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细信息面板 -->
    <div class="details-panel">
      <n-collapse>
        <n-collapse-item title="系统详细信息" name="system">
          <div class="detail-content">
            <pre class="json-display">{{ JSON.stringify(detailedInfo, null, 2) }}</pre>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { NButton, NTag, NCollapse, NCollapseItem } from 'naive-ui'
import { componentSchemaManager } from '@/card2.1/core/data-source/component-schema'
import { dataBindingManager } from '@/card2.1/core/data-source/data-binding-manager'
import { reactiveDataManager } from '@/card2.1/core/data-source/reactive-data-manager'
import { StaticDataSourceFactory } from '@/card2.1/core/data-source/static-data-source'
import { DeviceApiDataSourceFactory } from '@/card2.1/core/data-source/device-api-data-source'

defineOptions({
  name: 'DataSourceSystemTestCard'
})

// 响应式数据
const systemStats = reactive({
  components: 0,
  dataSources: 0,
  subscriptions: 0
})

const testing = reactive({
  static: false,
  deviceApi: false
})

const results = reactive({
  static: null as { success: boolean; message: string } | null,
  deviceApi: null as { success: boolean; message: string } | null
})

const reactiveTest = reactive({
  active: false,
  count: 0,
  lastUpdate: ''
})

const liveData = ref<any>(null)
const detailedInfo = ref<any>({})

let statusUpdateTimer: NodeJS.Timeout | null = null
let reactiveTestTimer: NodeJS.Timeout | null = null

// 计算属性
const systemStatus = computed(() => {
  const total = systemStats.components + systemStats.dataSources + systemStats.subscriptions
  if (total === 0) {
    return { type: 'warning', text: '系统初始化中' }
  } else if (systemStats.subscriptions > 0) {
    return { type: 'success', text: '系统运行正常' }
  } else {
    return { type: 'info', text: '系统就绪' }
  }
})

// 方法
const formatValue = (value: any): string => {
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

const updateSystemStats = () => {
  try {
    systemStats.components = componentSchemaManager.getRegisteredComponents().length
    systemStats.dataSources = dataBindingManager.getDataSourceList().length
    systemStats.subscriptions = reactiveDataManager.getAllSubscriptions().length

    // 更新详细信息
    detailedInfo.value = {
      registeredComponents: componentSchemaManager.getRegisteredComponents(),
      dataSources: dataBindingManager.getDataSourceList().map(ds => ({
        id: ds.id,
        type: ds.type,
        name: ds.name
      })),
      subscriptions: reactiveDataManager.getAllSubscriptions().map(sub => ({
        id: sub.id,
        dataSourceId: sub.dataSourceId,
        isActive: sub.isActive,
        lastUpdate: sub.lastUpdate
      })),
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.warn('更新系统状态失败:', error)
  }
}

const testStaticDataSource = async () => {
  testing.static = true
  results.static = null

  try {
    console.log('🧪 [DataSourceSystemTestCard] 开始测试静态数据源...')

    const dataSource = StaticDataSourceFactory.create({
      id: 'card-test-static-001',
      type: 'static',
      data: {
        temperature: Math.round(Math.random() * 30 + 15),
        humidity: Math.round(Math.random() * 40 + 40),
        title: '环境监测',
        unit: '°C',
        status: 'active'
      },
      fieldMappings: {
        value: 'temperature',
        title: 'title',
        unit: 'unit',
        status: 'status'
      }
    })

    const result = await dataSource.getValue()
    liveData.value = result

    results.static = {
      success: true,
      message: `提取了 ${Object.keys(result).length} 个字段`
    }

    console.log('✅ [DataSourceSystemTestCard] 静态数据源测试成功:', result)
  } catch (error) {
    console.error('❌ [DataSourceSystemTestCard] 静态数据源测试失败:', error)
    results.static = {
      success: false,
      message: error instanceof Error ? error.message : '测试失败'
    }
  } finally {
    testing.static = false
  }
}

const testDeviceApiDataSource = async () => {
  testing.deviceApi = true
  results.deviceApi = null

  try {
    console.log('🧪 [DataSourceSystemTestCard] 开始测试设备API数据源...')

    const dataSource = DeviceApiDataSourceFactory.createTelemetryDataSource(
      'card-test-device-001',
      'test-device-123',
      'temperature,humidity',
      {
        value: 'data[0].value',
        title: 'data[0].name',
        unit: 'data[0].unit'
      }
    )

    // 注意：这个测试可能会因为设备不存在而失败，这是正常的
    try {
      const result = await dataSource.getValue()
      liveData.value = result

      results.deviceApi = {
        success: true,
        message: '设备API调用成功'
      }
    } catch (apiError) {
      // API调用失败是正常的，因为没有真实设备
      results.deviceApi = {
        success: false,
        message: '需要真实设备数据 (预期行为)'
      }
    }

    console.log('✅ [DataSourceSystemTestCard] 设备API数据源创建成功')
  } catch (error) {
    console.error('❌ [DataSourceSystemTestCard] 设备API数据源测试失败:', error)
    results.deviceApi = {
      success: false,
      message: error instanceof Error ? error.message : '测试失败'
    }
  } finally {
    testing.deviceApi = false
  }
}

const toggleReactiveTest = () => {
  if (reactiveTest.active) {
    // 停止测试
    if (reactiveTestTimer) {
      clearInterval(reactiveTestTimer)
      reactiveTestTimer = null
    }
    reactiveTest.active = false
  } else {
    // 开始测试
    reactiveTest.active = true
    reactiveTest.count = 0

    reactiveTestTimer = setInterval(() => {
      reactiveTest.count++
      reactiveTest.lastUpdate = new Date().toLocaleTimeString()

      // 模拟数据更新
      liveData.value = {
        value: Math.round(Math.random() * 100),
        title: '响应式测试数据',
        unit: '%',
        timestamp: new Date().toISOString(),
        updateCount: reactiveTest.count
      }
    }, 2000)
  }
}

// 生命周期
onMounted(() => {
  console.log('🧪 [DataSourceSystemTestCard] 卡片组件已加载')

  updateSystemStats()

  // 每3秒更新一次系统状态
  statusUpdateTimer = setInterval(updateSystemStats, 3000)

  // 初始化时运行一次静态数据源测试
  setTimeout(testStaticDataSource, 500)
})

onUnmounted(() => {
  if (statusUpdateTimer) {
    clearInterval(statusUpdateTimer)
  }
  if (reactiveTestTimer) {
    clearInterval(reactiveTestTimer)
  }
})
</script>

<style scoped>
.data-source-system-test-card {
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.header-title i {
  font-size: 18px;
  color: #007bff;
}

.system-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.test-area {
  margin-bottom: 20px;
}

.test-section {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.test-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.test-result {
  display: flex;
  align-items: center;
  gap: 6px;
}

.result-text {
  font-size: 12px;
  color: #666;
}

.live-data {
  margin-bottom: 20px;
  padding: 12px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #bfdbfe;
}

.data-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #1e40af;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.data-item {
  background: white;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #e0f2fe;
}

.data-label {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 2px;
  font-weight: 500;
}

.data-value {
  font-size: 13px;
  font-weight: 600;
  color: #1e40af;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.details-panel {
  margin-top: 16px;
}

.detail-content {
  max-height: 200px;
  overflow-y: auto;
}

.json-display {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.4;
  color: #333;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  margin: 0;
  white-space: pre-wrap;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .system-stats {
    grid-template-columns: 1fr;
  }

  .data-grid {
    grid-template-columns: 1fr;
  }

  .test-controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>
