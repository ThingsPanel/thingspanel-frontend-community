/**
 * Card 2.1 属性处理 Hook
 * 提供简化的数据绑定和属性管理
 * 
 * 🔥 统一配置管理架构：所有配置先归集到卡片级别，编辑器仅作为显示层
 */

import { computed, ref, watch, type Ref } from 'vue'
import { inject } from 'vue'
import { DataSourceMapper } from '@/card2.1/core/data-source-mapper'

/**
 * Card 2.1 统一配置接口
 * 包含所有配置类型：基础配置、组件配置、数据源配置、交互配置
 */
export interface UnifiedCard2Configuration {
  /** 基础配置 - 布局、尺寸、位置等 */
  base?: Record<string, unknown>
  /** 组件配置 - 组件特定的属性和设置 */
  component?: Record<string, unknown>
  /** 数据源配置 - 数据绑定和来源配置 */
  dataSource?: Record<string, unknown>
  /** 交互配置 - 组件间交互和行为配置 */
  interaction?: Record<string, unknown>
  /** 组件ID - 用于配置管理和持久化 */
  componentId?: string
}

/**
 * 增强的 Card 2.1 属性 Hook
 * 统一管理所有配置类型，支持配置更新和持久化
 */
export function useCard2Props<T = Record<string, unknown>>(props: {
  config: T
  data?: Record<string, unknown>
  componentId?: string
  // 🔥 新增：接收编辑器的统一配置
  editorUnifiedConfig?: UnifiedCard2Configuration
}) {
  // 🔥 注入编辑器上下文，用于配置同步
  const editorContext = inject('editorContext', null) as any
  
  // 配置响应式引用
  const config = computed(() => props.config)
  
  // 🔥 显示数据响应式引用 - 集成数据源映射
  const displayData = computed(() => {
    // 如果没有 componentId，无法获取组件类型，回退到原始数据
    if (!props.componentId) {
      return props.data || {}
    }
    
    // 尝试获取组件类型
    let componentType = props.componentId
    if (editorContext?.getNodeById) {
      const node = editorContext.getNodeById(props.componentId)
      componentType = node?.type || props.componentId
    }
    
    // 使用数据源映射器处理数据
    const mappedData = DataSourceMapper.mapDataSources(componentType, props.data as any)
    
    // 将映射后的数据与配置合并，数据源数据优先级更高
    return {
      ...props.config, // 配置作为默认值
      ...mappedData    // 数据源数据覆盖配置
    }
  })
  
  // 🔥 统一配置状态 - 所有配置集中管理，优先使用编辑器的统一配置
  const unifiedConfig = ref<UnifiedCard2Configuration>({
    base: props.editorUnifiedConfig?.base || {},
    component: props.editorUnifiedConfig?.component || { ...props.config },
    dataSource: props.editorUnifiedConfig?.dataSource || {},
    interaction: props.editorUnifiedConfig?.interaction || {},
    componentId: props.componentId
  })
  
  // 🔥 调试：输出统一配置初始化信息
  console.log(`🔥 [useCard2Props] 统一配置初始化 ${props.componentId}:`, {
    hasEditorConfig: !!props.editorUnifiedConfig,
    editorDataSource: props.editorUnifiedConfig?.dataSource,
    finalDataSource: unifiedConfig.value.dataSource
  })
  
  // 🔥 配置更新函数 - 支持部分更新
  const updateUnifiedConfig = (partialConfig: Partial<UnifiedCard2Configuration>) => {
    unifiedConfig.value = {
      ...unifiedConfig.value,
      ...partialConfig
    }
    
    // 🔥 同步到编辑器上下文（如果存在）
    // 注意：这里会触发stateManager.nodes的更新，可能导致循环依赖
    // 在PanelEditorV2中已经通过watch监听stateManager.nodes，这里需要谨慎处理
    if (editorContext?.updateNode && props.componentId) {
      const currentNode = editorContext.getNodeById(props.componentId)
      if (currentNode) {
        // 只有当配置确实发生变化时才更新，避免不必要的递归
        const currentUnifiedConfig = currentNode.metadata?.unifiedConfig
        if (JSON.stringify(currentUnifiedConfig) !== JSON.stringify(unifiedConfig.value)) {
          editorContext.updateNode(props.componentId, {
            properties: unifiedConfig.value.component || {},
            metadata: {
              ...currentNode.metadata,
              unifiedConfig: unifiedConfig.value,
              updatedAt: Date.now()
            }
          })
        }
      }
    }
  }
  
  // 🔥 监听外部配置变化
  watch(() => props.config, (newConfig) => {
    if (newConfig && typeof newConfig === 'object') {
      updateUnifiedConfig({ component: { ...newConfig } })
    }
  }, { deep: true, immediate: true })
  
  // 🔥 获取完整配置（用于持久化和导出）
  const getFullConfiguration = () => {
    return { ...unifiedConfig.value }
  }
  
  // 🔥 配置变更事件发射器
  const emitConfigUpdate = (event: 'update:config', config: any) => {
    // 这里可以通过事件总线或其他机制通知配置变更
    // 目前通过返回值让组件自行处理
  }
  
  return {
    config,
    displayData,
    // 🔥 新增统一配置管理功能
    unifiedConfig: computed(() => unifiedConfig.value),
    updateUnifiedConfig,
    getFullConfiguration,
    emitConfigUpdate
  }
}