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
    console.log('🔄 setState - 开始恢复状态:', {
      hasNodes: !!config.nodes,
      nodesCount: config.nodes?.length || 0,
      hasComponentConfigurations: !!config.componentConfigurations,
      configsCount: config.componentConfigurations ? Object.keys(config.componentConfigurations).length : 0
    })

    // 重置状态
    dependencies.stateManager.reset()

    // 加载节点
    if (config.nodes && Array.isArray(config.nodes)) {
      console.log('🔄 setState - 加载节点数量:', config.nodes.length)
      config.nodes.forEach((node: any) => {
        dependencies.stateManager.addNode(node)
      })
      console.log('🔄 setState - 节点加载完成，当前节点数:', dependencies.stateManager.nodes.length)
    }

    // 加载视口设置
    if (config.viewport) {
      dependencies.stateManager.updateViewport(config.viewport)
    }

    // 🔥 关键修复：恢复所有组件的配置数据
    if (config.componentConfigurations) {
      try {
        console.log('🔄 setState - 恢复组件配置:', Object.keys(config.componentConfigurations))

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
                console.log(`🔄 setState - 恢复多数据源配置: ${nodeId}`, typedConfig.dataSource.config)
              }

              // 🔥 修复：保留完整配置，不删除 dataSource 字段
              dependencies.configurationManager.setConfiguration(nodeId, typedConfig)

              console.log(`✅ setState - 恢复组件配置成功: ${nodeId}`)
            } catch (configError) {
              console.error(`❌ setState - 恢复组件配置失败: ${nodeId}`, configError)
              // 配置恢复失败不应阻止整个状态恢复过程
            }
          }
        }

        console.log('🎉 setState - 所有组件配置恢复完成')
      } catch (error) {
        console.error('💥 setState - 配置恢复过程失败:', error)
      }
    } else {
      console.log('ℹ️ setState - 没有组件配置需要恢复')
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
      console.log('💾 保存状态 - 节点数量:', dependencies.stateManager.nodes.length)
      console.log('💾 保存状态 - 组件配置数量:', Object.keys(componentConfigurations).length)
      if (dependencies.stateManager.nodes.length > 0) {
        console.log('💾 保存状态 - 第一个组件:', dependencies.stateManager.nodes[0])
      }
    } catch (error) {
      console.error('💾 getState - 收集组件配置失败:', error)
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

    console.log('💾 最终保存状态:', {
      nodesCount: finalState.nodes.length,
      configsCount: Object.keys(finalState.componentConfigurations).length
    })

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
        console.log('组件已卸载，取消数据处理')
        return
      }
      if (data) {
        panelData.value = data
        console.log('📊 获取面板数据成功:', data)
        console.log('📊 配置原始数据:', data.config)

        if (data.config) {
          console.log('📝 解析现有配置:', data.config)
          const config = parseConfig(data.config)
          editorConfig.value = config.visualEditor || getDefaultConfig()
          // 🔥 智能深拷贝：使用优化的smartDeepClone
          preEditorConfig.value = smartDeepClone(editorConfig.value)

          // 加载到编辑器
          setState(editorConfig.value)
          console.log('🎯 加载编辑器配置:', editorConfig.value)
        } else {
          console.log('📝 配置为空，使用默认配置')
          editorConfig.value = getDefaultConfig()
          preEditorConfig.value = smartDeepClone(editorConfig.value)
          setState(editorConfig.value)
        }
        if (!dependencies.isUnmounted.value) {
          dataFetched.value = true
          message.success($t('visualEditor.success'))
        }
      } else {
        console.warn('⚠️ 未获取到面板数据')
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
      console.error('获取面板数据失败:', error)
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
    console.log('🔄 [PanelEditor] 开始初始化面板数据')

    // 加载面板数据
    await fetchBoard()

    console.log('✅ [PanelEditor] 面板数据初始化完成')
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
