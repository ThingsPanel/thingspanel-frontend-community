/**
 * 渲染器管理 Composable
 * 管理渲染器的加载、切换和生命周期
 */

import { ref, onMounted, onBeforeUnmount } from 'vue'
import type { IRenderer, RendererType, RendererConfig, RendererEvents } from '../../renderers'
import { createVueRenderer } from '../../renderers'
import type { RenderTree } from '../../noyau/types'

/**
 * 渲染器管理 Hook
 */
export function useRenderer() {
  const currentRenderer = ref<IRenderer | null>(null)
  const currentType = ref<RendererType>('vue')
  const isReady = ref(false)
  const error = ref<string | null>(null)

  /**
   * 初始化渲染器
   */
  async function initRenderer(
    container: HTMLElement,
    renderTree: RenderTree,
    type: RendererType = 'vue',
    config?: RendererConfig,
    events?: RendererEvents
  ) {
    try {
      error.value = null

      // 创建渲染器
      const renderer = await createRendererInstance(type)

      // 设置配置和事件
      if (config) {
        renderer.setConfig(config)
      }

      if (events) {
        renderer.setEvents(events)
      }

      // 挂载渲染器
      await renderer.mount(container, renderTree)

      currentRenderer.value = renderer
      currentType.value = type
      isReady.value = true

      console.log(`[useRenderer] ${type} 渲染器初始化成功`)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      console.error('[useRenderer] 渲染器初始化失败:', err)
      throw err
    }
  }

  /**
   * 切换渲染器
   */
  async function switchRenderer(
    container: HTMLElement,
    renderTree: RenderTree,
    type: RendererType,
    config?: RendererConfig,
    events?: RendererEvents
  ) {
    try {
      // 先卸载当前渲染器
      if (currentRenderer.value) {
        await currentRenderer.value.unmount()
        currentRenderer.value = null
      }

      // 初始化新渲染器
      await initRenderer(container, renderTree, type, config, events)

      console.log(`[useRenderer] 切换到 ${type} 渲染器`)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      console.error('[useRenderer] 渲染器切换失败:', err)
      throw err
    }
  }

  /**
   * 更新渲染树
   */
  async function updateRenderTree(renderTree: RenderTree) {
    if (!currentRenderer.value) {
      console.warn('[useRenderer] 渲染器未初始化')
      return
    }

    try {
      await currentRenderer.value.update(renderTree)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      console.error('[useRenderer] 渲染树更新失败:', err)
    }
  }

  /**
   * 更新单个节点
   */
  async function updateNode(node: any) {
    if (!currentRenderer.value) {
      console.warn('[useRenderer] 渲染器未初始化')
      return
    }

    try {
      await currentRenderer.value.updateNode(node)
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      console.error('[useRenderer] 节点更新失败:', err)
    }
  }

  /**
   * 获取渲染器元数据
   */
  function getMetadata() {
    return currentRenderer.value?.getMetadata()
  }

  /**
   * 销毁渲染器
   */
  async function destroyRenderer() {
    if (currentRenderer.value) {
      await currentRenderer.value.unmount()
      currentRenderer.value = null
      isReady.value = false
    }
  }

  /**
   * 组件卸载时自动销毁渲染器
   */
  onBeforeUnmount(async () => {
    await destroyRenderer()
  })

  return {
    // 状态
    currentRenderer,
    currentType,
    isReady,
    error,

    // 方法
    initRenderer,
    switchRenderer,
    updateRenderTree,
    updateNode,
    getMetadata,
    destroyRenderer
  }
}

/**
 * 创建渲染器实例
 */
async function createRendererInstance(type: RendererType): Promise<IRenderer> {
  switch (type) {
    case 'vue':
      return createVueRenderer()

    case 'canvas':
      // 未来实现
      throw new Error('Canvas 渲染器尚未实现')

    case 'webgl':
      // 未来实现
      throw new Error('WebGL 渲染器尚未实现')

    default:
      throw new Error(`未知的渲染器类型: ${type}`)
  }
}
