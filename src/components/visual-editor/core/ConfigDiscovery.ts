/**
 * 配置组件自动发现机制
 * 自动扫描和注册所有配置组件，支持多种配置组件格式
 */

import { defineAsyncComponent, type Component } from 'vue'
import { configRegistry } from '../settings/ConfigRegistry'
import componentRegistry from '@/card2.1'
import type { IComponentDefinition, IConfigComponent } from '@/card2.1/core/types'
import { createLogger } from '@/utils/logger'

const logger = createLogger('ConfigDiscovery')

// ====== 配置组件路径模式 ======

// Card 2.1 配置组件路径
const CARD21_CONFIG_PATTERNS = [
  './src/card2.1/components/*/*/card-config.vue',
  './src/card2.1/components/*/*/config.vue',
  './src/card2.1/components/*/*/*-config.vue'
]

// 原始 Panel 配置组件路径
const LEGACY_CONFIG_PATTERNS = [
  './src/card/builtin-card/*/component.vue', // 内置卡片没有单独配置
  './src/card/chart-card/*/card-config.vue',
  './src/card/chart-card/*/switch-config.vue' // 特殊的 switch 配置
]

// Visual Editor 专用配置组件路径
const VISUAL_EDITOR_CONFIG_PATTERNS = [
  './src/components/visual-editor/components/config/*Config.vue',
  './src/components/visual-editor/components/PropertyPanel/components/*PropertyEditor.vue'
]

// ====== 配置组件元数据 ======

interface ConfigComponentMeta {
  id: string
  component: Component
  filePath: string
  type: 'card21' | 'legacy' | 'visual-editor'
  format: 'vue-component' | 'async-component'
  componentId?: string
  priority: number // 优先级，数字越大优先级越高
}

// ====== 配置发现器类 ======

export class ConfigDiscovery {
  private discovered = new Map<string, ConfigComponentMeta>()
  private isInitialized = false
  private isScanning = false

  constructor() {
    this.setupGlobalErrorHandler()
  }

  // ====== 初始化和扫描 ======

  /**
   * 初始化配置发现器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.info('配置发现器已初始化')
      return
    }

    if (this.isScanning) {
      logger.info('配置发现器正在扫描中...')
      return
    }

    try {
      this.isScanning = true
      logger.info('开始初始化配置发现器...')

      // 扫描各种类型的配置组件
      await this.scanCard21Configs()
      await this.scanLegacyConfigs()
      await this.scanVisualEditorConfigs()

      // 注册发现的配置组件
      await this.registerDiscoveredConfigs()

      this.isInitialized = true
      logger.info(`配置发现器初始化完成，发现 ${this.discovered.size} 个配置组件`)
    } catch (error) {
      logger.error('配置发现器初始化失败:', error)
      throw error
    } finally {
      this.isScanning = false
    }
  }

  /**
   * 扫描 Card 2.1 配置组件
   */
  private async scanCard21Configs(): Promise<void> {
    logger.info('扫描 Card 2.1 配置组件...')

    try {
      // 使用 Vite 的 import.meta.glob 扫描配置文件
      const configModules = import.meta.glob([
        '/src/card2.1/components/*/*/card-config.vue',
        '/src/card2.1/components/*/*/config.vue',
        '/src/card2.1/components/*/*/*-config.vue'
      ])

      for (const [filePath, moduleLoader] of Object.entries(configModules)) {
        try {
          // 从文件路径推断组件ID
          const componentId = this.extractComponentIdFromPath(filePath, 'card21')

          if (componentId) {
            const configMeta: ConfigComponentMeta = {
              id: `${componentId}-config`,
              component: defineAsyncComponent(moduleLoader as any),
              filePath,
              type: 'card21',
              format: 'async-component',
              componentId,
              priority: 100 // Card 2.1 配置优先级最高
            }

            this.discovered.set(configMeta.id, configMeta)
            logger.debug(`发现 Card 2.1 配置组件: ${componentId}`)
          }
        } catch (error) {
          logger.warn(`扫描 Card 2.1 配置组件失败: ${filePath}`, error)
        }
      }

      logger.info(`扫描 Card 2.1 配置组件完成，发现 ${Object.keys(configModules).length} 个`)
    } catch (error) {
      logger.error('扫描 Card 2.1 配置组件失败:', error)
    }
  }

  /**
   * 扫描原始 Panel 配置组件
   */
  private async scanLegacyConfigs(): Promise<void> {
    logger.info('扫描原始 Panel 配置组件...')

    try {
      // 扫描 chart-card 配置组件
      const chartConfigModules = import.meta.glob([
        '/src/card/chart-card/*/card-config.vue',
        '/src/card/chart-card/*/switch-config.vue'
      ])

      for (const [filePath, moduleLoader] of Object.entries(chartConfigModules)) {
        try {
          const componentId = this.extractComponentIdFromPath(filePath, 'legacy')

          if (componentId) {
            // 检查是否已有 Card 2.1 版本
            const card21Version = `${componentId}-config`
            if (this.discovered.has(card21Version)) {
              logger.debug(`跳过原始配置组件 ${componentId}，已有 Card 2.1 版本`)
              continue
            }

            const configMeta: ConfigComponentMeta = {
              id: `${componentId}-config-legacy`,
              component: defineAsyncComponent(moduleLoader as any),
              filePath,
              type: 'legacy',
              format: 'async-component',
              componentId,
              priority: 50 // 原始配置优先级中等
            }

            this.discovered.set(configMeta.id, configMeta)
            logger.debug(`发现原始配置组件: ${componentId}`)
          }
        } catch (error) {
          logger.warn(`扫描原始配置组件失败: ${filePath}`, error)
        }
      }

      logger.info(`扫描原始配置组件完成，发现 ${Object.keys(chartConfigModules).length} 个`)
    } catch (error) {
      logger.error('扫描原始配置组件失败:', error)
    }
  }

  /**
   * 扫描 Visual Editor 专用配置组件
   */
  private async scanVisualEditorConfigs(): Promise<void> {
    logger.info('扫描 Visual Editor 配置组件...')

    try {
      const visualEditorConfigModules = import.meta.glob([
        '/src/components/visual-editor/components/config/*Config.vue',
        '/src/components/visual-editor/components/PropertyPanel/components/*PropertyEditor.vue'
      ])

      for (const [filePath, moduleLoader] of Object.entries(visualEditorConfigModules)) {
        try {
          const componentId = this.extractComponentIdFromPath(filePath, 'visual-editor')

          if (componentId) {
            const configMeta: ConfigComponentMeta = {
              id: `${componentId}-ve-config`,
              component: defineAsyncComponent(moduleLoader as any),
              filePath,
              type: 'visual-editor',
              format: 'async-component',
              componentId,
              priority: 75 // Visual Editor 配置优先级较高
            }

            this.discovered.set(configMeta.id, configMeta)
            logger.debug(`发现 Visual Editor 配置组件: ${componentId}`)
          }
        } catch (error) {
          logger.warn(`扫描 Visual Editor 配置组件失败: ${filePath}`, error)
        }
      }

      logger.info(`扫描 Visual Editor 配置组件完成，发现 ${Object.keys(visualEditorConfigModules).length} 个`)
    } catch (error) {
      logger.error('扫描 Visual Editor 配置组件失败:', error)
    }
  }

  // ====== 工具方法 ======

  /**
   * 从文件路径提取组件ID
   */
  private extractComponentIdFromPath(filePath: string, type: string): string | null {
    try {
      let componentId: string | null = null

      if (type === 'card21') {
        // Card 2.1: /src/card2.1/components/chart/bar/card-config.vue -> chart-bar
        const match = filePath.match(/\/card2\.1\/components\/([^/]+)\/([^/]+)\//)
        if (match) {
          componentId = `${match[1]}-${match[2]}`
        }
      } else if (type === 'legacy') {
        // Legacy: /src/card/chart-card/bar/card-config.vue -> chart-bar
        const match = filePath.match(/\/card\/(chart-card|builtin-card)\/([^/]+)\//)
        if (match) {
          const cardType = match[1] === 'chart-card' ? 'chart' : 'builtin'
          componentId = `${cardType}-${match[2]}`
        }
      } else if (type === 'visual-editor') {
        // Visual Editor: /src/components/visual-editor/components/config/BarConfig.vue -> bar
        const match = filePath.match(/\/([^/]+)(?:Config|PropertyEditor)\.vue$/)
        if (match) {
          componentId = match[1]
            .toLowerCase()
            .replace(/([A-Z])/g, '-$1')
            .replace(/^-/, '')
        }
      }

      return componentId
    } catch (error) {
      logger.warn(`从路径提取组件ID失败: ${filePath}`, error)
      return null
    }
  }

  /**
   * 注册发现的配置组件
   */
  private async registerDiscoveredConfigs(): Promise<void> {
    logger.info('注册发现的配置组件...')

    // 按优先级排序
    const sortedConfigs = Array.from(this.discovered.values()).sort((a, b) => b.priority - a.priority)

    for (const configMeta of sortedConfigs) {
      try {
        if (configMeta.componentId) {
          // 检查组件是否存在
          const componentExists = componentRegistry.has(configMeta.componentId)

          if (componentExists || configMeta.type === 'visual-editor') {
            const configComponent: IConfigComponent = {
              component: configMeta.component,
              replaceDefault: false,
              metadata: {
                type: configMeta.type,
                filePath: configMeta.filePath,
                priority: configMeta.priority,
                discoveredAt: new Date().toISOString()
              }
            }

            // 注册到配置注册表
            configRegistry.register(configMeta.componentId, configComponent)

            logger.debug(`注册配置组件: ${configMeta.componentId} (${configMeta.type})`)
          } else {
            logger.warn(`组件 ${configMeta.componentId} 不存在，跳过配置注册`)
          }
        }
      } catch (error) {
        logger.error(`注册配置组件失败: ${configMeta.id}`, error)
      }
    }

    logger.info(`配置组件注册完成，成功注册 ${sortedConfigs.length} 个`)
  }

  // ====== 查询方法 ======

  /**
   * 获取所有发现的配置组件
   */
  getDiscoveredConfigs(): ConfigComponentMeta[] {
    return Array.from(this.discovered.values())
  }

  /**
   * 根据组件ID获取配置组件
   */
  getConfigForComponent(componentId: string): ConfigComponentMeta | null {
    // 按优先级查找配置组件
    const candidates = Array.from(this.discovered.values())
      .filter(config => config.componentId === componentId)
      .sort((a, b) => b.priority - a.priority)

    return candidates[0] || null
  }

  /**
   * 获取指定类型的配置组件
   */
  getConfigsByType(type: 'card21' | 'legacy' | 'visual-editor'): ConfigComponentMeta[] {
    return Array.from(this.discovered.values()).filter(config => config.type === type)
  }

  /**
   * 检查配置组件是否存在
   */
  hasConfigForComponent(componentId: string): boolean {
    return this.getConfigForComponent(componentId) !== null
  }

  // ====== 运行时管理 ======

  /**
   * 动态添加配置组件
   */
  addConfigComponent(meta: Omit<ConfigComponentMeta, 'id'>): void {
    const id = `${meta.componentId}-${meta.type}-config`
    const configMeta: ConfigComponentMeta = { ...meta, id }

    this.discovered.set(id, configMeta)

    // 立即注册
    if (meta.componentId) {
      const configComponent: IConfigComponent = {
        component: meta.component,
        replaceDefault: false,
        metadata: {
          type: meta.type,
          filePath: meta.filePath,
          priority: meta.priority,
          discoveredAt: new Date().toISOString()
        }
      }

      configRegistry.register(meta.componentId, configComponent)
      logger.info(`动态添加配置组件: ${meta.componentId}`)
    }
  }

  /**
   * 移除配置组件
   */
  removeConfigComponent(componentId: string): void {
    const configsToRemove = Array.from(this.discovered.entries()).filter(
      ([_, config]) => config.componentId === componentId
    )

    configsToRemove.forEach(([id, config]) => {
      this.discovered.delete(id)
      if (config.componentId) {
        configRegistry.unregister(config.componentId)
      }
    })

    logger.info(`移除配置组件: ${componentId}`)
  }

  /**
   * 重新扫描配置组件
   */
  async rescan(): Promise<void> {
    logger.info('重新扫描配置组件...')

    // 清空现有发现
    this.discovered.clear()
    configRegistry.clear()

    // 重新初始化
    this.isInitialized = false
    await this.initialize()
  }

  // ====== 错误处理 ======

  /**
   * 设置全局错误处理器
   */
  private setupGlobalErrorHandler(): void {
    // 处理异步组件加载错误
    window.addEventListener('unhandledrejection', event => {
      if (event.reason?.message?.includes('config')) {
        logger.error('配置组件加载错误:', event.reason)
        // 可以在这里实现错误恢复逻辑
      }
    })
  }

  // ====== 调试和统计 ======

  /**
   * 获取发现统计信息
   */
  getStats() {
    const stats = {
      total: this.discovered.size,
      byType: {
        card21: 0,
        legacy: 0,
        visualEditor: 0
      },
      byPriority: {
        high: 0,
        medium: 0,
        low: 0
      }
    }

    this.discovered.forEach(config => {
      stats.byType[config.type as keyof typeof stats.byType]++

      if (config.priority >= 100) stats.byPriority.high++
      else if (config.priority >= 50) stats.byPriority.medium++
      else stats.byPriority.low++
    })

    return stats
  }

  /**
   * 导出配置发现信息
   */
  exportDiscoveryInfo() {
    return {
      timestamp: new Date().toISOString(),
      isInitialized: this.isInitialized,
      stats: this.getStats(),
      configs: Array.from(this.discovered.values()).map(config => ({
        id: config.id,
        componentId: config.componentId,
        type: config.type,
        filePath: config.filePath,
        priority: config.priority
      }))
    }
  }

  // ====== 清理资源 ======

  /**
   * 清理资源
   */
  dispose(): void {
    this.discovered.clear()
    this.isInitialized = false
  }
}

// ====== 全局实例 ======

let globalConfigDiscovery: ConfigDiscovery | null = null

/**
 * 获取全局配置发现器实例
 */
export function getConfigDiscovery(): ConfigDiscovery {
  if (!globalConfigDiscovery) {
    globalConfigDiscovery = new ConfigDiscovery()
  }
  return globalConfigDiscovery
}

/**
 * 初始化配置发现器（应用启动时调用）
 */
export async function initializeConfigDiscovery(): Promise<void> {
  const discovery = getConfigDiscovery()
  await discovery.initialize()
}

/**
 * 重置配置发现器
 */
export function resetConfigDiscovery(): void {
  if (globalConfigDiscovery) {
    globalConfigDiscovery.dispose()
    globalConfigDiscovery = null
  }
}

export default ConfigDiscovery
