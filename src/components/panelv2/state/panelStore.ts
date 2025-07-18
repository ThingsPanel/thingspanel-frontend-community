// src/components/panelv2/state/panelStore.ts
import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import type { PanelState, PanelCard, DraggableItem, ConfigItem } from '../types'

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

export const usePanelStore = defineStore('panelV2', {
  state: (): PanelState => {
    // 尝试从本地存储加载状态
    const savedState = loadStateFromStorage()
    return {
      cards: savedState?.cards || [],
      selectedItemId: savedState?.selectedItemId || null,
      config: savedState?.config || {}
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
     * @description 添加一个新卡片
     */
    addCard(item: DraggableItem, position: { x: number; y: number }) {
      const newCard: PanelCard = {
        ...item.defaultData,
        id: nanoid(),
        layout: {
          ...position,
          w: item.defaultData.layout?.w || 4,
          h: item.defaultData.layout?.h || 2
        }
      }
      this.cards.push(newCard)
      this.selectedItemId = newCard.id
      // 自动保存到本地存储
      this.saveToStorage()
    },

    /**
     * @description 更新卡片布局
     */
    updateCardLayout(id: string, newLayout: PanelCard['layout']) {
      const card = this.cards.find(c => c.id === id)
      if (card) {
        card.layout = newLayout
        // 自动保存到本地存储
        this.saveToStorage()
      }
    },

    /**
     * @description 更新一个配置项的值（通用 Action）
     * @param configKey - 要更新的配置的 key
     * @param newValue - 新的值
     * @param cardId - (可选) 如果是更新卡片配置，则提供卡片ID
     */
    updateConfigValue({ configKey, newValue, cardId }: { configKey: string; newValue: any; cardId?: string }) {
      let targetConfig: { [key: string]: ConfigItem<any> } | undefined

      if (cardId) {
        const card = this.cards.find(c => c.id === cardId)
        if (card) targetConfig = card.config
      } else {
        targetConfig = this.config
      }

      if (targetConfig && targetConfig[configKey]) {
        targetConfig[configKey].value = newValue
        // 自动保存到本地存储
        this.saveToStorage()
      }
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
