// src/components/panelv2/state/panelStore.ts
import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import type {
  PanelState,
  PanelCard,
  DraggableItem,
  LegacyConfigItem,
  PanelConfig,
  NodeBaseConfig,
  NodeInteractionConfig,
  NodeContentConfig
} from '../types'

// 本地存储的 key
const STORAGE_KEY = 'panelv2_state'

/**
 * @description 从本地存储加载状态
 */
function loadStateFromStorage(): Partial<PanelState> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      console.log('从本地存储加载状态:', parsed)
      return parsed
    }
  } catch (error) {
    console.warn('加载本地存储状态失败:', error)
  }
  return null
}

/**
 * @description 保存状态到本地存储
 */
function saveStateToStorage(state: PanelState) {
  try {
    const stateToSave = {
      cards: state.cards,
      config: state.config,
      selectedItemId: state.selectedItemId,
      lastUpdate: new Date().toLocaleString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
    console.log('状态已保存到本地存储:', stateToSave)
  } catch (error) {
    console.warn('保存状态到本地存储失败:', error)
  }
}

// 默认看板配置
const getDefaultPanelConfig = (): PanelConfig => ({
  layout: {
    gridColumns: 12,
    cellHeight: 70,
    margin: 5,
    padding: 16
  },
  appearance: {
    backgroundColor: '#f5f5f5',
    theme: 'light'
  },
  data: {
    globalDataSource: '{}',
    sharedVariables: '{}',
    apiConfig: {
      timeout: 5000,
      refreshInterval: 30000
    },
    realTimeConfig: {
      enabled: false
    }
  },
  interaction: {
    allowDrag: true,
    allowResize: true,
    allowEdit: true,
    allowDelete: true,
    globalClickBehavior: {
      type: 'blur',
      clearSelection: true
    }
  },
  meta: {
    title: '新建看板',
    version: '1.0.0',
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString()
  }
})

// 默认节点基础配置
const getDefaultNodeBaseConfig = (layout: any): NodeBaseConfig => ({
  layout: {
    x: layout.x || 0,
    y: layout.y || 0,
    w: layout.w || 4,
    h: layout.h || 2,
    ...layout
  },
  state: {
    locked: false,
    hidden: false,
    disabled: false
  },
  appearance: {
    border: {
      width: 1,
      style: 'solid',
      color: '#e8e8e8',
      radius: 4
    },
    opacity: 1
  }
})

// 默认节点交互配置
const getDefaultNodeInteractionConfig = (): NodeInteractionConfig => ({
  onClick: {
    type: 'none'
  },
  onHover: {
    highlight: false
  }
})

export const usePanelStore = defineStore('panelV2', {
  state: (): PanelState => {
    // 尝试从本地存储加载状态
    const savedState = loadStateFromStorage()
    return {
      cards: savedState?.cards || [],
      selectedItemId: savedState?.selectedItemId || null,
      config: savedState?.config || getDefaultPanelConfig()
    }
  },

  getters: {
    /**
     * @description 获取当前选中的项（卡片或看板伪对象）
     */
    selectedItem(state): PanelCard | { id: null; config: PanelState['config'] } | undefined {
      if (state.selectedItemId) {
        return state.cards.find(card => card.id === state.selectedItemId)
      }
      if (state.selectedItemId === null) {
        // 当选中看板本身时，返回一个符合 Inspector 期望的结构
        return { id: null, config: state.config }
      }
      return undefined
    }
  },

  actions: {
    /**
     * @description 添加卡片 - 支持从拖拽项添加或直接添加卡片数据
     */
    addCard(itemOrCard: DraggableItem | PanelCard | any, position?: { x: number; y: number }) {
      let newCard: PanelCard

      // 如果提供了位置参数，说明是从拖拽项添加
      if (position && itemOrCard.defaultData) {
        const item = itemOrCard as DraggableItem
        const layout = {
          x: position.x,
          y: position.y,
          w: item.defaultData.layout?.w || 4,
          h: item.defaultData.layout?.h || 2
        }

        newCard = {
          id: nanoid(),
          type: item.defaultData.type,
          config: {
            base: { ...getDefaultNodeBaseConfig(layout), ...item.defaultData.config.base },
            interaction: { ...getDefaultNodeInteractionConfig(), ...item.defaultData.config.interaction },
            content: { ...item.defaultData.config.content }
          },
          layout
        }
      } else {
        // 直接添加卡片数据（向后兼容）
        newCard = { ...itemOrCard }
        if (!newCard.id) {
          newCard.id = nanoid()
        }

        // 确保有完整的配置结构
        if (!newCard.config?.base) {
          newCard.config = {
            base: getDefaultNodeBaseConfig(newCard.layout),
            interaction: getDefaultNodeInteractionConfig(),
            content: newCard.config || {}
          }
        }
      }

      this.cards.push(newCard)
      this.selectedItemId = newCard.id
      this.saveToStorage()
    },

    /**
     * @description 更新卡片布局
     */
    updateCardLayout(id: string, newLayout: PanelCard['layout']) {
      const card = this.cards.find(c => c.id === id)
      if (card) {
        card.layout = newLayout
        // 同步更新基础配置中的布局
        card.config.base.layout = { ...card.config.base.layout, ...newLayout }
        this.saveToStorage()
      }
    },

    /**
     * @description 更新配置项的值（兼容老版本）
     * @deprecated 建议使用新的分层配置更新方法
     */
    updateConfigValue({ configKey, newValue, cardId }: { configKey: string; newValue: any; cardId?: string }) {
      if (cardId) {
        const card = this.cards.find(c => c.id === cardId)
        if (card && card.config.content && card.config.content[configKey]) {
          card.config.content[configKey].value = newValue
          this.saveToStorage()
        }
      } else {
        // 看板配置更新（需要适配新结构）
        const keys = configKey.split('.')
        let target = this.config as any
        for (let i = 0; i < keys.length - 1; i++) {
          if (!target[keys[i]]) target[keys[i]] = {}
          target = target[keys[i]]
        }
        target[keys[keys.length - 1]] = newValue
        this.saveToStorage()
      }
    },

    /**
     * @description 更新看板配置
     */
    updatePanelConfig(path: string, value: any) {
      const keys = path.split('.')
      let target = this.config as any

      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {}
        target = target[keys[i]]
      }

      target[keys[keys.length - 1]] = value
      this.config.meta.updateTime = new Date().toISOString()
      this.saveToStorage()
    },

    /**
     * @description 更新节点配置
     */
    updateNodeConfig(cardId: string, configType: 'base' | 'interaction' | 'content', path: string, value: any) {
      const card = this.cards.find(c => c.id === cardId)
      if (!card) return

      const keys = path.split('.')
      let target = card.config[configType] as any

      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) target[keys[i]] = {}
        target = target[keys[i]]
      }

      target[keys[keys.length - 1]] = value

      // 如果更新的是基础配置中的布局，同步到layout字段
      if (configType === 'base' && path.startsWith('layout.')) {
        const layoutKey = keys[keys.length - 1]
        card.layout[layoutKey] = value
      }

      this.saveToStorage()
    },

    /**
     * @description 设置当前选中的项
     */
    selectItem(id: string | null) {
      this.selectedItemId = id
    },

    /**
     * @description 删除一个卡片
     */
    deleteCard(id: string) {
      this.cards = this.cards.filter(card => card.id !== id)
      if (this.selectedItemId === id) {
        this.selectedItemId = null
      }
      // 自动保存到本地存储
      this.saveToStorage()
    },

    /**
     * @description 加载整个看板状态
     */
    setPanelState(newState: PanelState) {
      this.$patch(newState)
      // 保存到本地存储
      saveStateToStorage(this.$state)
    },

    /**
     * @description 保存当前状态到本地存储
     */
    saveToStorage() {
      saveStateToStorage(this.$state)
    },

    /**
     * @description 从本地存储加载状态
     */
    loadFromStorage() {
      const savedState = loadStateFromStorage()
      if (savedState) {
        this.$patch(savedState)
        console.log('已从本地存储恢复状态')
        return true
      }
      console.log('本地存储中没有找到保存的状态')
      return false
    },

    /**
     * @description 清空所有卡片
     */
    clearCards() {
      this.cards = []
      this.selectedItemId = null
      // 自动保存到本地存储
      this.saveToStorage()
      console.log('已清空所有卡片')
    },

    /**
     * @description 清除本地存储的状态
     */
    clearStorage() {
      try {
        localStorage.removeItem(STORAGE_KEY)
        console.log('已清除本地存储的状态')
      } catch (error) {
        console.warn('清除本地存储失败:', error)
      }
    }
  }
})
