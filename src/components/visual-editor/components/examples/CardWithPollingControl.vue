<script setup lang="ts">
/**
 * 带轮询控制的卡片组件示例
 * 演示如何在单个卡片上添加轮询控制功能
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import PollingController from '../PollingController.vue'

interface Props {
  /** 组件ID，用于轮询管理 */
  componentId: string
  /** 卡片标题 */
  title?: string
  /** 是否在预览模式 */
  previewMode?: boolean
  /** 是否显示轮询控制器 */
  showPollingControl?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '数据卡片',
  previewMode: true,
  showPollingControl: true
})

// 模拟数据状态
const data = ref<any>({
  temperature: 25.8,
  humidity: 62,
  lastUpdate: new Date().toLocaleTimeString()
})

const isLoading = ref(false)

// 模拟数据更新函数（实际使用时会连接到真实数据源）
const updateData = async () => {
  isLoading.value = true

  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 500))

  // 模拟数据变化
  data.value = {
    temperature: Number((20 + Math.random() * 10).toFixed(1)),
    humidity: Math.floor(40 + Math.random() * 40),
    lastUpdate: new Date().toLocaleTimeString()
  }

  isLoading.value = false
  console.log(`📊 [CardWithPollingControl] 数据已更新: ${props.componentId}`, data.value)
}

// 处理轮询控制器事件
const handlePollingToggle = (enabled: boolean) => {
  console.log(`🔄 [CardWithPollingControl] 组件 ${props.componentId} 轮询状态: ${enabled ? '启用' : '暂停'}`)
}

const handlePollingEnabled = () => {
  console.log(`✅ [CardWithPollingControl] 组件 ${props.componentId} 轮询已启用`)
}

const handlePollingDisabled = () => {
  console.log(`⏸️ [CardWithPollingControl] 组件 ${props.componentId} 轮询已暂停`)
}

// 数据状态指示器
const statusIndicator = computed(() => {
  const now = Date.now()
  const updateTime = new Date(`${new Date().toDateString()} ${data.value.lastUpdate}`).getTime()
  const timeDiff = now - updateTime

  if (timeDiff < 10000) {
    // 10秒内
    return { color: '#10b981', text: '在线' }
  } else if (timeDiff < 60000) {
    // 1分钟内
    return { color: '#f59e0b', text: '延迟' }
  } else {
    return { color: '#ef4444', text: '离线' }
  }
})

onMounted(() => {
  console.log(`🎯 [CardWithPollingControl] 组件挂载: ${props.componentId}`)
})

onUnmounted(() => {
  console.log(`🎯 [CardWithPollingControl] 组件卸载: ${props.componentId}`)
})
</script>

<template>
  <div class="card-with-polling-control" :class="{ 'preview-mode': previewMode }">
    <!-- 主卡片内容 -->
    <n-card :title="title" size="small" :bordered="true" class="data-card">
      <template #header-extra>
        <!-- 状态指示器 -->
        <n-tag :color="{ color: statusIndicator.color, textColor: 'white' }" size="small" round>
          {{ statusIndicator.text }}
        </n-tag>
      </template>

      <!-- 卡片内容 -->
      <div class="card-content">
        <n-spin :show="isLoading">
          <div class="data-display">
            <div class="data-item">
              <span class="data-label">温度</span>
              <span class="data-value">{{ data.temperature }}°C</span>
            </div>
            <div class="data-item">
              <span class="data-label">湿度</span>
              <span class="data-value">{{ data.humidity }}%</span>
            </div>
          </div>

          <div class="update-info">
            <n-text depth="3" class="update-time">最后更新: {{ data.lastUpdate }}</n-text>
          </div>
        </n-spin>
      </div>

      <!-- 操作按钮 -->
      <template #action>
        <n-space>
          <n-button size="tiny" @click="updateData">手动刷新</n-button>
          <n-button size="tiny" type="primary" ghost>查看详情</n-button>
        </n-space>
      </template>
    </n-card>

    <!-- 卡片级轮询控制器 - 仅在预览模式且启用轮询控制时显示 -->
    <PollingController
      v-if="previewMode && showPollingControl"
      mode="card"
      :component-id="componentId"
      position="top-right"
      :show-stats="true"
      :low-profile="true"
      @polling-toggle="handlePollingToggle"
      @polling-enabled="handlePollingEnabled"
      @polling-disabled="handlePollingDisabled"
    />
  </div>
</template>

<style scoped>
.card-with-polling-control {
  position: relative;
  width: 100%;
  height: 100%;
}

.data-card {
  height: 100%;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.data-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-content {
  padding: 8px 0;
}

.data-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.data-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

.data-label {
  font-size: 13px;
  color: var(--text-color-2);
  font-weight: 500;
}

.data-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-color);
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
}

.update-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.update-time {
  font-size: 11px;
}

/* 预览模式样式 */
.preview-mode .data-card {
  cursor: default;
}

.preview-mode .data-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

/* 暗色主题适配 */
.dark .data-item {
  background: rgba(255, 255, 255, 0.05);
}

.dark .data-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-display {
    gap: 8px;
  }

  .data-item {
    padding: 6px 8px;
  }

  .data-value {
    font-size: 14px;
  }
}
</style>
