<template>
  <div class="test-page">
    <n-tabs type="line" animated>
      <n-tab-pane name="simple" tab="简单测试">
        <SimpleTest />
      </n-tab-pane>
      
      <n-tab-pane name="dataSource" tab="数据源测试">
        <DataSourceTest />
      </n-tab-pane>
      
      <n-tab-pane name="deviceDataSource" tab="设备数据源测试">
        <DeviceDataSourceTest />
      </n-tab-pane>
      
      <n-tab-pane name="httpDataSource" tab="HTTP数据源测试">
        <HttpDataSourceTest />
      </n-tab-pane>
      
      <n-tab-pane name="multiDataSource" tab="多数据源测试">
        <MultiDataSourceTest />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { NTabs, NTabPane } from 'naive-ui'
import SimpleTest from '@/components/visual-editor/demo/SimpleTest.vue'
import DataSourceTest from '@/components/visual-editor/demo/DataSourceTest.vue'
import DeviceDataSourceTest from '@/components/visual-editor/demo/DeviceDataSourceTest.vue'
import HttpDataSourceTest from '@/components/visual-editor/demo/HttpDataSourceTest.vue'
import MultiDataSourceTest from '@/components/visual-editor/demo/MultiDataSourceTest.vue'
</script>

<style scoped>
.test-page {
  padding: 20px;
}
</style> 