/**
 * 渲染器注册中心
 * 负责注册所有可用的渲染器到 RendererManager
 */

import { rendererManager } from '@/components/visual-editor/renderers/base/RendererManager'
import { canvasRendererFactory } from '@/components/visual-editor/renderers/canvas/CanvasRendererFactory'

/**
 * 注册所有渲染器
 * 这个函数应该在应用启动时调用
 */
export function registerAllRenderers(): void {
  console.log('🎯 [RendererRegistry] 开始注册所有渲染器')

  try {
    // 注册 Canvas 渲染器
    rendererManager.register('canvas', canvasRendererFactory, {
      name: 'Canvas 渲染器',
      description: '基于 Fabric.js 的自由画布渲染器，支持拖拽、缩放、旋转等高级交互',
      icon: 'i-material-symbols-grid-view-outline'
    })

    console.log('✅ [RendererRegistry] Canvas 渲染器注册成功')

    // TODO: 注册其他渲染器
    // 注册 GridStack 渲染器
    // rendererManager.register('gridstack', gridstackRendererFactory, {
    //   name: 'GridStack 渲染器',
    //   description: '基于网格的响应式布局渲染器',
    //   icon: 'i-material-symbols-grid-on-outline'
    // })

    const stats = rendererManager.getPerformanceStats()
    console.log('📊 [RendererRegistry] 渲染器注册统计:', stats)

  } catch (error) {
    console.error('❌ [RendererRegistry] 渲染器注册失败:', error)
    throw error
  }
}

/**
 * 获取可用的渲染器列表
 */
export function getAvailableRenderers() {
  return rendererManager.getSupportedRendererOptions()
}

/**
 * 检查特定渲染器是否可用
 */
export function isRendererAvailable(type: string): boolean {
  return rendererManager.isSupported(type)
}

/**
 * 获取渲染器注册统计
 */
export function getRegistryStats() {
  return rendererManager.getPerformanceStats()
}

/**
 * 清理所有渲染器实例
 */
export async function cleanupAllRenderers(): Promise<void> {
  try {
    await rendererManager.destroyAllRenderers()
    console.log('✅ [RendererRegistry] 所有渲染器实例已清理')
  } catch (error) {
    console.error('❌ [RendererRegistry] 清理渲染器实例失败:', error)
    throw error
  }
}

// 导出渲染器管理器实例（用于高级用法）
export { rendererManager }

export default {
  registerAllRenderers,
  getAvailableRenderers,
  isRendererAvailable,
  getRegistryStats,
  cleanupAllRenderers,
  rendererManager
}