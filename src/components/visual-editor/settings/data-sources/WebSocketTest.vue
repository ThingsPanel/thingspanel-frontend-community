<template>
  <div class="websocket-test">
    <n-card title="WebSocket 选项测试" size="small">
      <n-space vertical>
        <!-- 测试说明 -->
        <n-alert type="info" title="测试说明">
          <template #default>
            <p>这个页面用于测试 WebSocket 选项是否正确显示在设备数据源配置中</p>
          </template>
        </n-alert>

        <!-- 设备数据源配置 -->
        <n-divider title-placement="left">设备数据源配置</n-divider>

        <DeviceDataSourceConfig v-model="testConfig" @update:modelValue="updateConfig" />

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
import DeviceDataSourceConfig from './DeviceDataSourceConfig.vue'
import type { DeviceDataSource } from '../../types/data-source'

// 测试配置
const testConfig = ref<DeviceDataSource>({
  type: 'device',
  enabled: true,
  name: '测试数据源',
  description: '用于测试 WebSocket 选项',
  deviceId: '',
  metricsId: '',
  metricsType: 'telemetry',
  dataMode: 'latest',
  pollingType: 'websocket', // 默认使用 WebSocket
  timeRange: '1h',
  aggregateFunction: 'avg',
  dataPaths: [],
  refreshInterval: 5000,
  mqttConfig: {
    broker: '',
    topic: '',
    username: '',
    password: ''
  },
  dataMapping: {
    mappings: [],
    defaultArrayMode: 'auto',
    defaultArrayIndex: 0,
    enableAutoDetection: true
  }
})

const updateConfig = (newConfig: DeviceDataSource) => {
  testConfig.value = newConfig
  console.log('配置更新:', newConfig)
}
</script>

<style scoped>
.websocket-test {
  padding: 16px;
  max-width: 1000px;
  margin: 0 auto;
}
</style>
