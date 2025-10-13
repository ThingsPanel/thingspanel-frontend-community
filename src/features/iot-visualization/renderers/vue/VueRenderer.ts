/**
 * Vue 渲染器
 * 使用 Vue 3 组件系统渲染可视化节点
 */

import type { App } from 'vue'
import { createApp } from 'vue'
import type { RenderTree, ICanvasNode, RendererType, RendererMetadata } from '../../noyau/types'
import { BaseRenderer } from '../interface'
import VueRendererComponent from './VueRendererComponent.vue'
import { VueComponentRegistry } from './registry'
import { cardRegistry } from '../../cartes'

/**
 * Vue 渲染器实现
 */
export class VueRenderer extends BaseRenderer {
  private app: App | null = null
  private componentRegistry: VueComponentRegistry

  constructor() {
    super()
    this.componentRegistry = new VueComponentRegistry()
  }

  getType(): RendererType {
    return 'vue'
  }

  /**
   * 挂载渲染器
   */
  async mount(container: HTMLElement, renderTree: RenderTree): Promise<void> {
    if (!container) {
      throw new Error('[VueRenderer] 容器元素为空')
    }

    console.log('[VueRenderer] 开始挂载，容器:', container)

    // 确保容器元素在 DOM 中
    if (!container.isConnected) {
      console.warn('[VueRenderer] 容器元素不在 DOM 中，等待 DOM 更新')
      await new Promise(resolve => setTimeout(resolve, 100))

      if (!container.isConnected) {
        throw new Error('[VueRenderer] 容器元素不在 DOM 中，无法挂载')
      }
    }

    this.container = container
    this.renderTree = renderTree

    // 从卡片注册表加载所有组件
    this.loadComponentsFromCardRegistry()

    // 创建 Vue 应用
    this.app = createApp(VueRendererComponent, {
      renderTree: this.renderTree,
      config: this.config,
      events: this.events,
      componentRegistry: this.componentRegistry
    })

    // 挂载应用
    try {
      this.app.mount(container)
      console.log('[VueRenderer] 挂载成功')
    } catch (error) {
      console.error('[VueRenderer] 挂载失败:', error)
      throw error
    }
  }

  /**
   * 更新渲染树
   */
  async update(renderTree: RenderTree): Promise<void> {
    this.checkMounted()
    this.renderTree = renderTree

    // Vue 渲染器通过 watch 自动响应 renderTree 变化
    // 不需要手动调用组件方法
  }

  /**
   * 更新单个节点
   */
  async updateNode(node: ICanvasNode): Promise<void> {
    this.checkMounted()

    // 在渲染树中找到并更新节点
    const index = this.renderTree.findIndex(n => n.id === node.id)
    if (index !== -1) {
      this.renderTree[index] = node
      // Vue 渲染器通过 watch 自动响应
    }
  }

  /**
   * 卸载渲染器
   */
  async unmount(): Promise<void> {
    if (this.app) {
      this.app.unmount()
      this.app = null
    }

    this.container = null
    this.renderTree = []
    this.componentRegistry.clear()
  }

  /**
   * 获取渲染器元数据
   */
  getMetadata(): RendererMetadata {
    return {
      type: 'vue',
      name: 'Vue 渲染器',
      description: '基于 Vue 3 组件系统的渲染器，支持完整的响应式和交互功能',
      icon: 'i-logos-vue',
      version: '1.0.0',
      features: {
        draggable: true,
        resizable: true,
        rotatable: true,
        selectable: true,
        multiSelect: true
      },
      performance: {
        optimalNodeCount: 100,
        maxNodeCount: 500
      }
    }
  }

  /**
   * 从卡片注册表加载组件
   */
  private loadComponentsFromCardRegistry(): void {
    const manifests = cardRegistry.getAll()

    manifests.forEach(manifest => {
      if (manifest.component.vue) {
        this.componentRegistry.register(manifest.type, manifest.component.vue)
      }
    })

    console.log(
      `[VueRenderer] 已加载 ${this.componentRegistry.getAll().length} 个 Vue 组件:`,
      this.componentRegistry.getAll()
    )
  }

  /**
   * 获取组件注册表
   */
  getComponentRegistry(): VueComponentRegistry {
    return this.componentRegistry
  }
}

/**
 * 创建 Vue 渲染器实例
 */
export function createVueRenderer(): VueRenderer {
  return new VueRenderer()
}
