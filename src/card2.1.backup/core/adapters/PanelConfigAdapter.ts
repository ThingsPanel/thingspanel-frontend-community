/**
 * Panel 配置适配器
 * 提供原始 Panel 系统与 Card 2.1/Visual Editor 系统之间的配置桥接
 */

import { reactive, ref, computed, type Ref } from 'vue'
import type {
  ICardDefine,
  ICardData,
  ICardView,
  DeviceSourceItem,
  convertLegacyCardToCard21,
  convertCard21ToLegacy,
  convertPanelLayoutToEditor,
  convertEditorLayoutToPanel,
  createConfigContextFromDefinition
} from '../types/legacy'
import type { IComponentDefinition } from '../types'
import componentRegistry from '@/card2.1'
import { createLogger } from '@/utils/logger'

const logger = createLogger('PanelConfigAdapter')

// ====== 面板配置状态管理 ======

export interface PanelConfig {
  id: string
  name: string
  layout: ICardView[]
  theme: string
  config?: string // JSON 字符串格式的配置
}

export interface AdapterOptions {
  enableLegacyMode?: boolean // 是否启用兼容模式
  autoConvert?: boolean // 是否自动转换配置格式
  preserveOriginal?: boolean // 是否保留原始配置
}

/**
 * Panel 配置适配器类
 */
export class PanelConfigAdapter {
  private options: AdapterOptions
  private legacyCardMap = new Map<string, ICardDefine>()
  private card21Map = new Map<string, IComponentDefinition>()

  // 响应式状态
  public currentPanel = ref<PanelConfig | null>(null)
  public isLoading = ref(false)
  public error = ref<string | null>(null)

  constructor(options: AdapterOptions = {}) {
    this.options = {
      enableLegacyMode: true,
      autoConvert: true,
      preserveOriginal: true,
      ...options
    }

    this.initializeCardMaps()
  }

  // ====== 初始化 ======

  /**
   * 初始化卡片映射表
   */
  private async initializeCardMaps() {
    try {
      // 获取 Card 2.1 组件
      const card21Components = componentRegistry.getAll()
      card21Components.forEach(component => {
        this.card21Map.set(component.id, component)
      })

      // 如果启用兼容模式，也加载原始 Panel 卡片
      if (this.options.enableLegacyMode) {
        await this.loadLegacyCards()
      }

      logger.info(`初始化完成: Card 2.1 组件 ${card21Components.length} 个`)
    } catch (err) {
      logger.error('初始化卡片映射失败:', err)
      this.error.value = '初始化失败'
    }
  }

  /**
   * 加载原始 Panel 卡片（动态导入）
   */
  private async loadLegacyCards() {
    try {
      // 导入原始 panel 卡片
      const { PanelCards } = await import('@/components/panel')

      // 遍历所有类别的卡片
      Object.values(PanelCards).forEach((cardList: ICardDefine[]) => {
        cardList.forEach(card => {
          this.legacyCardMap.set(card.id, card)
        })
      })

      logger.info(`加载原始卡片 ${this.legacyCardMap.size} 个`)
    } catch (err) {
      logger.warn('加载原始卡片失败，可能是正常的模块化行为:', err)
    }
  }

  // ====== 配置加载和保存 ======

  /**
   * 加载面板配置
   */
  async loadPanelConfig(panelId: string): Promise<PanelConfig | null> {
    this.isLoading.value = true
    this.error.value = null

    try {
      // 这里需要调用实际的API获取面板数据
      const { getBoard } = await import('@/service/api')
      const { data } = await getBoard(panelId)

      if (!data) {
        throw new Error('面板数据不存在')
      }

      const panelConfig: PanelConfig = {
        id: panelId,
        name: data.name || '未命名面板',
        layout: [],
        theme: 'default',
        config: data.config
      }

      // 解析配置
      if (data.config) {
        const parsedConfig = this.parseConfig(data.config)
        panelConfig.layout = parsedConfig.layout || []
        panelConfig.theme = parsedConfig.theme || 'default'
      }

      this.currentPanel.value = panelConfig

      logger.info(`成功加载面板配置: ${panelId}`)
      return panelConfig
    } catch (err: any) {
      this.error.value = err.message || '加载面板配置失败'
      logger.error('加载面板配置失败:', err)
      return null
    } finally {
      this.isLoading.value = false
    }
  }

  /**
   * 保存面板配置
   */
  async savePanelConfig(panelConfig: PanelConfig): Promise<boolean> {
    this.isLoading.value = true
    this.error.value = null

    try {
      // 序列化配置
      const configString = this.serializeConfig({
        layout: panelConfig.layout,
        theme: panelConfig.theme
      })

      // 调用API保存
      const { PutBoard } = await import('@/service/api')
      await PutBoard({
        id: panelConfig.id,
        config: configString
      })

      this.currentPanel.value = panelConfig

      logger.info(`成功保存面板配置: ${panelConfig.id}`)
      return true
    } catch (err: any) {
      this.error.value = err.message || '保存面板配置失败'
      logger.error('保存面板配置失败:', err)
      return false
    } finally {
      this.isLoading.value = false
    }
  }

  // ====== 配置格式转换 ======

  /**
   * 解析配置字符串
   */
  private parseConfig(configString: string): { layout: ICardView[]; theme: string } {
    try {
      const parsed = JSON.parse(configString)

      // 处理旧格式（直接是数组）
      if (Array.isArray(parsed)) {
        return {
          layout: this.normalizeLayout(parsed),
          theme: 'default'
        }
      }

      // 处理新格式（包含 layout 和 theme）
      return {
        layout: this.normalizeLayout(parsed.layout || []),
        theme: parsed.theme || 'default'
      }
    } catch (err) {
      logger.warn('解析配置失败，使用默认配置:', err)
      return { layout: [], theme: 'default' }
    }
  }

  /**
   * 序列化配置对象
   */
  private serializeConfig(config: { layout: ICardView[]; theme: string }): string {
    try {
      return JSON.stringify(config)
    } catch (err) {
      logger.error('序列化配置失败:', err)
      throw new Error('配置序列化失败')
    }
  }

  /**
   * 规范化布局数据（处理字符串ID等兼容问题）
   */
  private normalizeLayout(layout: ICardView[]): ICardView[] {
    return layout.map((item, index) => ({
      ...item,
      // 确保 i 是数字类型
      i: typeof item.i === 'string' ? this.stringToUniqueNumber(item.i) : item.i || index
    }))
  }

  /**
   * 字符串转唯一数字（用于处理旧数据的字符串ID）
   */
  private stringToUniqueNumber(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = hash * 31 + str.charCodeAt(i)
    }
    return Math.abs(hash)
  }

  // ====== 组件管理 ======

  /**
   * 获取组件定义（优先使用 Card 2.1，回退到 Legacy）
   */
  getComponentDefinition(componentId: string): IComponentDefinition | ICardDefine | null {
    // 优先返回 Card 2.1 组件
    const card21Component = this.card21Map.get(componentId)
    if (card21Component) {
      return card21Component
    }

    // 回退到 Legacy 组件
    if (this.options.enableLegacyMode) {
      const legacyComponent = this.legacyCardMap.get(componentId)
      if (legacyComponent) {
        return legacyComponent
      }
    }

    logger.warn(`未找到组件定义: ${componentId}`)
    return null
  }

  /**
   * 获取所有可用组件
   */
  getAllComponents(): {
    card21: IComponentDefinition[]
    legacy: ICardDefine[]
  } {
    return {
      card21: Array.from(this.card21Map.values()),
      legacy: this.options.enableLegacyMode ? Array.from(this.legacyCardMap.values()) : []
    }
  }

  /**
   * 检查组件是否为 Card 2.1 组件
   */
  isCard21Component(componentId: string): boolean {
    return this.card21Map.has(componentId)
  }

  // ====== 数据转换工具 ======

  /**
   * 转换到 Visual Editor 格式
   */
  convertToVisualEditor(layout: ICardView[]): any[] {
    return layout.map(item => {
      const componentDef = this.getComponentDefinition(item.data?.cardId || '')

      return {
        id: String(item.i),
        type: item.data?.cardId || 'unknown',
        position: { x: item.x, y: item.y },
        size: { width: item.w, height: item.h },
        minSize: {
          width: item.minW || 2,
          height: item.minH || 2
        },
        config: item.data?.config || {},
        dataSource: item.data?.dataSource,
        basicSettings: item.data?.basicSettings,
        // 附加元数据
        meta: {
          isCard21: this.isCard21Component(item.data?.cardId || ''),
          componentDefinition: componentDef
        }
      }
    })
  }

  /**
   * 从 Visual Editor 格式转换回来
   */
  convertFromVisualEditor(editorLayout: any[]): ICardView[] {
    return editorLayout.map((item, index) => ({
      i: parseInt(item.id) || index,
      x: item.position?.x || 0,
      y: item.position?.y || 0,
      w: item.size?.width || 4,
      h: item.size?.height || 3,
      minW: item.minSize?.width || 2,
      minH: item.minSize?.height || 2,
      data: {
        cardId: item.type,
        config: item.config || {},
        dataSource: item.dataSource,
        basicSettings: item.basicSettings
      }
    }))
  }

  // ====== 配置上下文支持 ======

  /**
   * 为组件创建配置上下文
   */
  createConfigContext(componentId: string, currentConfig: Record<string, any> = {}) {
    const componentDef = this.getComponentDefinition(componentId)

    if (!componentDef) {
      logger.warn(`无法为组件 ${componentId} 创建配置上下文`)
      return { config: currentConfig, view: false }
    }

    // 如果是 Card 2.1 组件
    if ('meta' in componentDef) {
      return createConfigContextFromDefinition(componentDef, currentConfig)
    }

    // 如果是 Legacy 组件
    return {
      config: {
        ...componentDef.preset?.config,
        ...currentConfig
      },
      view: false
    }
  }

  // ====== 计算属性 ======

  /**
   * 当前面板的 Visual Editor 格式数据
   */
  get currentEditorLayout() {
    return computed(() => {
      if (!this.currentPanel.value) return []
      return this.convertToVisualEditor(this.currentPanel.value.layout)
    })
  }

  /**
   * 当前面板统计信息
   */
  get panelStats() {
    return computed(() => {
      if (!this.currentPanel.value) return { total: 0, card21: 0, legacy: 0 }

      const layout = this.currentPanel.value.layout
      let card21Count = 0
      let legacyCount = 0

      layout.forEach(item => {
        if (this.isCard21Component(item.data?.cardId || '')) {
          card21Count++
        } else {
          legacyCount++
        }
      })

      return {
        total: layout.length,
        card21: card21Count,
        legacy: legacyCount
      }
    })
  }

  // ====== 清理资源 ======

  /**
   * 清理适配器资源
   */
  dispose() {
    this.currentPanel.value = null
    this.legacyCardMap.clear()
    this.card21Map.clear()
    this.error.value = null
  }
}

// ====== 全局适配器实例 ======

let globalAdapter: PanelConfigAdapter | null = null

/**
 * 获取全局适配器实例（单例模式）
 */
export function usePanelConfigAdapter(options?: AdapterOptions): PanelConfigAdapter {
  if (!globalAdapter) {
    globalAdapter = new PanelConfigAdapter(options)
  }
  return globalAdapter
}

/**
 * 重置全局适配器实例
 */
export function resetPanelConfigAdapter() {
  if (globalAdapter) {
    globalAdapter.dispose()
    globalAdapter = null
  }
}

export default PanelConfigAdapter
