// src/components/panelv2/state/panelStore.ts
import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import type { PanelState, PanelCard, DraggableItem, ConfigItem } from '../types'

export const usePanelStore = defineStore('panelV2', {
  state: (): PanelState => ({
    cards: [],
    selectedItemId: null,
    config: {}
  }),

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
    },

    /**
     * @description 更新卡片布局
     */
    updateCardLayout(id: string, newLayout: PanelCard['layout']) {
      const card = this.cards.find(c => c.id === id)
      if (card) {
        card.layout = newLayout
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
    },

    /**
     * @description 加载整个看板状态
     */
    setPanelState(newState: PanelState) {
      this.$patch(newState)
    }
  }
})
