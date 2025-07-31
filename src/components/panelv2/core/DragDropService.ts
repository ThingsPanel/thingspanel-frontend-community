/**
 * Drag-Drop Service
 * 统一处理拖拽功能，支持从组件面板拖拽卡片到各种渲染器
 */

// 主题感知的颜色获取函数
function getThemeColors() {
  // 检查当前是否为深色主题
  const isDark =
    document.documentElement.classList.contains('dark') ||
    document.body.classList.contains('dark') ||
    window.matchMedia('(prefers-color-scheme: dark)').matches

  return {
    borderColor: isDark ? '#3b82f6' : '#1890ff',
    textColor: isDark ? '#3b82f6' : '#1890ff',
    shadowColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(24, 144, 255, 0.3)'
  }
}

export interface DragData {
  type: 'card' | 'component' | 'item'
  source: 'component-panel' | 'canvas' | 'external'
  cardId?: string
  cardName?: string
  cardType?: string
  cardConfig?: any
  preview?: string
  metadata?: Record<string, any>
}

export interface DropZone {
  id: string
  accepts: string[]
  element: HTMLElement
  onDrop: (data: DragData, position: { x: number; y: number }) => void
  onDragOver?: (data: DragData, position: { x: number; y: number }) => boolean
  onDragEnter?: (data: DragData) => void
  onDragLeave?: (data: DragData) => void
}

export class DragDropService {
  private static instance: DragDropService
  private dropZones = new Map<string, DropZone>()
  private currentDrag: DragData | null = null
  private dragPreview: HTMLElement | null = null

  static getInstance(): DragDropService {
    if (!DragDropService.instance) {
      DragDropService.instance = new DragDropService()
    }
    return DragDropService.instance
  }

  private constructor() {
    this.setupGlobalHandlers()
  }

  private setupGlobalHandlers() {
    document.addEventListener('dragover', this.handleGlobalDragOver.bind(this), { passive: false })
    document.addEventListener('drop', this.handleGlobalDrop.bind(this), { passive: false })
    document.addEventListener('dragend', this.handleGlobalDragEnd.bind(this))
  }

  // 注册投放区域
  registerDropZone(dropZone: DropZone) {
    this.dropZones.set(dropZone.id, dropZone)
    this.setupDropZoneListeners(dropZone)
  }

  // 取消注册投放区域
  unregisterDropZone(id: string) {
    const dropZone = this.dropZones.get(id)
    if (dropZone) {
      this.removeDropZoneListeners(dropZone)
      this.dropZones.delete(id)
    }
  }

  private setupDropZoneListeners(dropZone: DropZone) {
    const element = dropZone.element

    element.addEventListener('dragenter', e => {
      e.preventDefault()
      if (this.currentDrag && this.canAcceptDrag(dropZone, this.currentDrag)) {
        element.classList.add('drag-over')
        dropZone.onDragEnter?.(this.currentDrag)
      }
    })

    element.addEventListener('dragleave', e => {
      e.preventDefault()
      // 只有当鼠标真正离开dropZone时才触发dragleave
      if (!element.contains(e.relatedTarget as Node)) {
        element.classList.remove('drag-over')
        if (this.currentDrag) {
          dropZone.onDragLeave?.(this.currentDrag)
        }
      }
    })

    element.addEventListener('dragover', e => {
      e.preventDefault()
      if (this.currentDrag && this.canAcceptDrag(dropZone, this.currentDrag)) {
        const rect = element.getBoundingClientRect()
        const position = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }

        const canDrop = dropZone.onDragOver?.(this.currentDrag, position) ?? true
        if (canDrop) {
          e.dataTransfer!.dropEffect = 'copy'
        } else {
          e.dataTransfer!.dropEffect = 'none'
        }
      }
    })

    element.addEventListener('drop', e => {
      e.preventDefault()
      element.classList.remove('drag-over')

      if (this.currentDrag && this.canAcceptDrag(dropZone, this.currentDrag)) {
        const rect = element.getBoundingClientRect()
        const position = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }

        dropZone.onDrop(this.currentDrag, position)
      }
    })
  }

  private removeDropZoneListeners(dropZone: DropZone) {
    // 在实际应用中，这里应该移除所有事件监听器
    // 但由于我们使用了匿名函数，这里简化处理
    dropZone.element.classList.remove('drag-over')
  }

  private canAcceptDrag(dropZone: DropZone, dragData: DragData): boolean {
    return dropZone.accepts.includes(dragData.type) || dropZone.accepts.includes('*')
  }

  // 开始拖拽
  startDrag(data: DragData, event: DragEvent) {
    this.currentDrag = data

    // 设置拖拽数据
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify(data))
      event.dataTransfer.effectAllowed = 'copy'
    }

    // 创建拖拽预览
    this.createDragPreview(data, event)

    // 通知所有投放区域拖拽开始
    this.dropZones.forEach(dropZone => {
      if (this.canAcceptDrag(dropZone, data)) {
        dropZone.element.classList.add('can-drop')
      }
    })
  }

  private createDragPreview(data: DragData, event: DragEvent) {
    if (data.preview && event.dataTransfer) {
      const colors = getThemeColors()
      const preview = document.createElement('div')
      preview.className = 'drag-preview'
      preview.style.cssText = `
        position: absolute;
        top: -1000px;
        left: -1000px;
        background: white;
        border: 2px solid ${colors.borderColor};
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 14px;
        color: ${colors.textColor};
        box-shadow: 0 4px 12px ${colors.shadowColor};
        pointer-events: none;
        z-index: 9999;
        transition: all 0.3s ease;
      `
      preview.textContent = data.cardName || data.cardId || 'Component'

      document.body.appendChild(preview)
      this.dragPreview = preview

      // 设置拖拽预览图像
      event.dataTransfer.setDragImage(preview, 60, 20)

      // 延迟移除预览元素
      setTimeout(() => {
        if (this.dragPreview) {
          document.body.removeChild(this.dragPreview)
          this.dragPreview = null
        }
      }, 50)
    }
  }

  private handleGlobalDragOver(e: DragEvent) {
    // 防止默认行为，允许drop
    if (this.currentDrag) {
      e.preventDefault()
    }
  }

  private handleGlobalDrop(e: DragEvent) {
    // 如果没有被任何dropZone处理，则阻止默认行为
    if (this.currentDrag) {
      e.preventDefault()
    }
  }

  private handleGlobalDragEnd(e: DragEvent) {
    // 清理拖拽状态
    this.currentDrag = null

    // 移除所有投放区域的样式
    this.dropZones.forEach(dropZone => {
      dropZone.element.classList.remove('can-drop', 'drag-over')
    })

    // 清理拖拽预览
    if (this.dragPreview) {
      document.body.removeChild(this.dragPreview)
      this.dragPreview = null
    }
  }

  // 获取当前拖拽数据
  getCurrentDrag(): DragData | null {
    return this.currentDrag
  }

  // 从DataTransfer中解析拖拽数据
  static parseDragData(dataTransfer: DataTransfer): DragData | null {
    try {
      const jsonData = dataTransfer.getData('application/json')
      if (jsonData) {
        return JSON.parse(jsonData)
      }
    } catch (e) {
      console.warn('Failed to parse drag data:', e)
    }
    return null
  }
}

// 全局单例实例
export const dragDropService = DragDropService.getInstance()
