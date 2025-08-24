<template>
  <div class="simple-test-page">
    <h1>简单数据源测试</h1>

    <div class="test-info">
      <h2>测试信息</h2>
      <p>页面已加载: {{ pageLoaded }}</p>
      <p>组件数据: {{ JSON.stringify(configData) }}</p>
      <p>数据源数量: {{ Object.keys(dataSources).length }}</p>
    </div>

    <div class="form-container">
      <h2>数据源配置表单</h2>
      <DataSourceConfigForm v-model="configData" :data-sources="dataSources" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataSourceConfigForm from '@/core/data-source-system/components/DataSourceConfigForm.vue'
import type { ModelValue, DataSource } from '@/core/data-source-system/types'

// 页面加载状态
const pageLoaded = ref(false)

// 简单的数据源定义
const dataSources = ref<Record<string, DataSource>>({
  test: {
    key: 'test',
    name: '测试数据源',
    description: '简单测试',
    defaultConfig: {
      message: 'Hello',
      count: 1
    }
  }
})

// 配置数据
const configData = ref<ModelValue>({
  activeDataSourceKey: 'test',
  dataSourceBindings: {
    test: {
      message: 'Hello',
      count: 1
    }
  }
})

onMounted(() => {
  pageLoaded.value = true
  console.log('🎯 简单测试页面已挂载')
  console.log('📊 配置数据:', configData.value)
  console.log('📋 数据源:', dataSources.value)
})
</script>

<style scoped>
.simple-test-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.test-info {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.form-container {
  border: 1px solid #ddd;
  padding: 20px;
  border-radius: 8px;
}

h1,
h2 {
  color: #333;
}

p {
  margin: 8px 0;
}
</style>
