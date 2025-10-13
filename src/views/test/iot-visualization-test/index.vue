<template>
  <div class="test-page">
    <h1>IOT 可视化系统测试</h1>
    <p>这是一个简单的测试页面，用于验证 IOT 可视化系统的基本功能。</p>

    <div class="test-section">
      <h2>系统状态</h2>
      <div class="status-grid">
        <div class="status-item">
          <strong>Card2.1 系统:</strong> {{ card2Status }}
        </div>
        <div class="status-item">
          <strong>卡片注册表:</strong> {{ registryStatus }}
        </div>
        <div class="status-item">
          <strong>可用卡片:</strong> {{ availableCards.length }} 个
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>可用卡片</h2>
      <div v-if="availableCards.length > 0" class="cards-grid">
        <div v-for="card in availableCards" :key="card.type" class="card-item">
          <div class="card-icon">{{ card.icon || '📦' }}</div>
          <div class="card-info">
            <h4>{{ card.name }}</h4>
            <p>{{ card.description }}</p>
            <small>类型: {{ card.type }}</small>
          </div>
        </div>
      </div>
      <div v-else class="no-cards">
        <p>没有可用的卡片</p>
      </div>
    </div>

    <div class="test-section">
      <h2>测试操作</h2>
      <div class="action-buttons">
        <n-button type="primary" @click="openEditor">
          打开编辑器
        </n-button>
        <n-button @click="reloadCards">
          重新加载卡片
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * IOT 可视化系统测试页面
 */

import { ref, onMounted } from 'vue'
import { NButton } from 'naive-ui'
import { useRouter } from 'vue-router'
import { cardRegistry, initializeCardRegistry } from '@/features/iot-visualization/cartes'

const router = useRouter()

const card2Status = ref('未初始化')
const registryStatus = ref('未初始化')
const availableCards = ref<any[]>([])

async function loadSystemStatus() {
  try {
    card2Status.value = '初始化中...'

    // 初始化卡片注册表
    await initializeCardRegistry()

    card2Status.value = '已初始化'
    registryStatus.value = '已加载'

    // 获取可用卡片
    availableCards.value = cardRegistry.getAll()

  } catch (error) {
    console.error('系统初始化失败:', error)
    card2Status.value = '初始化失败'
    registryStatus.value = '加载失败'
  }
}

function openEditor() {
  router.push('/iot-visualization/editor')
}

async function reloadCards() {
  availableCards.value = []
  card2Status.value = '重新加载中...'
  await loadSystemStatus()
}

onMounted(() => {
  loadSystemStatus()
})
</script>

<style scoped>
.test-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 32px;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: white;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.status-item {
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.card-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  background: white;
}

.card-icon {
  font-size: 24px;
  margin-right: 12px;
}

.card-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
}

.card-info p {
  margin: 0 0 4px 0;
  font-size: 12px;
  color: #666;
}

.card-info small {
  color: #999;
}

.no-cards {
  text-align: center;
  padding: 32px;
  color: #999;
}

.action-buttons {
  display: flex;
  gap: 12px;
}
</style>