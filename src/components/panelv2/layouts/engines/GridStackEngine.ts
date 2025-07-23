// src/components/panelv2/layouts/engines/GridStackEngine.ts

import { GridStack } from 'gridstack'
import type { GridStackElement, GridStackOptions } from 'gridstack'
import type { LayoutEngine } from '../LayoutManager'
import type { PanelCard } from '../../types'

export class GridStackEngine implements LayoutEngine {
  name = 'gridstack'
  private grid: GridStack | null = null
  private container: HTMLElement | null = null
  private cards: Map<string, HTMLElement> = new Map()

  initialize(container: HTMLElement, options: GridStackOptions = {}) {
    this.container = container

    const defaultOptions: GridStackOptions = {
      column: 12,
      cellHeight: '70px',
      margin: 10,
      float: true,
      animate: true,
      acceptWidgets: true,
      removable: false,
      ...options
    }

    this.grid = GridStack.init(defaultOptions, container)

    // 监听布局变化
    this.grid.on('change', (event, items) => {
      this.handleLayoutChange(items)
    })

    return this.grid
  }

  addCard(card: PanelCard, position?: any) {
    if (!this.grid) return

    const cardEl = document.createElement('div')
    cardEl.className = 'grid-stack-item'
    cardEl.setAttribute('data-card-id', card.id)

    const contentEl = document.createElement('div')
    contentEl.className = 'grid-stack-item-content'
    cardEl.appendChild(contentEl)

    this.cards.set(card.id, cardEl)

    const gridOptions = {
      x: card.layout.x,
      y: card.layout.y,
      w: card.layout.w,
      h: card.layout.h,
      id: card.id,
      ...position
    }

    this.grid.makeWidget(cardEl, gridOptions)
  }

  removeCard(cardId: string) {
    if (!this.grid) return

    const cardEl = this.cards.get(cardId)
    if (cardEl) {
      this.grid.removeWidget(cardEl)
      this.cards.delete(cardId)
    }
  }

  updateCard(cardId: string, updates: Partial<PanelCard>) {
    const cardEl = this.cards.get(cardId)
    if (!cardEl || !this.grid) return

    if (updates.layout) {
      this.grid.update(cardEl, updates.layout)
    }
  }

  updateLayout(cardId: string, layout: PanelCard['layout']) {
    this.updateCard(cardId, { layout })
  }

  resize() {
    if (this.grid) {
      this.grid.doLayout()
    }
  }

  destroy() {
    if (this.grid) {
      this.grid.destroy()
      this.grid = null
    }
    this.cards.clear()
    this.container = null
  }

  // 私有方法
  private handleLayoutChange(items: any[]) {
    // 触发布局变化事件
    const layoutChanges = items.map(item => ({
      id: item.el?.getAttribute('data-card-id'),
      layout: {
        x: item.x!,
        y: item.y!,
        w: item.w!,
        h: item.h!
      }
    }))

    // 这里可以添加事件派发逻辑
    console.log('Layout changed:', layoutChanges)
  }

  // 公共API扩展
  setStatic(cardId: string, isStatic: boolean) {
    const cardEl = this.cards.get(cardId)
    if (cardEl && this.grid) {
      this.grid.update(cardEl, { locked: isStatic })
    }
  }

  setResizable(cardId: string, resizable: boolean) {
    const cardEl = this.cards.get(cardId)
    if (cardEl && this.grid) {
      this.grid.update(cardEl, { noResize: !resizable })
    }
  }

  setMovable(cardId: string, movable: boolean) {
    const cardEl = this.cards.get(cardId)
    if (cardEl && this.grid) {
      this.grid.update(cardEl, { noMove: !movable })
    }
  }

  compact() {
    if (this.grid) {
      this.grid.compact()
    }
  }

  setAnimation(enable: boolean) {
    if (this.grid) {
      this.grid.setAnimation(enable)
    }
  }

  // 获取网格信息
  getGridInfo() {
    if (!this.grid) return null

    return {
      column: this.grid.getColumn(),
      cellHeight: this.grid.getCellHeight(),
      margin: this.grid.margin,
      engine: this.grid.engine
    }
  }

  // 设置网格列数
  setColumn(column: number) {
    if (this.grid) {
      this.grid.column(column)
    }
  }

  // 批量更新
  batchUpdate(updates: Array<{ cardId: string; layout: PanelCard['layout'] }>) {
    if (!this.grid) return

    this.grid.batchUpdate()

    updates.forEach(({ cardId, layout }) => {
      this.updateLayout(cardId, layout)
    })

    this.grid.commit()
  }

  // 获取空白区域
  getEmptyAreas() {
    if (!this.grid) return []

    // 简单实现：返回可用的位置
    const usedPositions = new Set<string>()
    this.cards.forEach(cardEl => {
      const node = this.grid!.engine.nodes.find(n => n.el === cardEl)
      if (node) {
        for (let x = node.x!; x < node.x! + node.w!; x++) {
          for (let y = node.y!; y < node.y! + node.h!; y++) {
            usedPositions.add(`${x},${y}`)
          }
        }
      }
    })

    const emptyAreas = []
    const maxY = Math.max(
      ...Array.from(this.cards.values()).map(cardEl => {
        const node = this.grid!.engine.nodes.find(n => n.el === cardEl)
        return node ? node.y! + node.h! : 0
      }),
      5
    )

    for (let y = 0; y <= maxY; y++) {
      for (let x = 0; x < this.grid.getColumn(); x++) {
        if (!usedPositions.has(`${x},${y}`)) {
          emptyAreas.push({ x, y, w: 1, h: 1 })
        }
      }
    }

    return emptyAreas
  }
}
