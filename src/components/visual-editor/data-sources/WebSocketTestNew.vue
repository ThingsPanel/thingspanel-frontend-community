<template>
  <div class="websocket-test-new">
    <n-card title="新版本 WebSocket 测试" size="small">
      <n-space vertical>
        <!-- 测试说明 -->
        <n-alert type="info" title="新版本 WebSocket 测试">
          <template #default>
            <p>这个页面用于测试新版本的设备数据源配置中的 WebSocket 功能</p>
            <p>使用 DeviceDataSourceConfigNew 组件，支持 WebSocket、定时器、手动三种模式</p>
          </template>
        </n-alert>

        <!-- 设备数据源配置 -->
        <n-divider title-placement="left">设备数据源配置</n-divider>

        <DeviceDataSourceConfigNew
          v-model="testConfig"
          component-type="digit-indicator"
          @update:modelValue="updateConfig"
        />

        <!-- 配置信息 -->
        <n-divider title-placement="left">当前配置</n-divider>

        <n-card size="small">
          <pre>{{ JSON.stringify(testConfig, null, 2) }}</pre>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NSpace, NDivider, NAlert } from 'naive-ui'
import DeviceDataSourceConfigNew from './DeviceDataSourceConfigNew.vue'
import type { DeviceDataSourceNew } from '@/components/visual-editor/types/data-source'

// 测试配置
const testConfig = ref<DeviceDataSourceNew>({
  type: 'device',
  enabled: true,
  name: '测试数据源',
  description: '用于测试新版本 WebSocket 功能',
  dataPaths: [],
  dataMapping: {
    mappings: [],
    defaultArrayMode: 'auto',
    defaultArrayIndex: 0,
    enableAutoDetection: true
  },
  apiType: 'telemetryDataCurrentKeys',
  parameters: {
    device_id: 'test_device_001',
    keys: 'temperature'
  },
  polling: {
    enabled: true,
    mode: 'websocket', // 默认使用 WebSocket
    interval: 5000,
    status: 'stopped'
  }
})

const updateConfig = (newConfig: DeviceDataSourceNew) => {
  testConfig.value = newConfig
  console.log('配置更新:', newConfig)
}
</script>

<style scoped>
.websocket-test-new {
  padding: 16px;
  max-width: 1000px;
  margin: 0 auto;
}
</style>
