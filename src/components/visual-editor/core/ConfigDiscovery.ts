/**
 * 配置组件自动发现机制
 * 自动扫描和注册所有配置组件，支持多种配置组件格式
 *
 * 性能优化特性：
 * - 缓存机制：避免重复扫描同一文件
 * - 并行扫描：同时处理多个扫描任务
 * - 懒加载：按需加载配置组件
 * - 智能过滤：提前过滤无效路径
 * - 性能监控：追踪扫描耗时和统计信息
 */

import { defineAsyncComponent, type Component } from 'vue'
import { configRegistry } from '@/core/interaction-system'
import componentRegistry from '@/card2.1'
import type { IComponentDefinition, IConfigComponent } from '@/card2.1/core'
import { createLogger } from '@/utils/logger'

const logger = createLogger('ConfigDiscovery')

// ====== 配置组件路径模式 ======

// Card 2.1 配置组件路径
const CARD21_CONFIG_PATTERNS = [
  './src/card2.1/components/*/*/card-config.vue',
  './src/card2.1/components/*/*/config.vue',
  './src/card2.1/components/*/*/*-config.vue',
  './src/card2.1/components/*/*/*Config.vue'
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
  // 性能优化字段
  lastModified?: number // 文件最后修改时间
  loadTime?: number // 组件加载耗时(ms)
  cached?: boolean // 是否已缓存
  loadCount?: number // 加载次数
}

// 缓存接口
interface ScanCache {
  timestamp: number
  filePaths: Set<string>
  componentMetas: Map<string, ConfigComponentMeta>
  stats: PerformanceStats
}

// 性能统计接口
interface PerformanceStats {
  totalScanTime: number
  fileCount: number
  successCount: number
  errorCount: number
  cacheHitCount: number
  avgLoadTime: number
  lastScanTime?: number
}

// ====== 配置发现器类 ======

export class ConfigDiscovery {
  private discovered = new Map<string, ConfigComponentMeta>()
  private isInitialized = false
  private isScanning = false

  // 性能优化属性
  private scanCache: ScanCache | null = null
  private cacheExpireTime = 5 * 60 * 1000 // 5分钟缓存过期
  private maxConcurrency = 4 // 最大并发扫描数
  private performanceStats: PerformanceStats = {
    totalScanTime: 0,
    fileCount: 0,
    successCount: 0,
    errorCount: 0,
    cacheHitCount: 0,
    avgLoadTime: 0
  }

  constructor() {
    this.setupGlobalErrorHandler()
    this.loadCacheFromStorage()
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

    const startTime = performance.now()

    try {
      this.isScanning = true
      logger.info('开始初始化配置发现器...')

      // 检查缓存是否可用
      if (this.isCacheValid()) {
        logger.info('使用缓存数据加载配置组件')
        this.loadFromCache()
        this.performanceStats.cacheHitCount++
      } else {
        logger.info('缓存过期或无效，重新扫描配置组件')

        // 并行扫描各种类型的配置组件
        await Promise.all([this.scanCard21Configs(), this.scanLegacyConfigs(), this.scanVisualEditorConfigs()])

        // 保存到缓存
        this.saveCacheToStorage()
      }

      // 注册发现的配置组件
      await this.registerDiscoveredConfigs()

      this.isInitialized = true

      const endTime = performance.now()
      this.performanceStats.totalScanTime = endTime - startTime
      this.performanceStats.lastScanTime = Date.now()

      logger.info(
        `配置发现器初始化完成，发现 ${this.discovered.size} 个配置组件，耗时 ${Math.round(this.performanceStats.totalScanTime)}ms`
      )
    } catch (error) {
      this.performanceStats.errorCount++
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
    const scanStart = performance.now()
    logger.info('扫描 Card 2.1 配置组件...')

    try {
      // 使用 Vite 的 import.meta.glob 扫描配置文件
      const configModules = import.meta.glob([
        '/src/card2.1/components/*/*/card-config.vue',
        '/src/card2.1/components/*/*/config.vue',
        '/src/card2.1/components/*/*/*-config.vue',
        '/src/card2.1/components/*/*/*Config.vue'
      ])

      const filePaths = Object.keys(configModules)
      this.performanceStats.fileCount += filePaths.length

      // 智能过滤：只处理有效的文件路径
      const validPaths = this.filterValidPaths(filePaths, 'card21')

      // 并发限制处理
      await this.processBatch(validPaths, async filePath => {
        const moduleLoader = configModules[filePath]
        const componentLoadStart = performance.now()

        try {
          // 从文件路径推断组件ID
          const componentId = this.extractComponentIdFromPath(filePath, 'card21')

          if (componentId) {
            const configMeta: ConfigComponentMeta = {
              id: `${componentId}-config`,
              component: this.createOptimizedAsyncComponent(moduleLoader as any, componentId),
              filePath,
              type: 'card21',
              format: 'async-component',
              componentId,
              priority: 100, // Card 2.1 配置优先级最高
              loadTime: performance.now() - componentLoadStart,
              cached: false,
              loadCount: 0
            }

            this.discovered.set(configMeta.id, configMeta)
            this.performanceStats.successCount++
            logger.debug(`发现 Card 2.1 配置组件: ${componentId}`)
          }
        } catch (error) {
          this.performanceStats.errorCount++
          logger.warn(`扫描 Card 2.1 配置组件失败: ${filePath}`, error)
        }
      })

      const scanTime = performance.now() - scanStart
      logger.info(`扫描 Card 2.1 配置组件完成，发现 ${validPaths.length} 个，耗时 ${Math.round(scanTime)}ms`)
    } catch (error) {
      this.performanceStats.errorCount++
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

  // ====== 性能优化工具方法 ======

  /**
   * 智能过滤有效文件路径
   */
  private filterValidPaths(filePaths: string[], type: string): string[] {
    return filePaths.filter(path => {
      // 基本路径验证
      if (!path || path.includes('/node_modules/') || path.includes('/.git/')) {
        return false
      }

      // 类型特定验证
      switch (type) {
        case 'card21':
          return (
            path.includes('/card2.1/components/') &&
            (path.endsWith('-config.vue') || path.endsWith('Config.vue') || path.endsWith('config.vue'))
          )
        case 'legacy':
          return path.includes('/card/') && path.endsWith('.vue')
        case 'visual-editor':
          return (
            path.includes('/visual-editor/') && (path.endsWith('Config.vue') || path.endsWith('PropertyEditor.vue'))
          )
        default:
          return true
      }
    })
  }

  /**
   * 批量处理文件，支持并发控制
   */
  private async processBatch<T>(items: T[], processor: (item: T) => Promise<void>): Promise<void> {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += this.maxConcurrency) {
      batches.push(items.slice(i, i + this.maxConcurrency))
    }

    for (const batch of batches) {
      await Promise.all(batch.map(processor))
    }
  }

  /**
   * 创建优化的异步组件
   */
  private createOptimizedAsyncComponent(moduleLoader: any, componentId: string): Component {
    return defineAsyncComponent({
      loader: async () => {
        const loadStart = performance.now()
        try {
          const module = await moduleLoader()
          const loadTime = performance.now() - loadStart

          // 更新统计信息
          const meta = this.discovered.get(`${componentId}-config`)
          if (meta) {
            meta.loadCount = (meta.loadCount || 0) + 1
            meta.loadTime = loadTime
          }

          return module
        } catch (error) {
          logger.error(`加载配置组件失败: ${componentId}`, error)
          throw error
        }
      },
      delay: 200,
      timeout: 5000,
      errorComponent: () => {
        logger.warn(`配置组件加载超时: ${componentId}`)
        return null
      },
      loadingComponent: () => null
    })
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(): boolean {
    if (!this.scanCache) return false

    const now = Date.now()
    const expired = now - this.scanCache.timestamp > this.cacheExpireTime

    return !expired && this.scanCache.componentMetas.size > 0
  }

  /**
   * 从缓存加载数据
   */
  private loadFromCache(): void {
    if (!this.scanCache) return

    this.discovered.clear()
    for (const [id, meta] of this.scanCache.componentMetas) {
      meta.cached = true
      this.discovered.set(id, meta)
    }

    // 恢复性能统计
    Object.assign(this.performanceStats, this.scanCache.stats)
  }

  /**
   * 从本地存储加载缓存
   */
  private loadCacheFromStorage(): void {
    try {
      const cacheKey = 'config-discovery-cache'
      const cached = localStorage.getItem(cacheKey)

      if (cached) {
        const parsedCache = JSON.parse(cached)

        // 重建 Map 和 Set 对象
        this.scanCache = {
          timestamp: parsedCache.timestamp,
          filePaths: new Set(parsedCache.filePaths),
          componentMetas: new Map(parsedCache.componentMetas),
          stats: parsedCache.stats
        }

        logger.debug('从本地存储加载缓存成功')
      }
    } catch (error) {
      logger.warn('从本地存储加载缓存失败:', error)
      this.scanCache = null
    }
  }

  /**
   * 保存缓存到本地存储
   */
  private saveCacheToStorage(): void {
    try {
      const cacheKey = 'config-discovery-cache'
      const cacheData = {
        timestamp: Date.now(),
        filePaths: Array.from(new Set(Array.from(this.discovered.values()).map(m => m.filePath))),
        componentMetas: Array.from(this.discovered.entries()),
        stats: { ...this.performanceStats }
      }

      this.scanCache = {
        timestamp: cacheData.timestamp,
        filePaths: new Set(cacheData.filePaths),
        componentMetas: new Map(cacheData.componentMetas),
        stats: cacheData.stats
      }

      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      logger.debug('缓存已保存到本地存储')
    } catch (error) {
      logger.warn('保存缓存到本地存储失败:', error)
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
        // Card 2.1: /src/card2.1/components/digit-indicator/DigitIndicatorConfig.vue -> chart-digit
        const match = filePath.match(/\/card2\.1\/components\/([^/]+)\//)
        if (match) {
          // 映射路径到组件ID
          const pathToIdMap: Record<string, string> = {
            'digit-indicator': 'chart-digit'
          }
          componentId = pathToIdMap[match[1]] || match[1]
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
            const configComponent: IConfigComponent = configMeta.component

            // 注册到配置注册表
            if (!configRegistry.has(configMeta.componentId)) {
              configRegistry.register(configMeta.componentId, configComponent)
              logger.debug(`注册配置组件: ${configMeta.componentId} (${configMeta.type})`)
            } else {
              logger.debug(`配置组件已存在，跳过注册: ${configMeta.componentId} (${configMeta.type})`)
            }
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
      const configComponent: IConfigComponent = meta.component

      if (!configRegistry.has(meta.componentId)) {
        configRegistry.register(meta.componentId, configComponent)
        logger.info(`动态添加配置组件: ${meta.componentId}`)
      } else {
        logger.info(`配置组件已存在，跳过动态添加: ${meta.componentId}`)
      }
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
    const avgLoadTime =
      this.performanceStats.successCount > 0
        ? this.performanceStats.totalScanTime / this.performanceStats.successCount
        : 0

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
      },
      performance: {
        ...this.performanceStats,
        avgLoadTime: Math.round(avgLoadTime * 100) / 100,
        cacheHitRate:
          this.performanceStats.fileCount > 0
            ? Math.round((this.performanceStats.cacheHitCount / this.performanceStats.fileCount) * 100)
            : 0,
        successRate:
          this.performanceStats.fileCount > 0
            ? Math.round((this.performanceStats.successCount / this.performanceStats.fileCount) * 100)
            : 0
      },
      cache: {
        enabled: !!this.scanCache,
        valid: this.isCacheValid(),
        expireTime: this.cacheExpireTime,
        size: this.scanCache?.componentMetas.size || 0
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
   * 获取详细的性能报告
   */
  getPerformanceReport() {
    const loadTimes = Array.from(this.discovered.values())
      .map(meta => meta.loadTime || 0)
      .filter(time => time > 0)

    const report = {
      overview: {
        totalComponents: this.discovered.size,
        totalScanTime: Math.round(this.performanceStats.totalScanTime),
        avgScanTime: Math.round(this.performanceStats.totalScanTime / Math.max(1, this.performanceStats.fileCount)),
        successRate: Math.round(
          (this.performanceStats.successCount / Math.max(1, this.performanceStats.fileCount)) * 100
        ),
        cacheHitRate: Math.round(
          (this.performanceStats.cacheHitCount / Math.max(1, this.performanceStats.fileCount)) * 100
        )
      },
      componentLoadTimes: {
        min: loadTimes.length > 0 ? Math.min(...loadTimes) : 0,
        max: loadTimes.length > 0 ? Math.max(...loadTimes) : 0,
        avg: loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0,
        total: loadTimes.reduce((a, b) => a + b, 0)
      },
      errors: {
        count: this.performanceStats.errorCount,
        rate: Math.round((this.performanceStats.errorCount / Math.max(1, this.performanceStats.fileCount)) * 100)
      },
      cache: {
        enabled: !!this.scanCache,
        valid: this.isCacheValid(),
        hitCount: this.performanceStats.cacheHitCount,
        expireTime: this.cacheExpireTime
      },
      lastScanTime: this.performanceStats.lastScanTime
        ? new Date(this.performanceStats.lastScanTime).toLocaleString()
        : 'Never'
    }

    return report
  }

  /**
   * 清除性能统计
   */
  clearStats(): void {
    this.performanceStats = {
      totalScanTime: 0,
      fileCount: 0,
      successCount: 0,
      errorCount: 0,
      cacheHitCount: 0,
      avgLoadTime: 0
    }
    logger.info('性能统计已清除')
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    try {
      localStorage.removeItem('config-discovery-cache')
      this.scanCache = null
      logger.info('缓存已清除')
    } catch (error) {
      logger.warn('清除缓存失败:', error)
    }
  }

  /**
   * 导出配置发现信息
   */
  exportDiscoveryInfo() {
    return {
      timestamp: new Date().toISOString(),
      isInitialized: this.isInitialized,
      stats: this.getStats(),
      performanceReport: this.getPerformanceReport(),
      configs: Array.from(this.discovered.values()).map(config => ({
        id: config.id,
        componentId: config.componentId,
        type: config.type,
        filePath: config.filePath,
        priority: config.priority,
        loadTime: config.loadTime,
        loadCount: config.loadCount,
        cached: config.cached
      })),
      cache: {
        enabled: !!this.scanCache,
        valid: this.isCacheValid(),
        size: this.scanCache?.componentMetas.size || 0,
        expireTime: this.cacheExpireTime
      }
    }
  }

  // ====== 清理资源 ======

  /**
   * 清理资源
   */
  dispose(): void {
    // 清理发现的组件
    this.discovered.clear()

    // 重置状态
    this.isInitialized = false
    this.isScanning = false

    // 清除缓存
    this.scanCache = null

    // 清除性能统计
    this.clearStats()

    // 清除本地存储缓存
    try {
      localStorage.removeItem('config-discovery-cache')
    } catch (error) {
      logger.warn('清除本地存储缓存失败:', error)
    }

    logger.info('ConfigDiscovery 资源已清理')
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
