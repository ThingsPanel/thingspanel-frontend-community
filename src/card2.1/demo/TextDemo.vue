<!--
  Text 组件演示
  简单的测试界面
-->

<script setup lang="ts">
import { ref } from 'vue'
import { textComponent } from '../components/text'
import { registerCard } from '../core/registry'
import ConfigProvider from '../utils/ConfigProvider.vue'

// 注册组件
registerCard(textComponent)

// 配置状态
const config = ref({
  content: '这是一个测试文本\n支持换行和各种配置选项',
  fontSize: 18,
  color: '#1890ff',
  textAlign: 'center',
  fontWeight: 'bold',
  lineHeight: 1.6
})

function resetConfig() {
  config.value = {
    content: '重置后的文本',
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
    fontWeight: 'normal',
    lineHeight: 1.5
  }
}

function randomConfig() {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1']
  const aligns = ['left', 'center', 'right']
  const weights = ['normal', 'bold', '300', '500']
  
  config.value = {
    content: `随机配置测试 ${Date.now()}`,
    fontSize: Math.floor(Math.random() * 20) + 14,
    color: colors[Math.floor(Math.random() * colors.length)],
    textAlign: aligns[Math.floor(Math.random() * aligns.length)],
    fontWeight: weights[Math.floor(Math.random() * weights.length)],
    lineHeight: Math.round((Math.random() * 1 + 1.2) * 10) / 10
  }
}
</script>

<template>
  <div class="text-demo">
    <div class="demo-header">
      <h2>📝 Text 组件演示</h2>
      <div class="demo-actions">
        <n-button type="primary" @click="resetConfig">重置配置</n-button>
        <n-button type="info" @click="randomConfig">随机配置</n-button>
      </div>
    </div>

    <div class="demo-content">
      <!-- 组件预览区 -->
      <div class="preview-area">
        <n-card title="组件预览" class="preview-card">
          <ConfigProvider v-model:config="config">
            <component :is="textComponent.component" />
          </ConfigProvider>
        </n-card>
      </div>

      <!-- 配置区 -->
      <div class="config-area">
        <n-card title="配置面板" class="config-card">
          <ConfigProvider v-model:config="config">
            <component :is="textComponent.config" />
          </ConfigProvider>
        </n-card>
      </div>
    </div>

    <!-- 配置状态显示 -->
    <div class="config-display">
      <n-card title="当前配置" size="small">
        <pre>{{ JSON.stringify(config, null, 2) }}</pre>
      </n-card>
    </div>
  </div>
</template>

<style scoped>
.text-demo {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.demo-actions {
  display: flex;
  gap: 12px;
}

.demo-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.preview-area,
.config-area {
  min-height: 400px;
}

.preview-card,
.config-card {
  height: 100%;
}

.config-display pre {
  font-size: 12px;
  background: var(--n-color-code);
  padding: 12px;
  border-radius: 6px;
  overflow: auto;
  max-height: 200px;
}

@media (max-width: 768px) {
  .demo-content {
    grid-template-columns: 1fr;
  }
}
</style>