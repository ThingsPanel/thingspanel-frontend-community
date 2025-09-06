<script setup lang="ts">
// 导入Vue核心功能、Naive UI组件和状态管理
import { computed, useSlots } from 'vue'
import { NDrawer, NDrawerContent } from 'naive-ui'
import { useThemeStore } from '@/store/modules/theme'

// 定义组件的Props
interface Props {
  mode?: 'edit' | 'preview'
  leftCollapsed?: boolean
  rightCollapsed?: boolean
  leftWidth?: number
  rightWidth?: number
  showHeader?: boolean
  showToolbar?: boolean
  showFooter?: boolean
  headerHeight?: number
  toolbarHeight?: number
  footerHeight?: number
  enableAnimations?: boolean
  customClass?: string
}

// 设置Props的默认值
const props = withDefaults(defineProps<Props>(), {
  mode: 'edit',
  leftCollapsed: false,
  rightCollapsed: false,
  leftWidth: 280,
  rightWidth: 320,
  showHeader: true,
  showToolbar: true,
  showFooter: false,
  headerHeight: 60,
  toolbarHeight: 48,
  footerHeight: 40,
  enableAnimations: true,
  customClass: ''
})

// 定义组件的Emits
const emit = defineEmits<{
  'update:leftCollapsed': [value: boolean]
  'update:rightCollapsed': [value: boolean]
}>()

// 处理侧边栏抽屉的关闭事件
const handleLeftDrawerClose = (show: boolean) => {
  if (!show) emit('update:leftCollapsed', true)
}
const handleRightDrawerClose = (show: boolean) => {
  if (!show) emit('update:rightCollapsed', true)
}

// 获取插槽和主题状态
const slots = useSlots()
const themeStore = useThemeStore()
const isEditMode = computed(() => props.mode === 'edit')

// 动态计算主题颜色
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

// 检查各个插槽是否存在
const hasHeader = computed(() => !!slots.header)
const hasToolbar = computed(() => !!slots.toolbar)
const hasLeft = computed(() => !!slots.left)
const hasRight = computed(() => !!slots.right)
const hasFooter = computed(() => !!slots.footer)

// 根据Props和插槽情况决定是否显示各个区域
const displayHeader = computed(() => props.showHeader && hasHeader.value)
const displayToolbar = computed(() => props.showToolbar && hasToolbar.value)
const displayLeft = computed(() => isEditMode.value && hasLeft.value && !props.leftCollapsed)
const displayRight = computed(() => isEditMode.value && hasRight.value && !props.rightCollapsed)
const displayFooter = computed(() => props.showFooter && hasFooter.value)

// 动态计算CSS变量
const cssVariables = computed(() => ({
  ...themeColors.value,
  '--header-height': displayHeader.value ? `${props.headerHeight}px` : '0px',
  '--toolbar-height': displayToolbar.value ? `${props.toolbarHeight}px` : '0px',
  '--footer-height': displayFooter.value ? `${props.footerHeight}px` : '0px'
}))

// 暴露给父组件的API
defineExpose({
  toggleLeft: () => emit('update:leftCollapsed', !props.leftCollapsed),
  toggleRight: () => emit('update:rightCollapsed', !props.rightCollapsed),
  isEditMode,
  hasToolbar,
  hasLeft,
  hasRight
})
</script>

<template>
  <div
    class="panel-layout"
    :class="[props.customClass, { 'no-animations': !props.enableAnimations }]"
    :style="cssVariables"
  >
    <!-- 页面标题区域 -->
    <div v-if="displayHeader" class="header-area" :style="{ height: 'var(--header-height)' }">
      <slot name="header" :mode="props.mode" :isEditMode="isEditMode" />
    </div>

    <!-- 工具栏区域 -->
    <div v-if="displayToolbar" class="toolbar-area" :style="{ height: 'var(--toolbar-height)' }">
      <slot name="toolbar" :mode="props.mode" :isEditMode="isEditMode" />
    </div>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 中央主区域 -->
      <div ref="mainAreaRef" class="main-area">
        <slot name="main" :mode="props.mode" :isEditMode="isEditMode" />
      </div>

      <!-- 左侧抽屉 -->
      <NDrawer
        v-model:show="displayLeft"
        :width="props.leftWidth"
        placement="left"
        :auto-focus="false"
        :trap-focus="false"
        :block-scroll="false"
        :mask-closable="true"
        @update:show="handleLeftDrawerClose"
      >
        <NDrawerContent title="组件库" closable @close="() => handleLeftDrawerClose(false)">
          <slot name="left" :mode="props.mode" :isEditMode="isEditMode" />
        </NDrawerContent>
      </NDrawer>

      <!-- 右侧抽屉 -->
      <NDrawer
        v-model:show="displayRight"
        :width="props.rightWidth"
        placement="right"
        :auto-focus="false"
        :trap-focus="false"
        :block-scroll="false"
        :mask-closable="true"
        @update:show="handleRightDrawerClose"
      >
        <NDrawerContent title="属性配置" closable @close="() => handleRightDrawerClose(false)">
          <slot name="right" :mode="props.mode" :isEditMode="isEditMode" />
        </NDrawerContent>
      </NDrawer>
    </div>

    <!-- 底部区域 -->
    <div v-if="displayFooter" class="footer-area" :style="{ height: 'var(--footer-height)' }">
      <slot name="footer" :mode="props.mode" :isEditMode="isEditMode" />
    </div>
  </div>
</template>

<style scoped>
/* 基础布局: 使用Flexbox实现垂直布局 */
.panel-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--panel-bg);
}

/* 禁用动画 */
.panel-layout.no-animations * {
  transition: none !important;
}

/* 头部、工具栏、底部区域: 固定高度，不收缩 */
.header-area,
.toolbar-area,
.footer-area {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid var(--panel-border);
  background-color: var(--toolbar-bg);
  z-index: 10;
}
.header-area {
  background-color: var(--panel-bg);
}
.footer-area {
  border-top: 1px solid var(--panel-border);
  border-bottom: none;
}

/* 主内容区: 占据剩余所有空间 */
.main-content {
  flex: 1;
  position: relative;
  display: flex;
  min-height: 0; /* flex布局关键属性，防止内容溢出时容器不收缩 */
}

/* 中央主区域: 占据主内容区的全部空间，并提供滚动 */
.main-area {
  flex: 1;
  min-width: 0;
  overflow: auto; /* 关键：滚动条在这里处理 */
  background-color: var(--panel-bg);
}

/* 自定义滚动条样式 */
.main-area::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.main-area::-webkit-scrollbar-track {
  background: transparent;
}
.main-area::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.4);
  border-radius: 3px;
}
.main-area::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.6);
}
</style>
