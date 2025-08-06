<template>
  <div class="test-page">
    <n-tabs type="line" animated>
      <n-tab-pane name="deviceApiConfig" tab="🎉 新设备API配置系统">
        <DeviceApiTest />
      </n-tab-pane>

      <n-tab-pane name="componentApiConfig" tab="🔧 组件API配置测试">
        <ComponentApiConfigTest />
      </n-tab-pane>

      <n-tab-pane name="deviceMetricsSelector" tab="📊 设备指标选择器测试">
        <DeviceMetricsSelectorTest />
      </n-tab-pane>

      <n-tab-pane name="deviceDispatchSelector" tab="🚀 设备调度选择器测试">
        <DeviceDispatchSelectorTest />
      </n-tab-pane>

      <n-tab-pane name="dataSourceSystemTest" tab="🧪 数据源系统测试">
        <DataSourceSystemTest />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { NTabs, NTabPane } from 'naive-ui'
import DeviceApiTest from './DeviceApiTest.vue'
import ComponentApiConfigTest from './ComponentApiConfigTest.vue'
import DeviceMetricsSelectorTest from './DeviceMetricsSelectorTest.vue'
import DeviceDispatchSelectorTest from './DeviceDispatchSelectorTest.vue'
import DataSourceSystemTest from './DataSourceSystemTest.vue'
</script>

<style scoped>
.test-page {
  padding: 20px;
}
</style>
