<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useMessage } from 'naive-ui'
import PanelEditor from '@/components/visual-editor/PanelEditor.vue'
import InteractionTestPanel from './components/InteractionTestPanel.vue'
import { interactionManager } from '@/card2.1/core/interaction-manager'
import { manualTester } from '@/manual-interaction-test'

const route = useRoute()
const message = useMessage()

const panel_id = (route.query.id as string) || '72da0887-52f9-b546-27ce-e4c06ea07ca7'

// 交互测试状态
const showInteractionTest = ref(false)
const stateManager = ref<any>(null)

// 🔥 获取当前画布组件列表的函数
const getAvailableComponents = () => {
  if (!stateManager.value || !stateManager.value.nodes) {
    console.log('[INTERACTION-DEBUG] StateManager或nodes不可用')
    return []
  }

  const components = stateManager.value.nodes.map((node: any) => ({
    id: node.id,
    type: node.type,
    name: node.metadata?.name || node.type,
    label: `${node.metadata?.name || node.type} (${node.id.slice(0, 8)}...)` // 显示名称和ID片段
  }))

  console.log('[INTERACTION-DEBUG] 获取可用组件列表:', components)
  return components
}

// 提供给子组件的状态
provide('interactionTestState', {
  showInteractionTest,
  stateManager
})

// 🔥 提供组件列表获取函数给交互配置使用
provide('visualEditorState', {
  getAvailableComponents
})

// 切换交互测试面板
const toggleInteractionTest = () => {
  showInteractionTest.value = !showInteractionTest.value
  if (showInteractionTest.value && stateManager.value) {
    // 获取当前画布上的组件列表
    const components = stateManager.value.nodes.map((node: any) => ({
      id: node.id,
      type: node.type,
      name: node.metadata?.name || node.type
    }))
    console.log('🧪 可测试的组件:', components)
  }
}

// 接收 PanelEditor 的状态管理器
const handleStateManagerReady = (sm: any) => {
  stateManager.value = sm
  console.log('📋 [VisualEditorDetails] StateManager 已就绪:', sm)
}

// 执行系统测试
const runSystemTest = async () => {
  try {
    message.info('正在运行系统测试...')
    const results = await manualTester.runAllTests()

    if (results.success) {
      message.success(`系统测试通过！(${results.passed}/${results.total})`)
    } else {
      message.error(`系统测试失败！(${results.passed}/${results.total})`)
    }

    console.log('🎯 [VisualEditorDetails] 系统测试完成:', results)
  } catch (error) {
    console.error('🎯 [VisualEditorDetails] 系统测试异常:', error)
    message.error('系统测试执行失败')
  }
}

// 测试组件交互
const testComponentInteraction = (componentId: string, action: string, value: any) => {
  try {
    console.log('🧪 执行组件交互测试:', { componentId, action, value })

    // 创建临时配置
    const testConfig = {
      id: `test-${Date.now()}`,
      name: '测试交互',
      event: 'click' as any,
      responses: [
        {
          action: action as any,
          value: value,
          duration: 500
        }
      ],
      enabled: true,
      priority: 999
    }

    // 临时注册测试配置
    const existingConfigs = interactionManager.getComponentConfigs(componentId) || []
    interactionManager.updateComponentConfigs(componentId, [...existingConfigs, testConfig])

    // 触发交互事件
    const results = interactionManager.triggerEvent(componentId, 'click')

    if (results.some(r => r.success)) {
      message.success(`交互执行成功: ${action}`)
      console.log(
        '🎯 交互效果详情:',
        results.find(r => r.success)
      )
    } else {
      const errorResult = results.find(r => !r.success)
      message.error(`交互执行失败: ${errorResult?.error || '未知错误'}`)
    }

    // 3秒后移除测试配置
    setTimeout(() => {
      interactionManager.updateComponentConfigs(componentId, existingConfigs)
      console.log('🧪 测试配置已清除')
    }, 3000)
  } catch (error) {
    console.error('🧪 交互测试失败:', error)
    message.error(`执行失败: ${error}`)
  }
}

// 重置组件状态
const resetComponentState = (componentId: string) => {
  if (componentId) {
    interactionManager.resetComponentState(componentId)
    message.success('组件状态已重置')
  } else {
    message.warning('请先选择组件')
  }
}
</script>

<template>
  <div class="visual-editor-container">
    <!-- 主编辑器 -->
    <PanelEditor :panel-id="panel_id" @state-manager-ready="handleStateManagerReady" />

    <!-- 交互测试按钮 -->
    <div class="interaction-test-button-container">
      <button class="interaction-test-btn" :class="{ active: showInteractionTest }" @click="toggleInteractionTest">
        🧪 交互测试
      </button>
    </div>

    <!-- 交互测试面板 -->
    <InteractionTestPanel
      v-if="showInteractionTest"
      :state-manager="stateManager"
      @close="toggleInteractionTest"
      @test-interaction="testComponentInteraction"
      @reset-component="resetComponentState"
      @run-system-test="runSystemTest"
    />
  </div>
</template>

<style scoped>
.visual-editor-container {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 交互测试按钮 */
.interaction-test-button-container {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1001;
}

.interaction-test-btn {
  padding: 8px 16px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
}

.interaction-test-btn:hover {
  background: #357abd;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
}

.interaction-test-btn.active {
  background: #e74c3c;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
}

.interaction-test-btn.active:hover {
  background: #c0392b;
}
</style>
