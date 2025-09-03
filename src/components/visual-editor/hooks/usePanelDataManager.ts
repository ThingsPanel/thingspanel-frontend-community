/**
 * 面板编辑器数据管理组合式函数
 * 负责面板数据加载、状态管理、配置存储
 */

import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { getBoard } from '@/service/api'
import { $t } from '@/locales'
import { smartDeepClone } from '@/utils/deep-clone'
import { usePanelConfigManager } from './usePanelConfigManager'
import type { Panel } from '#/entity'

/**
 * 数据管理相关函数集合
 */
export function usePanelDataManager(
  props: { panelId: string },
  dependencies: {
    stateManager: any
    configurationManager: any
    multiDataSourceConfigStore: any
    isUnmounted: any
  }
) {
  const message = useMessage()
  const { parseConfig, getDefaultConfig } = usePanelConfigManager()

  // 面板数据状态
  const panelData = ref<Panel.Board>()
  const dataFetched = ref(false)
  const editorConfig = ref<any>({})
  const preEditorConfig = ref<any>({})

  /**
   * 恢复编辑器状态
   * 从配置对象中恢复编辑器的完整状态
   */
  const setState = (config: any) => {
    // 重置状态
    dependencies.stateManager.reset()

    // 加载节点
    if (config.nodes && Array.isArray(config.nodes)) {
      config.nodes.forEach((node: any) => {
        dependencies.stateManager.addNode(node)
      })
    }

    // 加载视口设置
    if (config.viewport) {
      dependencies.stateManager.updateViewport(config.viewport)
    }

    // 🔥 关键修复：恢复所有组件的配置数据
    if (config.componentConfigurations) {
      try {
        // 恢复每个组件的配置
        for (const [nodeId, nodeConfig] of Object.entries(config.componentConfigurations)) {
          if (nodeConfig && typeof nodeConfig === 'object') {
            try {
              // 🔥 关键修复：分离和恢复 multiDataSourceConfigStore 数据
              const typedConfig = nodeConfig as any

              // 检查是否有数据源配置需要恢复
              if (typedConfig.dataSource?.type === 'data-mapping' && typedConfig.dataSource?.config) {
                // 恢复到 multiDataSourceConfigStore
                dependencies.multiDataSourceConfigStore.value[nodeId] = typedConfig.dataSource.config
              }

              // 🔥 修复：保留完整配置，不删除 dataSource 字段
              dependencies.configurationManager.setConfiguration(nodeId, typedConfig)
            } catch (configError) {
              // 配置恢复失败不应阻止整个状态恢复过程
            }
          }
        }
      } catch (error) {
      }
    } else {
    }
  }

  /**
   * 获取当前编辑器状态
   * 收集所有组件配置和编辑器状态用于保存
   */
  const getState = () => {
    // 收集所有组件的配置数据
    const componentConfigurations: Record<string, any> = {}
    try {
      // 遍历所有节点，收集它们的配置
      for (const node of dependencies.stateManager.nodes) {
        const config = dependencies.configurationManager.getConfiguration(node.id)
        if (config) {
          // 🔥 关键修复：集成 multiDataSourceConfigStore 的数据
          const nodeId = node.id
          const multiDataSourceConfig = dependencies.multiDataSourceConfigStore.value[nodeId]

          if (multiDataSourceConfig) {
            // 将多数据源配置合并到 dataSource 字段中
            const enhancedConfig = {
              ...config,
              dataSource: {
                type: 'data-mapping',
                enabled: true,
                config: multiDataSourceConfig,
                metadata: {
                  componentType: node.type,
                  mappingType: 'json-path',
                  updatedAt: Date.now()
                }
              }
            }
            componentConfigurations[nodeId] = enhancedConfig
          } else {
            componentConfigurations[nodeId] = config
          }
        }
      }
     
    } catch (error) {
    }

    const finalState = {
      nodes: dependencies.stateManager.nodes,
      canvasConfig: editorConfig.value.canvasConfig || {},
      gridConfig: editorConfig.value.gridConfig || {},
      viewport: dependencies.stateManager.viewport,
      mode: dependencies.stateManager.mode,
      // 🔥 关键修复：包含所有组件的配置数据
      componentConfigurations: componentConfigurations
    }
    return finalState
  }

  /**
   * 获取面板数据并初始化编辑器
   * 从API加载面板数据，解析配置，并恢复编辑器状态
   */
  const fetchBoard = async () => {
    try {
      const { data } = await getBoard(props.panelId)
      // 检查组件是否已经卸载
      if (dependencies.isUnmounted.value) {
        return
      }
      if (data) {
        panelData.value = data

        if (data.config) {
          const config = parseConfig(data.config)
          editorConfig.value = config.visualEditor || getDefaultConfig()
          // 🔥 智能深拷贝：使用优化的smartDeepClone
          preEditorConfig.value = smartDeepClone(editorConfig.value)

          // 加载到编辑器
          setState(editorConfig.value)
        } else {
          editorConfig.value = getDefaultConfig()
          preEditorConfig.value = smartDeepClone(editorConfig.value)
          setState(editorConfig.value)
        }
        if (!dependencies.isUnmounted.value) {
          dataFetched.value = true
          message.success($t('visualEditor.success'))
        }
      } else {
        if (!dependencies.isUnmounted.value) {
          message.warning($t('visualEditor.warning'))
        }

        // 即使没有数据也要初始化默认配置
        editorConfig.value = getDefaultConfig()
        preEditorConfig.value = smartDeepClone(editorConfig.value)
        setState(editorConfig.value)
        if (!dependencies.isUnmounted.value) {
          dataFetched.value = true
        }
      }
    } catch (error: any) {
      if (!dependencies.isUnmounted.value) {
        message.warning($t('visualEditor.warning'))
      }

      // 出错时也要初始化默认配置，让编辑器能正常工作
      editorConfig.value = getDefaultConfig()
      // 🔥 智能深拷贝：使用优化的smartDeepClone
      preEditorConfig.value = smartDeepClone(editorConfig.value)
      setState(editorConfig.value)
      if (!dependencies.isUnmounted.value) {
        dataFetched.value = true
      }
    }
  }

  /**
   * 初始化面板数据和相关配置
   * 加载面板数据并完成基本初始化
   */
  const initializePanelData = async () => {
    // 加载面板数据
    await fetchBoard()
  }

  return {
    // 状态变量
    panelData,
    dataFetched,
    editorConfig,
    preEditorConfig,

    // 数据管理函数
    setState,
    getState,
    fetchBoard,
    initializePanelData
  }
}
