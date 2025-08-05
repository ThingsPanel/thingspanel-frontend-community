<template>
  <div class="device-metrics-selector-test p-6">
    <h1 class="text-2xl font-bold mb-6">设备指标选择器测试页面</h1>

    <!-- 基础用法 -->
    <div class="test-section mb-8">
      <h2 class="text-xl font-semibold mb-4">基础用法</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="test-card p-4 border rounded-lg">
          <h3 class="text-lg font-medium mb-3">单设备指标选择</h3>
          <DeviceMetricsSelector
            v-model="basicValue"
            :device-options="deviceOptions"
            @device-change="onDeviceChange"
            @metrics-change="onMetricsChange"
          />
          <div class="mt-4 p-3 bg-gray-100 rounded">
            <h4 class="font-medium mb-2">选择结果：</h4>
            <pre class="text-sm">{{ JSON.stringify(basicValue, null, 2) }}</pre>
          </div>
        </div>

        <div class="test-card p-4 border rounded-lg">
          <h3 class="text-lg font-medium mb-3">带聚合函数选择</h3>
          <DeviceMetricsSelector
            v-model="aggregateValue"
            :device-options="deviceOptions"
            :show-aggregate-function="true"
            :is-no-aggregate="false"
            @device-change="onDeviceChange"
            @metrics-change="onMetricsChange"
          />
          <div class="mt-4 p-3 bg-gray-100 rounded">
            <h4 class="font-medium mb-2">选择结果：</h4>
            <pre class="text-sm">{{ JSON.stringify(aggregateValue, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 禁用状态 -->
    <div class="test-section mb-8">
      <h2 class="text-xl font-semibold mb-4">禁用状态</h2>
      <div class="test-card p-4 border rounded-lg">
        <DeviceMetricsSelector v-model="disabledValue" :device-options="deviceOptions" :disabled="true" />
      </div>
    </div>

    <!-- 多设备选择 -->
    <div class="test-section mb-8">
      <h2 class="text-xl font-semibold mb-4">多设备选择</h2>
      <div class="mb-4">
        <n-button type="primary" class="mr-2" @click="addDeviceSelector">添加设备选择器</n-button>
        <n-button :disabled="deviceSelectors.length <= 1" @click="removeDeviceSelector">移除设备选择器</n-button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="(selector, index) in deviceSelectors" :key="index" class="test-card p-4 border rounded-lg">
          <h3 class="text-lg font-medium mb-3">设备 {{ index + 1 }}</h3>
          <DeviceMetricsSelector
            v-model="selector.value"
            :device-options="deviceOptions"
            :show-aggregate-function="true"
            @device-change="onDeviceChange"
            @metrics-change="onMetricsChange"
          />
        </div>
      </div>

      <div class="mt-4 p-4 bg-gray-100 rounded">
        <h4 class="font-medium mb-2">所有设备选择结果：</h4>
        <pre class="text-sm">{{
          JSON.stringify(
            deviceSelectors.map(s => s.value),
            null,
            2
          )
        }}</pre>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="test-section mb-8">
      <h2 class="text-xl font-semibold mb-4">组件操作</h2>
      <div class="flex gap-4">
        <n-button type="primary" @click="loadDeviceOptions">加载设备列表</n-button>
        <n-button type="warning" @click="resetAllSelectors">重置所有选择器</n-button>
        <n-button type="success" @click="exportConfig">导出配置</n-button>
        <n-button type="info" @click="testMetricsLoading">测试指标加载</n-button>
      </div>
    </div>

    <!-- 配置展示 -->
    <div class="test-section">
      <h2 class="text-xl font-semibold mb-4">完整配置</h2>
      <div class="p-4 bg-gray-100 rounded">
        <pre class="text-sm">{{ JSON.stringify(getFullConfig(), null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { NButton } from 'naive-ui'
import { DeviceMetricsSelector } from '@/components/device-selectors'

// 响应式数据
const basicValue = ref({
  deviceId: '',
  metricsId: '',
  metricsName: '',
  aggregateFunction: ''
})

const aggregateValue = ref({
  deviceId: '',
  metricsId: '',
  metricsName: '',
  aggregateFunction: ''
})

const disabledValue = ref({
  deviceId: 'test-device-1',
  metricsId: 'test-metrics-1',
  metricsName: '测试指标',
  aggregateFunction: 'avg'
})

const deviceOptions = ref([
  { id: 'device-1', name: '测试设备1' },
  { id: 'device-2', name: '测试设备2' },
  { id: 'device-3', name: '测试设备3' }
])

const deviceSelectors = reactive([
  { value: { deviceId: '', metricsId: '', metricsName: '', aggregateFunction: '' } },
  { value: { deviceId: '', metricsId: '', metricsName: '', aggregateFunction: '' } }
])

// 事件处理
const onDeviceChange = (deviceId: string, device: any) => {
  console.log('设备选择变化:', deviceId, device)
}

const onMetricsChange = (metricsId: string, metrics: any) => {
  console.log('指标选择变化:', metricsId, metrics)
}

// 添加设备选择器
const addDeviceSelector = () => {
  deviceSelectors.push({
    value: { deviceId: '', metricsId: '', metricsName: '', aggregateFunction: '' }
  })
}

// 移除设备选择器
const removeDeviceSelector = () => {
  if (deviceSelectors.length > 1) {
    deviceSelectors.pop()
  }
}

// 加载设备选项
const loadDeviceOptions = async () => {
  // 这里可以调用组件的 loadDeviceOptions 方法
  console.log('加载设备列表')
}

// 重置所有选择器
const resetAllSelectors = () => {
  basicValue.value = { deviceId: '', metricsId: '', metricsName: '', aggregateFunction: '' }
  aggregateValue.value = { deviceId: '', metricsId: '', metricsName: '', aggregateFunction: '' }
  deviceSelectors.forEach(selector => {
    selector.value = { deviceId: '', metricsId: '', metricsName: '', aggregateFunction: '' }
  })
}

// 导出配置
const exportConfig = () => {
  const config = getFullConfig()
  console.log('导出配置:', config)
  // 这里可以实现实际的导出逻辑
}

// 获取完整配置
const getFullConfig = () => {
  return {
    basic: basicValue.value,
    aggregate: aggregateValue.value,
    disabled: disabledValue.value,
    multiple: deviceSelectors.map(s => s.value)
  }
}

// 测试指标加载
const testMetricsLoading = () => {
  console.log('=== 测试指标加载 ===')
  console.log('基础选择器值:', basicValue.value)
  console.log('聚合选择器值:', aggregateValue.value)
  console.log(
    '设备选择器列表:',
    deviceSelectors.map(s => s.value)
  )

  // 检查是否有选中的设备
  const hasSelectedDevice =
    basicValue.value.deviceId || aggregateValue.value.deviceId || deviceSelectors.some(s => s.value.deviceId)

  if (hasSelectedDevice) {
    console.log('✅ 有选中的设备，可以测试指标加载')
  } else {
    console.log('⚠️ 没有选中的设备，请先选择设备')
  }
}

// 组件挂载时初始化
onMounted(() => {
  console.log('DeviceMetricsSelector 测试页面已加载')
  console.log('当前设备选项:', deviceOptions.value)
})
</script>

<style scoped>
.device-metrics-selector-test {
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 2rem;
}

.test-section:last-child {
  border-bottom: none;
}

.test-card {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
