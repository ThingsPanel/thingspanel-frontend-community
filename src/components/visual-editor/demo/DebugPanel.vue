<template>
  <div class="debug-panel">
    <h2>🔍 调试面板</h2>
    
    <div class="debug-section">
      <h3>Card 2.1 注册表状态</h3>
      <button @click="checkCard21Registry">检查 Card 2.1 注册表</button>
      <div v-if="card21Status">
        <pre>{{ JSON.stringify(card21Status, null, 2) }}</pre>
      </div>
    </div>

    <div class="debug-section">
      <h3>Widget Registry 状态</h3>
      <button @click="checkWidgetRegistry">检查 Widget Registry</button>
      <div v-if="widgetRegistryStatus">
        <pre>{{ JSON.stringify(widgetRegistryStatus, null, 2) }}</pre>
      </div>
    </div>

    <div class="debug-section">
      <h3>Card 2.1 集成状态</h3>
      <button @click="checkCard2Integration">检查 Card 2.1 集成</button>
      <div v-if="integrationStatus">
        <pre>{{ JSON.stringify(integrationStatus, null, 2) }}</pre>
      </div>
    </div>

    <div class="debug-section">
      <h3>强制重新初始化</h3>
      <button @click="forceReinitialize">强制重新初始化</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import componentRegistry from '@/card2.1'
import { widgetRegistry } from '../core/widget-registry'
import { useCard2Integration } from '../hooks/useCard2Integration'

const card21Status = ref(null)
const widgetRegistryStatus = ref(null)
const integrationStatus = ref(null)

const card2Integration = useCard2Integration({
  autoInit: true
})

const checkCard21Registry = () => {
  const allComponents = componentRegistry.getAll()
  card21Status.value = {
    total: allComponents.length,
    components: allComponents.map(c => ({
      id: c.id,
      title: c.meta?.title,
      category: c.meta?.category
    }))
  }
  console.log('Card 2.1 注册表状态:', card21Status.value)
}

const checkWidgetRegistry = () => {
  const allWidgets = widgetRegistry.getAllWidgets()
  widgetRegistryStatus.value = {
    total: allWidgets.length,
    widgets: allWidgets.map(w => ({
      type: w.type,
      name: w.name,
      category: w.category,
      isCard2Component: w.metadata?.isCard2Component
    }))
  }
  console.log('Widget Registry 状态:', widgetRegistryStatus.value)
}

const checkCard2Integration = () => {
  integrationStatus.value = {
    isInitialized: card2Integration.isInitialized.value,
    isLoading: card2Integration.isLoading.value,
    error: card2Integration.error.value,
    availableComponents: card2Integration.availableComponents.value.map(c => ({
      type: c.type,
      name: c.name,
      category: c.category
    }))
  }
  console.log('Card 2.1 集成状态:', integrationStatus.value)
}

const forceReinitialize = async () => {
  console.log('🔄 强制重新初始化...')
  
  // 清理注册表
  widgetRegistry.clear()
  console.log('✅ 清理了 Widget Registry')
  
  // 重新初始化 Card 2.1 集成
  await card2Integration.initialize()
  console.log('✅ 重新初始化了 Card 2.1 集成')
  
  // 检查状态
  checkCard21Registry()
  checkWidgetRegistry()
  checkCard2Integration()
}
</script>

<style scoped>
.debug-panel {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.debug-section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

button {
  margin-bottom: 10px;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

pre {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}
</style> 