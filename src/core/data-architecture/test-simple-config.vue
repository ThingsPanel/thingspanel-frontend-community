<!--
  SimpleConfigurationEditor 测试页面
  用于测试简化版的配置编辑器
-->
<script setup lang="ts">
import { ref } from 'vue'
import SimpleConfigurationEditor from './components/SimpleConfigurationEditor.vue'

// 测试数据
const configData = ref({})
const testDataSources = ref([
  {
    key: 'temperature',
    name: '温度数据',
    description: '获取温度传感器数据',
    type: 'number'
  }
])

// 处理配置更新
const handleConfigUpdate = (newConfig: any) => {
  console.log('配置已更新:', newConfig)
  configData.value = newConfig
}
</script>

<template>
  <div class="test-simple-config">
    <n-card title="简易配置编辑器测试" class="test-card">
      <SimpleConfigurationEditor
        v-model="configData"
        :data-sources="testDataSources"
        component-id="test-component"
        component-type="test"
        @update:model-value="handleConfigUpdate"
      />
    </n-card>

    <!-- 配置数据预览 -->
    <n-card title="当前配置数据" class="config-preview">
      <n-code :code="JSON.stringify(configData, null, 2)" language="json" />
    </n-card>
  </div>
</template>

<style scoped>
.test-simple-config {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-card {
  margin-bottom: 20px;
}

.config-preview {
  max-height: 400px;
  overflow-y: auto;
}
</style>
