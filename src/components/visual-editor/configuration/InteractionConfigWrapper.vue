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
 * 交互配置包装器
 * 负责将InteractionCardWizard与统一配置系统集成
 */

import { ref, computed, watch, inject, onMounted, onUnmounted, nextTick } from 'vue'
import InteractionCardWizard from '@/core/interaction-system/components/InteractionCardWizard.vue'
import type { InteractionConfig } from '@/card2.1/core/interaction-types'

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
  // 使用import.meta.env替代process.env，更安全且Vite原生支持
  return import.meta.env.DEV || import.meta.env.NODE_ENV === 'development'
})

// 计算属性：componentId和componentType
const componentId = computed(() => props.componentId || props.nodeId)
const componentType = computed(() => props.componentType || props.widget?.type || 'unknown')

// 交互配置数据
const interactionConfigs = ref<InteractionConfig[]>([])

// 从统一配置中获取交互配置
const loadInteractionConfigs = () => {
  try {
    console.log(`🎯 [InteractionConfigWrapper] 开始加载交互配置: ${props.nodeId}`)
    
    // 🔥 优先从stateManager读取已保存的配置
    if (editorContext?.stateManager) {
      const nodes = editorContext.stateManager.nodes
      const node = nodes.find(n => n.id === props.nodeId)
      
      // 🔥 详细调试信息
      console.log(`🎯 [InteractionConfigWrapper] StateManager节点查找:`, {
        nodeId: props.nodeId,
        totalNodes: nodes.length,
        nodeFound: !!node,
        hasMetadata: !!node?.metadata,
        hasUnifiedConfig: !!node?.metadata?.unifiedConfig,
        hasInteractionConfig: !!node?.metadata?.unifiedConfig?.interaction,
        interactionConfigs: node?.metadata?.unifiedConfig?.interaction?.configs,
        fullNodeData: node
      })
      
      if (node?.metadata?.unifiedConfig?.interaction?.configs) {
        const configs = node.metadata.unifiedConfig.interaction.configs
        console.log(`🎯 [InteractionConfigWrapper] 从stateManager成功加载配置:`, {
          nodeId: props.nodeId,
          configCount: configs.length,
          configs: configs,
          configTypes: configs.map(c => c.event),
          beforeAssignment: interactionConfigs.value,
        })
        
        interactionConfigs.value = [...configs] // 🔥 使用展开语法确保响应式更新
        
        console.log(`🎯 [InteractionConfigWrapper] 配置赋值后:`, {
          afterAssignment: interactionConfigs.value,
          isReactive: JSON.stringify(interactionConfigs.value) === JSON.stringify(configs)
        })
        
        return // 如果从stateManager成功加载，就不需要再发送事件
      } else {
        console.warn(`🎯 [InteractionConfigWrapper] StateManager中未找到交互配置:`, {
          nodeId: props.nodeId,
          nodeExists: !!node,
          metadataExists: !!node?.metadata,
          unifiedConfigExists: !!node?.metadata?.unifiedConfig,
          interactionExists: !!node?.metadata?.unifiedConfig?.interaction
        })
      }
    } else {
      console.error(`🎯 [InteractionConfigWrapper] EditorContext或StateManager不存在`)
    }
    
    // 如果stateManager中没有配置，则发送配置请求事件给Card2Wrapper
    window.dispatchEvent(new CustomEvent('card2-config-request', {
      detail: {
        componentId: props.nodeId,
        layer: 'interaction'
      }
    }))
    
    console.log(`🎯 [InteractionConfigWrapper] 发送配置请求事件: ${props.nodeId}`)
  } catch (error) {
    console.error('🎯 [InteractionConfigWrapper] 加载交互配置失败:', error)
  }
}

// 监听配置响应事件
const handleConfigResponse = (event: CustomEvent) => {
  const { componentId, layer, config } = event.detail
  if (componentId === props.nodeId && layer === 'interaction') {
    console.log(`🎯 [InteractionConfigWrapper] 接收到配置响应:`, config)
    if (config?.configs && Array.isArray(config.configs)) {
      interactionConfigs.value = config.configs
    }
  }
}

// 处理交互配置更新
const handleInteractionConfigUpdate = (configs: InteractionConfig[]) => {
  console.log(`🎯 [InteractionConfigWrapper] 交互配置更新:`, configs)
  
  try {
    // 🔥 关键修复：直接更新stateManager中的节点配置
    if (editorContext?.stateManager) {
      const nodes = editorContext.stateManager.nodes
      const nodeIndex = nodes.findIndex(n => n.id === props.nodeId)
      if (nodeIndex !== -1) {
        const node = nodes[nodeIndex]
        
        // 确保unifiedConfig结构存在
        if (!node.metadata) node.metadata = {}
        if (!node.metadata.unifiedConfig) node.metadata.unifiedConfig = {}
        if (!node.metadata.unifiedConfig.interaction) node.metadata.unifiedConfig.interaction = {}
        
        // 保存交互配置
        node.metadata.unifiedConfig.interaction.configs = configs
        
        // 触发状态更新
        editorContext.stateManager.setNodes([...nodes])
        
        // 验证保存是否成功
        const verifyNode = editorContext.stateManager.nodes.find(n => n.id === props.nodeId)
        const verifyConfigs = verifyNode?.metadata?.unifiedConfig?.interaction?.configs
        
        console.log(`🎯 [InteractionConfigWrapper] 配置已保存到stateManager:`, {
          nodeId: props.nodeId,
          configCount: configs.length,
          savedConfig: node.metadata.unifiedConfig.interaction,
          verificationPassed: verifyConfigs?.length === configs.length,
          savedConfigsMatch: JSON.stringify(verifyConfigs) === JSON.stringify(configs)
        })
      } else {
        console.warn(`🎯 [InteractionConfigWrapper] 未找到节点:`, props.nodeId)
      }
    }
    
    // 发送配置更新事件给Card2Wrapper（运行时使用）
    window.dispatchEvent(new CustomEvent('card2-config-update', {
      detail: {
        componentId: props.nodeId,
        layer: 'interaction',
        config: { configs }
      }
    }))
    
    console.log(`🎯 [InteractionConfigWrapper] 发送配置更新事件`)
  } catch (error) {
    console.error('🎯 [InteractionConfigWrapper] 保存交互配置失败:', error)
  }
}

// 🔥 调试：监听interactionConfigs变化
watch(() => interactionConfigs.value, (newValue, oldValue) => {
  console.log(`🎯 [InteractionConfigWrapper] 交互配置响应式变化:`, {
    nodeId: props.nodeId,
    oldValue: oldValue,
    newValue: newValue,
    newCount: newValue.length,
    timestamp: Date.now()
  })
}, { deep: true })

// 监听widget变化，重新加载配置
watch(() => props.widget, (newWidget, oldWidget) => {
  console.log(`🎯 [InteractionConfigWrapper] Widget变化触发重新加载:`, {
    nodeId: props.nodeId,
    oldWidget: !!oldWidget,
    newWidget: !!newWidget,
    widgetType: newWidget?.type,
    hasInteractionCapability: !!newWidget?.metadata?.card2Definition?.interactionCapabilities
  })
  loadInteractionConfigs()
}, { immediate: true })

// 监听nodeId变化，防止节点切换时数据不更新
watch(() => props.nodeId, (newNodeId, oldNodeId) => {
  console.log(`🎯 [InteractionConfigWrapper] NodeId变化:`, {
    oldNodeId,
    newNodeId,
    shouldReload: newNodeId !== oldNodeId
  })
  if (newNodeId !== oldNodeId) {
    loadInteractionConfigs()
  }
})

// 生命周期管理

onMounted(() => {
  console.log(`🎯 [InteractionConfigWrapper] 组件挂载开始:`, {
    nodeId: props.nodeId,
    hasWidget: !!props.widget,
    hasEditorContext: !!editorContext
  })
  
  // 监听配置响应事件
  window.addEventListener('card2-config-response', handleConfigResponse as EventListener)
  
  // 🔥 延迟初始化，确保editorContext完全就绪
  nextTick(() => {
    console.log(`🎯 [InteractionConfigWrapper] NextTick后初始化加载配置`)
    loadInteractionConfigs()
  })
  
  console.log(`🎯 [InteractionConfigWrapper] 组件挂载完成: ${props.nodeId}`)
})

onUnmounted(() => {
  // 清理事件监听
  window.removeEventListener('card2-config-response', handleConfigResponse as EventListener)
  console.log(`🎯 [InteractionConfigWrapper] 组件卸载: ${props.nodeId}`)
})
</script>

<style scoped>
.interaction-config-wrapper {
  /* 样式继承自父容器 */
}
</style>