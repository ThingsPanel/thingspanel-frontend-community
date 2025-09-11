/**
 * 面板编辑器配置管理组合式函数
 * 负责配置解析、验证、迁移和默认配置生成
 */

import type { RendererType } from '@/components/visual-editor/types'

/**
 * 配置管理相关函数集合
 */
export function usePanelConfigManager() {
  /**
   * 解析配置字符串
   * 支持新旧格式兼容性处理
   */
  const parseConfig = (configString: string) => {
    try {
      const config = JSON.parse(configString)

      // 检查是否为新格式
      if (typeof config === 'object' && config.visualEditor) {
        // 验证配置格式
        const validatedConfig = validateConfig(config)
        return validatedConfig
      }

      // 🔥 修复：兼容直接格式 {widgets: [...], config: {...}}
      if (config.widgets !== undefined || config.config !== undefined) {
        // 直接格式，直接返回
        return {
          legacyComponents: [],
          visualEditor: config // 直接使用，不包装
        }
      }

      // 🔥 兼容更老的数组格式
      if (Array.isArray(config)) {
        return {
          legacyComponents: [],
          visualEditor: {
            widgets: config,
            config: { gridConfig: {}, canvasConfig: {} }
          }
        }
      }

      // 未知格式，使用默认配置
      return {
        legacyComponents: [],
        visualEditor: getDefaultConfig()
      }
    } catch (error: any) {
      return {
        legacyComponents: [],
        visualEditor: getDefaultConfig()
      }
    }
  }

  /**
   * 验证配置格式
   * 确保配置项完整性并补充缺失项
   */
  const validateConfig = (config: any) => {
    const defaultConfig = getDefaultConfig()

    // 确保 visualEditor 存在
    if (!config.visualEditor) {
      config.visualEditor = defaultConfig
      return config
    }

    // 验证并补充缺失的配置项
    const visualEditor = config.visualEditor

    // 确保基本配置项存在
    if (!visualEditor.nodes) visualEditor.nodes = defaultConfig.nodes
    if (!visualEditor.canvasConfig) visualEditor.canvasConfig = defaultConfig.canvasConfig
    if (!visualEditor.gridConfig) visualEditor.gridConfig = defaultConfig.gridConfig
    if (!visualEditor.viewport) visualEditor.viewport = defaultConfig.viewport
    if (!visualEditor.currentRenderer) visualEditor.currentRenderer = defaultConfig.currentRenderer
    if (!visualEditor.showWidgetTitles) visualEditor.showWidgetTitles = defaultConfig.showWidgetTitles
    if (!visualEditor.showLeftDrawer) visualEditor.showLeftDrawer = defaultConfig.showLeftDrawer
    if (!visualEditor.showRightDrawer) visualEditor.showRightDrawer = defaultConfig.showRightDrawer

    // 确保 legacyComponents 存在
    if (!config.legacyComponents) {
      config.legacyComponents = []
    }

    // 执行配置迁移
    const migratedConfig = migrateConfig(config)

    return migratedConfig
  }

  /**
   * 配置迁移函数
   * 处理不同版本间的配置格式升级
   */
  const migrateConfig = (config: any) => {
    const visualEditor = config.visualEditor

    // 检查版本并执行迁移
    const version = visualEditor.metadata?.version || '0.0.0'

    // 从 v0.x 迁移到 v1.0
    if (version.startsWith('0.')) {
      // 添加缺失的配置项
      if (!visualEditor.currentRenderer) {
        visualEditor.currentRenderer = 'gridstack'
      }
      if (!visualEditor.showWidgetTitles) {
        visualEditor.showWidgetTitles = true
      }
      if (!visualEditor.showLeftDrawer) {
        visualEditor.showLeftDrawer = false
      }
      if (!visualEditor.showRightDrawer) {
        visualEditor.showRightDrawer = false
      }

      // 更新版本信息
      if (!visualEditor.metadata) {
        visualEditor.metadata = {}
      }
      visualEditor.metadata.version = '1.0.0'
      visualEditor.metadata.migratedAt = Date.now()
    }

    return config
  }

  /**
   * 获取默认配置
   * 生成编辑器的默认配置对象
   */
  const getDefaultConfig = () => {
    const config = {
      nodes: [],
      canvasConfig: {
        width: 1200,
        height: 800,
        showGrid: true,
        backgroundColor: '#f5f5f5'
      },
      gridConfig: {
        colNum: 24,
        rowHeight: 80,
        margin: [10, 10],
        isDraggable: true,
        isResizable: true,
        staticGrid: false
      },
      viewport: {},
      // 默认渲染器类型和编辑器状态
      currentRenderer: 'gridstack' as RendererType,
      showWidgetTitles: true,
      showLeftDrawer: false,
      showRightDrawer: false,
      // 新增：默认编辑状态
      isEditing: false,
      selectedNodeId: '',
      isDragging: false,
      draggedComponent: null
    }

    // 🔥 调试：分析配置对象的可克隆性
    const cloneabilityIssues = analyzeCloneability(config)
    if (cloneabilityIssues.length > 0) {
    }

    return config
  }

  /**
   * 🔥 调试：分析structuredClone失败的具体原因
   * 检查对象的可克隆性，识别不能被结构化克隆的属性
   */
  const analyzeCloneability = (obj: any, path = 'root'): string[] => {
    const issues: string[] = []

    if (obj === null || obj === undefined) return issues

    if (typeof obj === 'function') {
      issues.push(`${path}: function`)
      return issues
    }

    if (obj instanceof Error) {
      issues.push(`${path}: Error object`)
      return issues
    }

    if (typeof obj === 'object') {
      // 检查是否是Vue响应式对象
      if (obj.__v_isReactive || obj.__v_isReadonly || obj.__v_isRef) {
        issues.push(`${path}: Vue reactive object`)
        return issues
      }

      // 检查原型链
      if (obj.constructor !== Object && obj.constructor !== Array) {
        issues.push(`${path}: Custom class instance (${obj.constructor.name})`)
      }

      // 递归检查属性
      for (const [key, value] of Object.entries(obj)) {
        issues.push(...analyzeCloneability(value, `${path}.${key}`))
      }
    }

    return issues
  }

  return {
    // 配置解析和验证
    parseConfig,
    validateConfig,
    migrateConfig,
    getDefaultConfig,
    analyzeCloneability
  }
}
