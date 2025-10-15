<template>
  <div class="interaction-config-wrapper">
    <!-- 🔥 调试信息 -->
    <div v-if="isDevelopment" class="debug-info" style="margin-bottom: 12px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 12px;">
      <div><strong>调试信息:</strong></div>
      <div>NodeId: {{ props.nodeId }}</div>
      <div>ComponentId: {{ componentId }}</div>
      <div>ComponentType: {{ componentType }}</div>
      <div>配置数量: {{ interactionConfigs.length }}</div>
      <div>配置内容: {{ JSON.stringify(interactionConfigs, null, 2) }}</div>
      <div>HasWidget: {{ !!props.widget }}</div>
      <div>HasEditorContext: {{ !!editorContext }}</div>
    </div>

    <InteractionCardWizard
      v-model="interactionConfigs"
      :component-id="componentId"
      :component-type="componentType"
      @update:model-value="handleInteractionConfigUpdate"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * 🔥 交互配置包装器 - 重构版本
 * 使用InteractionConfigRouter统一管理交互配置
 *
 * 解决的问题：
 * 1. 刷新后交互失效 - 统一配置加载和注册时机
 * 2. 一个组件多交互配置支持 - 路由器并发管理
 * 3. 跨组件属性修改 - 配置级别的属性修改
 */

import { ref, computed, watch, inject, onMounted, onUnmounted, nextTick } from 'vue'
import InteractionCardWizard from '@/core/interaction-system/components/InteractionCardWizard.vue'
import type { InteractionConfig } from '@/card2.1/core2/interaction'
// 🔥 导入新的交互配置路由器
import { interactionConfigRouter } from './InteractionConfigRouter'
// 保留原有配置管理器用于持久化
import { configurationIntegrationBridge as configurationManager } from './ConfigurationIntegrationBridge'

interface Props {
  nodeId: string
  widget: any
  readonly?: boolean
  componentId?: string
  componentType?: string
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

// 注入编辑器上下文以访问统一配置系统
const editorContext = inject('editorContext', null) as any

// 开发环境检测
const isDevelopment = computed(() => {
  return import.meta.env.DEV || import.meta.env.NODE_ENV === 'development'
})

// 计算属性：componentId和componentType
const componentId = computed(() => props.componentId || props.nodeId)
const componentType = computed(() => props.componentType || props.widget?.type || 'unknown')

// 🔥 使用路由器管理的交互配置
const interactionConfigs = ref<InteractionConfig[]>([])

// 🔥 从统一配置中心加载交互配置
const loadInteractionConfigs = (): void => {

  try {
    // 从stateManager读取配置
    if (editorContext?.stateManager) {
      const nodes = editorContext.stateManager.nodes
      const node = nodes.find(n => n.id === componentId.value)
      if (node?.metadata?.unifiedConfig?.interaction?.configs) {
        const configs = node.metadata.unifiedConfig.interaction.configs

        // 更新本地状态
        interactionConfigs.value = configs

        // 🔥 关键：向路由器注册配置
        interactionConfigRouter.registerComponentConfigs(componentId.value, configs)
        return
      }
    }

    // 从ConfigurationManager获取配置作为备选
    const config = configurationManager.getConfiguration(componentId.value)
    const configs = config?.interaction?.configs || []


    // 更新本地状态
    interactionConfigs.value = configs

    // 🔥 关键：向路由器注册配置
    interactionConfigRouter.registerComponentConfigs(componentId.value, configs)

  } catch (error) {
    console.error(`❌ [InteractionConfigWrapper] 加载交互配置失败:`, error)
    interactionConfigs.value = []
  }
}

// 🔥 交互配置更新处理器
const handleInteractionConfigUpdate = (configs: InteractionConfig[]): void => {

  try {
    // 🔥 第一步：保存到ConfigurationManager
    configurationManager.updateConfiguration(
      componentId.value,
      'interaction',
      { configs },
      props.widget?.type
    )

    // 🔥 第二步：保存到stateManager（统一配置中心）
    if (editorContext?.stateManager) {
      const nodes = editorContext.stateManager.nodes
      const nodeIndex = nodes.findIndex(n => n.id === componentId.value)
      if (nodeIndex !== -1) {
        const node = nodes[nodeIndex]

        // 确保unifiedConfig结构存在
        if (!node.metadata) node.metadata = {}
        if (!node.metadata.unifiedConfig) node.metadata.unifiedConfig = {}
        if (!node.metadata.unifiedConfig.interaction) node.metadata.unifiedConfig.interaction = {}

        // 保存配置
        if (configs.length === 0) {
          node.metadata.unifiedConfig.interaction = {}
          delete node.metadata.unifiedConfig.interaction.configs
        } else {
          node.metadata.unifiedConfig.interaction.configs = configs
        }

      }
    }

    // 🔥 第三步：更新本地状态
    interactionConfigs.value = configs

    // 🔥 第四步：向路由器注册更新的配置（会自动重新注册监听器）
    interactionConfigRouter.registerComponentConfigs(componentId.value, configs)


  } catch (error) {
    console.error('❌ [InteractionConfigWrapper] 保存交互配置失败:', error)
  }
}

// 监听widget变化，重新加载配置
watch(() => props.widget, (newWidget, oldWidget) => {
  loadInteractionConfigs()
}, { immediate: true })

// 监听nodeId变化，防止节点切换时数据不更新
watch(() => componentId.value, (newComponentId, oldComponentId) => {
  if (newComponentId !== oldComponentId) {
    // 清理旧组件
    if (oldComponentId) {
      interactionConfigRouter.unregisterComponent(oldComponentId)
    }
    // 加载新配置
    loadInteractionConfigs()
  }
})

// 🔥 生命周期管理
onMounted(() => {

  // 初始化加载配置
  nextTick(() => {
    loadInteractionConfigs()
  })
})

onUnmounted(() => {

  // 🔥 清理路由器中的组件配置和监听器
  interactionConfigRouter.unregisterComponent(componentId.value)
})
</script>

<style scoped>
.interaction-config-wrapper {
  /* 样式继承自父容器 */
}
</style>