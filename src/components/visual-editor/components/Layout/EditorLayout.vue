<template>
  <div class="editor-layout h-full w-full flex flex-col" :style="themeColors">
    <!-- 工具栏区域 - 仅当编辑模式且有插槽内容时显示 -->
    <div
      v-if="showToolbar"
      class="toolbar-area flex-shrink-0 h-12 px-4 flex items-center justify-between transition-all duration-300"
      style="background-color: var(--toolbar-bg); border-bottom: 1px solid var(--panel-border)"
    >
      <slot name="toolbar" :mode="props.mode" :isEditMode="isEditMode" />
    </div>

    <!-- 主内容区域 -->
    <div class="main-content flex-1 flex overflow-hidden" style="background-color: var(--panel-bg)">
      <!-- 左侧区域 - 仅当编辑模式、有插槽内容且未收起时显示 -->
      <div
        v-if="showLeft"
        class="left-area flex-shrink-0 overflow-auto transition-all duration-300"
        :style="{
          width: `${leftWidth}px`,
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--panel-border)'
        }"
      >
        <slot name="left" :mode="props.mode" :isEditMode="isEditMode" />
      </div>

      <!-- 中央编辑区域 - 始终显示 -->
      <div class="main-area flex-1 overflow-auto transition-all duration-300" style="background-color: var(--panel-bg)">
        <slot name="main" :mode="props.mode" :isEditMode="isEditMode" />
      </div>

      <!-- 右侧区域 - 仅当编辑模式、有插槽内容且未收起时显示 -->
      <div
        v-if="showRight"
        class="right-area flex-shrink-0 overflow-auto transition-all duration-300"
        :style="{
          width: `${rightWidth}px`,
          backgroundColor: 'var(--sidebar-bg)',
          borderLeft: '1px solid var(--panel-border)'
        }"
      >
        <slot name="right" :mode="props.mode" :isEditMode="isEditMode" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { useThemeStore } from '@/store/modules/theme'

interface Props {
  mode?: 'edit' | 'preview'
  leftCollapsed?: boolean
  rightCollapsed?: boolean
  leftWidth?: number
  rightWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'edit',
  leftCollapsed: false,
  rightCollapsed: false,
  leftWidth: 280,
  rightWidth: 320
})

const emit = defineEmits<{
  'update:leftCollapsed': [value: boolean]
  'update:rightCollapsed': [value: boolean]
}>()

const slots = useSlots()
const themeStore = useThemeStore()
const isEditMode = computed(() => props.mode === 'edit')

// 主题颜色计算属性
const themeColors = computed(() => {
  const isDark = themeStore.darkMode
  return {
    '--panel-bg': isDark ? '#1f1f1f' : '#f8fafc',
    '--panel-border': isDark ? '#404040' : '#e0e0e0',
    '--panel-shadow': isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
    '--toolbar-bg': isDark ? '#1f2937' : '#f8fafc',
    '--sidebar-bg': isDark ? '#252525' : '#fafafa'
  }
})

// 插槽存在性检查
const hasToolbar = computed(() => !!slots.toolbar)
const hasLeft = computed(() => !!slots.left)
const hasRight = computed(() => !!slots.right)

// 显示条件 - 工具栏在任何模式下都显示（如果有插槽内容）
const showToolbar = computed(() => hasToolbar.value)
// 左右面板在编辑模式下显示，预览模式下可以通过工具栏按钮切换显示
const showLeft = computed(() => hasLeft.value && !props.leftCollapsed)
const showRight = computed(() => hasRight.value && !props.rightCollapsed)

// API方法
const toggleLeft = () => {
  emit('update:leftCollapsed', !props.leftCollapsed)
}

const toggleRight = () => {
  emit('update:rightCollapsed', !props.rightCollapsed)
}

// 暴露方法给父组件
defineExpose({
  toggleLeft,
  toggleRight,
  isEditMode: isEditMode.value,
  hasToolbar: hasToolbar.value,
  hasLeft: hasLeft.value,
  hasRight: hasRight.value
})
</script>

<style scoped>
.editor-layout {
  /* 确保布局占满全部空间 */
  min-height: 0;
}

.main-content {
  /* 确保主内容区域能够正确处理 overflow */
  min-height: 0;
}

.left-area,
.right-area,
.main-area {
  /* 防止子元素溢出 */
  min-width: 0;
  min-height: 0;
}

/* 自定义滚动条样式 */
.left-area::-webkit-scrollbar,
.right-area::-webkit-scrollbar,
.main-area::-webkit-scrollbar {
  width: 6px;
}

.left-area::-webkit-scrollbar-track,
.right-area::-webkit-scrollbar-track,
.main-area::-webkit-scrollbar-track {
  background: transparent;
}

.left-area::-webkit-scrollbar-thumb,
.right-area::-webkit-scrollbar-thumb,
.main-area::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}

.left-area::-webkit-scrollbar-thumb:hover,
.right-area::-webkit-scrollbar-thumb:hover,
.main-area::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}
</style>
