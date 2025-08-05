<template>
  <div class="device-dispatch-selector-test p-6">
    <h1 class="text-2xl font-bold mb-6">设备调度数据选择器测试页面</h1>

    <!-- 基础用法 -->
    <div class="test-section mb-8">
      <h2 class="text-xl font-semibold mb-4">基础用法</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="test-card p-4 border rounded-lg">
          <h3 class="text-lg font-medium mb-3">设备调度数据选择</h3>
          <DeviceDispatchSelector
            v-model="basicValue"
            :device-options="deviceOptions"
            @device-change="onDeviceChange"
            @data-type-change="onDataTypeChange"
            @metrics-change="onMetricsChange"
          />
          <div class="mt-4 p-3 bg-gray-100 rounded">
            <h4 class="font-medium mb-2">选择结果：</h4>
            <pre class="text-sm">{{ JSON.stringify(basicValue, null, 2) }}</pre>
          </div>
        </div>

        <div class="test-card p-4 border rounded-lg">
          <h3 class="text-lg font-medium mb-3">不显示数据输入框</h3>
          <DeviceDispatchSelector
            v-model="noInputValue"
            :device-options="deviceOptions"
            :show-value-input="false"
            @device-change="onDeviceChange"
            @data-type-change="onDataTypeChange"
            @metrics-change="onMetricsChange"
          />
          <div class="mt-4 p-3 bg-gray-100 rounded">
            <h4 class="font-medium mb-2">选择结果：</h4>
            <pre class="text-sm">{{ JSON.stringify(noInputValue, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- 禁用状态 -->
    <div class="test-section mb-8">
      <h2 class="text-xl font-semibold mb-4">禁用状态</h2>
      <div class="test-card p-4 border rounded-lg">
        <DeviceDispatchSelector v-model="disabledValue" :device-options="deviceOptions" :disabled="true" />
      </div>
    </div>

    <!-- 完整配置示例 -->
    <div class="test-section mb-8">
      <h2 class="text-xl font-semibold mb-4">完整配置示例</h2>
      <div class="test-card p-4 border rounded-lg">
        <h3 class="text-lg font-medium mb-3">调度数据配置</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="font-medium mb-2">设备调度选择器</h4>
            <DeviceDispatchSelector
              v-model="dispatchConfig"
              :device-options="deviceOptions"
              @device-change="onDeviceChange"
              @data-type-change="onDataTypeChange"
              @metrics-change="onMetricsChange"
            />
          </div>
          <div>
            <h4 class="font-medium mb-2">按钮样式配置</h4>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-1">按钮文本</label>
                <n-input v-model:value="buttonConfig.buttonText" placeholder="按钮文本" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">按钮颜色</label>
                <n-color-picker v-model:value="buttonConfig.buttonColor" :show-alpha="false" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">图标颜色</label>
                <n-color-picker v-model:value="buttonConfig.buttonIconColor" :show-alpha="false" />
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 p-3 bg-gray-100 rounded">
          <h4 class="font-medium mb-2">完整配置：</h4>
          <pre class="text-sm">{{ JSON.stringify(getFullConfig(), null, 2) }}</pre>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="test-section mb-8">
      <h2 class="text-xl font-semibold mb-4">组件操作</h2>
      <div class="flex gap-4">
        <n-button type="primary" @click="loadDeviceOptions">加载设备列表</n-button>
        <n-button type="warning" @click="resetAllSelectors">重置所有选择器</n-button>
        <n-button type="success" @click="exportConfig">导出配置</n-button>
      </div>
    </div>

    <!-- 配置展示 -->
    <div class="test-section">
      <h2 class="text-xl font-semibold mb-4">所有配置</h2>
      <div class="p-4 bg-gray-100 rounded">
        <pre class="text-sm">{{ JSON.stringify(getAllConfigs(), null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { NButton, NInput, NColorPicker } from 'naive-ui'
import { DeviceDispatchSelector } from '@/components/device-selectors'

// 响应式数据
const basicValue = ref({
  deviceId: '',
  deviceName: '',
  dataType: '',
  metricsId: '',
  metricsName: '',
  valueToSend: ''
})

const noInputValue = ref({
  deviceId: '',
  deviceName: '',
  dataType: '',
  metricsId: '',
  metricsName: '',
  valueToSend: ''
})

const disabledValue = ref({
  deviceId: 'test-device-1',
  deviceName: '测试设备1',
  dataType: 'telemetry',
  metricsId: 'test-metrics-1',
  metricsName: '测试指标',
  valueToSend: '1'
})

const dispatchConfig = ref({
  deviceId: '',
  deviceName: '',
  dataType: '',
  metricsId: '',
  metricsName: '',
  valueToSend: ''
})

const buttonConfig = reactive({
  buttonText: '发送数据',
  buttonColor: '#ff4d4f',
  buttonIconColor: '#FFFFFF'
})

const deviceOptions = ref([
  { id: 'device-1', name: '测试设备1' },
  { id: 'device-2', name: '测试设备2' },
  { id: 'device-3', name: '测试设备3' }
])

// 事件处理
const onDeviceChange = (deviceId: string, device: any) => {
  console.log('设备选择变化:', deviceId, device)
}

const onDataTypeChange = (dataType: string) => {
  console.log('数据类型变化:', dataType)
}

const onMetricsChange = (metricsId: string, metrics: any) => {
  console.log('指标选择变化:', metricsId, metrics)
}

// 加载设备选项
const loadDeviceOptions = async () => {
  console.log('加载设备列表')
  // 这里可以调用组件的 loadDeviceOptions 方法
}

// 重置所有选择器
const resetAllSelectors = () => {
  basicValue.value = { deviceId: '', deviceName: '', dataType: '', metricsId: '', metricsName: '', valueToSend: '' }
  noInputValue.value = { deviceId: '', deviceName: '', dataType: '', metricsId: '', metricsName: '', valueToSend: '' }
  dispatchConfig.value = { deviceId: '', deviceName: '', dataType: '', metricsId: '', metricsName: '', valueToSend: '' }
}

// 导出配置
const exportConfig = () => {
  const config = getAllConfigs()
  console.log('导出配置:', config)
  // 这里可以实现实际的导出逻辑
}

// 获取完整配置
const getFullConfig = () => {
  return {
    ...dispatchConfig.value,
    ...buttonConfig
  }
}

// 获取所有配置
const getAllConfigs = () => {
  return {
    basic: basicValue.value,
    noInput: noInputValue.value,
    disabled: disabledValue.value,
    dispatch: dispatchConfig.value,
    button: buttonConfig,
    full: getFullConfig()
  }
}

// 组件挂载时初始化
onMounted(() => {
  console.log('DeviceDispatchSelector 测试页面已加载')
})
</script>

<style scoped>
.device-dispatch-selector-test {
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
