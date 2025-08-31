<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import PanelEditor from '@/components/visual-editor/PanelEditor.vue'
import { useGlobalPollingManager } from '@/components/visual-editor/core/GlobalPollingManager'

const route = useRoute()
const message = useMessage()

const panel_id = (route.query.id as string) || '72da0887-52f9-b546-27ce-e4c06ea07ca7'

// 全局轮询管理器
const pollingManager = useGlobalPollingManager()
const panelEditor = ref<InstanceType<typeof PanelEditor> | null>(null)

// 全局轮询开关状态
const globalPollingEnabled = computed(() => pollingManager.isGlobalPollingEnabled())
const pollingStats = computed(() => pollingManager.getStatistics())

// 切换全局轮询开关
const toggleGlobalPolling = () => {
  if (!globalPollingEnabled.value) {
    console.log(`🔄 [VisualEditorDetails] 启用全局轮询`)
    // 通过 PanelEditor 的方法初始化轮询任务
    if (panelEditor.value && typeof panelEditor.value.initializePollingTasksAndEnable === 'function') {
      panelEditor.value.initializePollingTasksAndEnable()
    } else {
      // 备用方案：直接启用
      pollingManager.enableGlobalPolling()
    }
    message.success('全局轮询已启用')
  } else {
    console.log(`🔄 [VisualEditorDetails] 关闭全局轮询`)
    pollingManager.disableGlobalPolling()
    message.info('全局轮询已关闭')
  }
}

// 接收 PanelEditor 引用
const handleStateManagerReady = (sm: any) => {
  console.log('📋 [VisualEditorDetails] StateManager 已就绪:', sm)
}
</script>

<template>
  <div class="visual-editor-container">
    <!-- 主编辑器 -->
    <PanelEditor 
      ref="panelEditor"
      :panel-id="panel_id" 
      @state-manager-ready="handleStateManagerReady" 
    />

    <!-- 全局轮询总开关按钮 -->
    <div class="polling-control-button-container">
      <button 
        class="polling-control-btn" 
        :class="{ active: globalPollingEnabled }" 
        @click="toggleGlobalPolling"
      >
        {{ globalPollingEnabled ? '⏸️ 轮询中' : '▶️ 启动轮询' }}
        <div class="polling-stats">
          {{ pollingStats.activeTasks }}/{{ pollingStats.totalTasks }}
        </div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.visual-editor-container {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 全局轮询控制按钮 */
.polling-control-button-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1001;
}

.polling-control-btn {
  padding: 12px 16px;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.polling-control-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(107, 114, 128, 0.4);
}

.polling-control-btn.active {
  background: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  animation: pulse 2s infinite;
}

.polling-control-btn.active:hover {
  background: #059669;
}

.polling-stats {
  font-size: 10px;
  opacity: 0.8;
  margin-top: 2px;
  font-weight: 400;
}

/* 轮询中的脉冲动画 */
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 4px 16px rgba(16, 185, 129, 0.6), 0 0 20px rgba(16, 185, 129, 0.3);
  }
}
</style>
