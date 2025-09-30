/**
 * Config Engine 与 Visual Editor 集成桥接器
 *
 * 核心功能：
 * 1. 配置引擎与可视化编辑器的深度集成
 * 2. 统一配置管理界面的无缝嵌入
 * 3. 可视化编辑器配置的实时同步
 * 4. 配置模板在编辑器中的应用
 * 5. 配置版本管理的可视化支持
 * 6. 配置验证的实时反馈
 * 7. 配置导入导出的编辑器集成
 * 8. 配置变更的实时预览
 *
 * 设计原则：
 * - 无缝集成：与现有编辑器系统完全兼容
 * - 实时性：配置变更的即时反映
 * - 用户体验：直观的配置管理界面
 * - 性能优化：高效的配置同步机制
 * - 扩展性：支持编辑器功能的持续扩展
 *
 * 创建时间：2025年1月
 * 作者：ThingsPanel Team
 */

import { EventEmitter } from 'events'
import { reactive, ref, computed, watch } from 'vue'
import type { Ref, ComputedRef } from 'vue'

import type {
  ConfigurationItem,
  ConfigurationType,
  ConfigurationTemplate,
  ConfigurationValidationResult,
  ConfigurationOperationResult
} from './types'

import { configEngine } from './index'
import { configurationAPIManager } from './config-api-manager'
import { configurationValidator } from './config-validator'
import { configurationVersionManager } from './config-version-manager'
import { configurationTemplateManager } from './config-template-manager'

/**
 * 编辑器配置状态接口
 * 编辑器中配置的完整状态
 */
interface EditorConfigurationState {
  /** 当前编辑的配置 */
  currentConfig: ConfigurationItem | null
  /** 配置是否有未保存的变更 */
  hasUnsavedChanges: boolean
  /** 配置验证状态 */
  validationState: ConfigurationValidationResult | null
  /** 配置保存状态 */
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  /** 最后保存时间 */
  lastSavedAt: Date | null
  /** 错误信息 */
  error: string | null
}

/**
 * 编辑器配置操作接口
 * 编辑器支持的配置操作
 */
interface EditorConfigurationActions {
  /** 加载配置 */
  loadConfiguration: (id: string) => Promise<void>
  /** 创建新配置 */
  createConfiguration: (type: ConfigurationType, template?: string) => Promise<void>
  /** 保存配置 */
  saveConfiguration: () => Promise<void>
  /** 保存为新版本 */
  saveAsNewVersion: (changelog: string) => Promise<void>
  /** 验证配置 */
  validateConfiguration: () => Promise<void>
  /** 重置配置 */
  resetConfiguration: () => void
  /** 应用模板 */
  applyTemplate: (templateId: string, parameters: Record<string, any>) => Promise<void>
  /** 导出配置 */
  exportConfiguration: () => Promise<void>
  /** 导入配置 */
  importConfiguration: (data: any) => Promise<void>
}

/**
 * 编辑器历史记录接口
 * 编辑器的撤销重做功能
 */
interface EditorHistory {
  /** 历史记录栈 */
  history: ConfigurationItem[]
  /** 当前位置 */
  currentIndex: number
  /** 最大历史记录数 */
  maxHistorySize: number
  /** 是否可以撤销 */
  canUndo: boolean
  /** 是否可以重做 */
  canRedo: boolean
}

/**
 * 编辑器配置面板状态接口
 * 配置面板的UI状态
 */
interface ConfigurationPanelState {
  /** 面板是否显示 */
  visible: boolean
  /** 当前活跃的标签页 */
  activeTab: 'basic' | 'advanced' | 'validation' | 'history' | 'templates'
  /** 面板宽度 */
  width: number
  /** 面板是否固定 */
  pinned: boolean
  /** 面板最小化状态 */
  minimized: boolean
}

/**
 * 🎨 Visual Editor 配置集成管理器
 *
 * 提供配置引擎与可视化编辑器的完整集成功能
 *
 * 主要功能：
 * - 配置状态的响应式管理
 * - 编辑器配置操作的统一接口
 * - 配置验证的实时反馈
 * - 配置历史的可视化管理
 * - 配置模板的便捷应用
 * - 配置导入导出的集成
 */
export class VisualEditorConfigurationIntegration extends EventEmitter {
  /** 🎨 响应式配置状态 */
  public readonly state = reactive<EditorConfigurationState>({
    currentConfig: null,
    hasUnsavedChanges: false,
    validationState: null,
    saveState: 'idle',
    lastSavedAt: null,
    error: null
  })

  /** 🎨 响应式配置面板状态 */
  public readonly panelState = reactive<ConfigurationPanelState>({
    visible: false,
    activeTab: 'basic',
    width: 350,
    pinned: false,
    minimized: false
  })

  /** 📚 响应式编辑器历史记录 */
  public readonly history = reactive<EditorHistory>({
    history: [],
    currentIndex: -1,
    maxHistorySize: 50,
    canUndo: false,
    canRedo: false
  })

  /** 🎯 可用模板列表 */
  public readonly availableTemplates: Ref<ConfigurationTemplate[]> = ref([])

  /** 🔍 配置搜索结果 */
  public readonly searchResults: Ref<ConfigurationItem[]> = ref([])

  /** ⚡ 实时验证开关 */
  public readonly realtimeValidation: Ref<boolean> = ref(true)

  /** 💾 自动保存开关 */
  public readonly autoSave: Ref<boolean> = ref(true)

  /** ⏱️ 自动保存间隔（毫秒） */
  public readonly autoSaveInterval: Ref<number> = ref(30000) // 30秒

  /** ⏱️ 自动保存定时器 */
  private autoSaveTimer: NodeJS.Timeout | null = null

  /** 🔄 配置同步锁 */
  private syncInProgress = false

  constructor() {
    super()

    // 初始化响应式数据监听
    this.initializeReactiveWatchers()

    // 初始化配置引擎事件监听
    this.initializeConfigEngineListeners()

    // 初始化自动保存
    this.initializeAutoSave()

    // 加载可用模板
    this.loadAvailableTemplates()

  }

  // ===== 🎯 配置操作接口 =====

  /**
   * 📋 配置操作集合
   * 提供编辑器中所有配置相关操作的统一接口
   */
  public readonly actions: EditorConfigurationActions = {
    /**
     * 📋 加载配置
     */
    loadConfiguration: async (id: string): Promise<void> => {
      try {
        this.state.saveState = 'saving' // 使用 saving 状态表示加载中
        this.state.error = null

        // 🔍 从配置引擎获取配置
        const config = configEngine.getConfiguration(id)
        if (!config) {
          throw new Error(`配置不存在: ${id}`)
        }

        // 📝 设置当前配置
        this.setCurrentConfiguration(config)

        // ✅ 验证配置
        if (this.realtimeValidation.value) {
          await this.actions.validateConfiguration()
        }

        // 📚 添加到历史记录
        this.addToHistory(config)

        this.state.saveState = 'saved'

      } catch (error) {
        this.state.error = error instanceof Error ? error.message : '配置加载失败'
        this.state.saveState = 'error'
        console.error(`❌ [EditorIntegration] 配置加载失败: ${id}`, error)
      }
    },

    /**
     * 🔨 创建新配置
     */
    createConfiguration: async (type: ConfigurationType, templateId?: string): Promise<void> => {
      try {
        this.state.saveState = 'saving'
        this.state.error = null

        let newConfig: ConfigurationItem

        if (templateId) {
          // 🎨 使用模板创建
          const template = this.availableTemplates.value.find(t => t.id === templateId)
          if (!template) {
            throw new Error(`模板不存在: ${templateId}`)
          }

          // 📝 创建基础参数
          const parameters: Record<string, any> = {}
          template.parameters.forEach(param => {
            parameters[param.name] = param.defaultValue
          })

          const renderResult = await configurationTemplateManager.createConfigurationFromTemplate(
            templateId,
            {
              parameters,
              environment: 'development',
              timestamp: new Date()
            }
          )

          if (!renderResult.success || !renderResult.data) {
            throw new Error(renderResult.error || '模板配置创建失败')
          }

          newConfig = renderResult.data
        } else {
          // 🔨 创建空白配置
          newConfig = {
            id: `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: '新配置',
            type,
            version: '1.0.0',
            status: 'draft' as any,
            priority: 5 as any,
            tags: [],
            target: ['development'],
            data: {},
            metadata: {
              creator: '用户',
              source: 'visual-editor',
              isSystemConfig: false
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }

        // 📝 设置当前配置
        this.setCurrentConfiguration(newConfig)
        this.state.hasUnsavedChanges = true

        // 📚 添加到历史记录
        this.addToHistory(newConfig)

        this.state.saveState = 'idle'

      } catch (error) {
        this.state.error = error instanceof Error ? error.message : '配置创建失败'
        this.state.saveState = 'error'
        console.error(`❌ [EditorIntegration] 配置创建失败`, error)
      }
    },

    /**
     * 💾 保存配置
     */
    saveConfiguration: async (): Promise<void> => {
      if (!this.state.currentConfig) return

      try {
        this.state.saveState = 'saving'
        this.state.error = null

        // ✅ 验证配置
        const validation = await configurationValidator.validateConfiguration(this.state.currentConfig)
        if (!validation.isValid) {
          throw new Error(`配置验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
        }

        // 💾 保存到配置引擎
        const saveResult = await configurationAPIManager.updateConfiguration(
          this.state.currentConfig.id,
          this.state.currentConfig
        )

        if (!saveResult.success) {
          throw new Error(saveResult.error || '配置保存失败')
        }

        // 📝 更新状态
        this.state.hasUnsavedChanges = false
        this.state.lastSavedAt = new Date()
        this.state.saveState = 'saved'

        // 🚀 触发保存事件
        this.emit('configuration-saved', {
          config: this.state.currentConfig,
          timestamp: new Date()
        })


      } catch (error) {
        this.state.error = error instanceof Error ? error.message : '配置保存失败'
        this.state.saveState = 'error'
        console.error(`❌ [EditorIntegration] 配置保存失败`, error)
      }
    },

    /**
     * 📚 保存为新版本
     */
    saveAsNewVersion: async (changelog: string): Promise<void> => {
      if (!this.state.currentConfig) return

      try {
        this.state.saveState = 'saving'
        this.state.error = null

        // 📚 创建新版本
        const versionResult = await configurationVersionManager.createVersion(
          this.state.currentConfig,
          changelog,
          'minor',
          '用户'
        )

        if (!versionResult.success) {
          throw new Error(versionResult.error || '版本创建失败')
        }

        // 💾 保存配置
        await this.actions.saveConfiguration()


      } catch (error) {
        this.state.error = error instanceof Error ? error.message : '版本创建失败'
        this.state.saveState = 'error'
        console.error(`❌ [EditorIntegration] 版本创建失败`, error)
      }
    },

    /**
     * ✅ 验证配置
     */
    validateConfiguration: async (): Promise<void> => {
      if (!this.state.currentConfig) return

      try {
        const validation = await configurationValidator.validateConfiguration(this.state.currentConfig)
        this.state.validationState = validation

        // 🚀 触发验证事件
        this.emit('configuration-validated', {
          config: this.state.currentConfig,
          validation,
          timestamp: new Date()
        })


      } catch (error) {
        console.error(`❌ [EditorIntegration] 配置验证失败`, error)
      }
    },

    /**
     * 🔄 重置配置
     */
    resetConfiguration: (): void => {
      this.state.currentConfig = null
      this.state.hasUnsavedChanges = false
      this.state.validationState = null
      this.state.saveState = 'idle'
      this.state.lastSavedAt = null
      this.state.error = null

      // 📚 清空历史记录
      this.history.history.length = 0
      this.history.currentIndex = -1
      this.updateHistoryState()

    },

    /**
     * 🎨 应用模板
     */
    applyTemplate: async (templateId: string, parameters: Record<string, any>): Promise<void> => {
      try {
        this.state.saveState = 'saving'
        this.state.error = null

        // 🎨 渲染模板
        const renderResult = await configurationTemplateManager.createConfigurationFromTemplate(
          templateId,
          {
            parameters,
            environment: 'development',
            timestamp: new Date()
          }
        )

        if (!renderResult.success || !renderResult.data) {
          throw new Error(renderResult.error || '模板应用失败')
        }

        // 📝 应用到当前配置
        this.setCurrentConfiguration(renderResult.data)
        this.state.hasUnsavedChanges = true

        // 📚 添加到历史记录
        this.addToHistory(renderResult.data)

        this.state.saveState = 'idle'

      } catch (error) {
        this.state.error = error instanceof Error ? error.message : '模板应用失败'
        this.state.saveState = 'error'
        console.error(`❌ [EditorIntegration] 模板应用失败: ${templateId}`, error)
      }
    },

    /**
     * 📤 导出配置
     */
    exportConfiguration: async (): Promise<void> => {
      if (!this.state.currentConfig) return

      try {
        const exportResult = await configurationTemplateManager.exportConfigurations(
          [this.state.currentConfig],
          {
            format: 'json' as any,
            scope: {},
            includeMetadata: true,
            includeHistory: false,
            compress: false
          }
        )

        if (!exportResult.success) {
          throw new Error(exportResult.error || '配置导出失败')
        }

        // 🚀 触发导出事件
        this.emit('configuration-exported', {
          config: this.state.currentConfig,
          exportData: exportResult.data,
          timestamp: new Date()
        })


      } catch (error) {
        this.state.error = error instanceof Error ? error.message : '配置导出失败'
        console.error(`❌ [EditorIntegration] 配置导出失败`, error)
      }
    },

    /**
     * 📥 导入配置
     */
    importConfiguration: async (data: any): Promise<void> => {
      try {
        this.state.saveState = 'saving'
        this.state.error = null

        // 📥 导入配置
        const importResult = await configurationTemplateManager.importConfigurations(
          data,
          {
            format: 'json' as any,
            conflictResolution: 'overwrite',
            validate: true,
            createBackup: true
          }
        )

        if (!importResult.success || importResult.successCount === 0) {
          throw new Error('配置导入失败')
        }

        // 📝 如果只有一个配置，设置为当前配置
        if (importResult.successCount === 1) {
          // 这里需要从导入结果中获取实际的配置对象
          // 暂时模拟
        }

        this.state.saveState = 'saved'

      } catch (error) {
        this.state.error = error instanceof Error ? error.message : '配置导入失败'
        this.state.saveState = 'error'
        console.error(`❌ [EditorIntegration] 配置导入失败`, error)
      }
    }
  }

  // ===== 🎨 面板管理功能 =====

  /**
   * 👁️ 显示配置面板
   */
  showConfigurationPanel(): void {
    this.panelState.visible = true
    this.emit('panel-visibility-changed', { visible: true })
  }

  /**
   * 🙈 隐藏配置面板
   */
  hideConfigurationPanel(): void {
    this.panelState.visible = false
    this.emit('panel-visibility-changed', { visible: false })
  }

  /**
   * 🔄 切换配置面板显示
   */
  toggleConfigurationPanel(): void {
    this.panelState.visible = !this.panelState.visible
    this.emit('panel-visibility-changed', { visible: this.panelState.visible })
  }

  /**
   * 📋 切换面板标签页
   */
  setActiveTab(tab: ConfigurationPanelState['activeTab']): void {
    this.panelState.activeTab = tab
    this.emit('panel-tab-changed', { activeTab: tab })
  }

  // ===== 📚 历史记录管理 =====

  /**
   * ⏪ 撤销操作
   */
  undo(): void {
    if (!this.history.canUndo) return

    this.history.currentIndex--
    const previousConfig = this.history.history[this.history.currentIndex]

    if (previousConfig) {
      this.setCurrentConfiguration({ ...previousConfig }, false) // 不添加到历史记录
      this.updateHistoryState()

      this.emit('configuration-undo', {
        config: previousConfig,
        timestamp: new Date()
      })

    }
  }

  /**
   * ⏩ 重做操作
   */
  redo(): void {
    if (!this.history.canRedo) return

    this.history.currentIndex++
    const nextConfig = this.history.history[this.history.currentIndex]

    if (nextConfig) {
      this.setCurrentConfiguration({ ...nextConfig }, false) // 不添加到历史记录
      this.updateHistoryState()

      this.emit('configuration-redo', {
        config: nextConfig,
        timestamp: new Date()
      })

    }
  }

  // ===== 🔒 私有辅助方法 =====

  /**
   * 📝 设置当前配置
   */
  private setCurrentConfiguration(config: ConfigurationItem, addToHistory: boolean = true): void {
    this.state.currentConfig = { ...config }
    this.state.hasUnsavedChanges = false

    if (addToHistory) {
      this.addToHistory(config)
    }

    // 🚀 触发配置变更事件
    this.emit('current-configuration-changed', {
      config: this.state.currentConfig,
      timestamp: new Date()
    })
  }

  /**
   * 📚 添加到历史记录
   */
  private addToHistory(config: ConfigurationItem): void {
    // 移除当前位置后的所有历史记录
    this.history.history.splice(this.history.currentIndex + 1)

    // 添加新的历史记录
    this.history.history.push({ ...config })
    this.history.currentIndex = this.history.history.length - 1

    // 限制历史记录大小
    if (this.history.history.length > this.history.maxHistorySize) {
      this.history.history.shift()
      this.history.currentIndex--
    }

    this.updateHistoryState()
  }

  /**
   * 📚 更新历史记录状态
   */
  private updateHistoryState(): void {
    this.history.canUndo = this.history.currentIndex > 0
    this.history.canRedo = this.history.currentIndex < this.history.history.length - 1
  }

  /**
   * 🔄 初始化响应式数据监听
   */
  private initializeReactiveWatchers(): void {
    // 监听当前配置变更
    watch(
      () => this.state.currentConfig,
      (newConfig) => {
        if (newConfig && this.realtimeValidation.value) {
          // 延迟验证，避免频繁触发
          setTimeout(() => {
            this.actions.validateConfiguration()
          }, 500)
        }
      },
      { deep: true }
    )

    // 监听自动保存设置
    watch(
      [() => this.autoSave.value, () => this.autoSaveInterval.value],
      () => {
        this.initializeAutoSave()
      }
    )
  }

  /**
   * 🎧 初始化配置引擎事件监听
   */
  private initializeConfigEngineListeners(): void {
    // 监听配置变更
    configEngine.on('configuration-updated', (event) => {
      if (this.state.currentConfig && event.id === this.state.currentConfig.id && !this.syncInProgress) {
        // 配置被外部更新，提示用户
        this.emit('external-configuration-change', {
          configId: event.id,
          timestamp: new Date()
        })
      }
    })

    // 监听配置删除
    configEngine.on('configuration-deleted', (event) => {
      if (this.state.currentConfig && event.id === this.state.currentConfig.id) {
        // 当前配置被删除，清空编辑器
        this.actions.resetConfiguration()
        this.emit('current-configuration-deleted', {
          configId: event.id,
          timestamp: new Date()
        })
      }
    })
  }

  /**
   * ⏰ 初始化自动保存
   */
  private initializeAutoSave(): void {
    // 清除现有定时器
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }

    // 启用自动保存
    if (this.autoSave.value) {
      this.autoSaveTimer = setInterval(() => {
        if (this.state.hasUnsavedChanges && this.state.currentConfig && this.state.saveState === 'idle') {
          this.actions.saveConfiguration()
        }
      }, this.autoSaveInterval.value)
    }
  }

  /**
   * 📋 加载可用模板
   */
  private loadAvailableTemplates(): void {
    const templates = configurationTemplateManager.getAvailableTemplates()
    this.availableTemplates.value = templates
  }

  /**
   * 🧹 清理资源
   */
  destroy(): void {
    // 清除自动保存定时器
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }

    // 移除所有事件监听器
    this.removeAllListeners()

  }
}

/**
 * 🌟 创建 Visual Editor 配置集成实例
 *
 * 提供全局单例模式的集成管理器
 */
export const visualEditorConfigurationIntegration = new VisualEditorConfigurationIntegration()

/**
 * 🎨 Vue 组合式函数：使用编辑器配置集成
 *
 * 为 Vue 组件提供便捷的配置集成功能
 *
 * @returns 配置集成的响应式状态和操作方法
 */
export function useEditorConfigurationIntegration() {
  const integration = visualEditorConfigurationIntegration

  // 计算属性
  const isConfigurationLoaded = computed(() => integration.state.currentConfig !== null)
  const canSave = computed(() => integration.state.hasUnsavedChanges && integration.state.saveState !== 'saving')
  const isValidConfiguration = computed(() =>
    integration.state.validationState?.isValid ?? true
  )

  return {
    // 状态
    state: integration.state,
    panelState: integration.panelState,
    history: integration.history,
    availableTemplates: integration.availableTemplates,

    // 计算属性
    isConfigurationLoaded,
    canSave,
    isValidConfiguration,

    // 操作方法
    actions: integration.actions,

    // 面板管理
    showConfigurationPanel: integration.showConfigurationPanel.bind(integration),
    hideConfigurationPanel: integration.hideConfigurationPanel.bind(integration),
    toggleConfigurationPanel: integration.toggleConfigurationPanel.bind(integration),
    setActiveTab: integration.setActiveTab.bind(integration),

    // 历史记录
    undo: integration.undo.bind(integration),
    redo: integration.redo.bind(integration),

    // 设置
    realtimeValidation: integration.realtimeValidation,
    autoSave: integration.autoSave,
    autoSaveInterval: integration.autoSaveInterval
  }
}

// 🔧 调试支持：将集成管理器暴露到全局作用域
if (typeof window !== 'undefined') {
  ;(window as any).visualEditorConfigurationIntegration = visualEditorConfigurationIntegration
  ;(window as any).useEditorConfigurationIntegration = useEditorConfigurationIntegration
}

