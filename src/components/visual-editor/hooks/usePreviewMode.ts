/**
 * 全局预览模式状态管理
 * 用于控制可视化编辑器的预览状态，影响所有渲染器的交互行为
 */
import { ref, computed, readonly } from 'vue'

// 全局预览模式状态
const isPreviewMode = ref(false)

/**
 * 可视化编辑器预览模式管理钩子
 */
export function usePreviewMode() {
  // 设置预览模式
  const setPreviewMode = (preview: boolean) => {
    isPreviewMode.value = preview
    console.log(`🎭 预览模式: ${preview ? '开启' : '关闭'}`)
  }

  // 切换预览模式
  const togglePreviewMode = () => {
    setPreviewMode(!isPreviewMode.value)
    return isPreviewMode.value
  }

  // 编辑模式状态（预览模式的反向）
  const isEditMode = computed(() => !isPreviewMode.value)

  // 渲染器配置计算属性
  const rendererConfig = computed(() => ({
    // 是否只读模式
    readonly: isPreviewMode.value,
    // 是否显示网格
    showGrid: !isPreviewMode.value,
    // 是否可拖拽
    draggable: !isPreviewMode.value,
    // 是否可调整大小
    resizable: !isPreviewMode.value,
    // 是否显示选择框
    showSelection: !isPreviewMode.value,
    // 是否显示控制柄
    showHandles: !isPreviewMode.value,
    // 是否静态网格（GridStack）
    staticGrid: isPreviewMode.value
  }))

  return {
    // 状态
    isPreviewMode: readonly(isPreviewMode),
    isEditMode,

    // 方法
    setPreviewMode,
    togglePreviewMode,

    // 配置
    rendererConfig
  }
}

// 导出全局实例，确保状态同步
export const globalPreviewMode = usePreviewMode()
