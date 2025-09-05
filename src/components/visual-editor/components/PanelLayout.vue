<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { NDrawer, NDrawerContent } from 'naive-ui'
import { useThemeStore } from '@/store/modules/theme'

interface Props {
  // 基础模式
  mode?: 'edit' | 'preview'

  // 侧边栏控制
  leftCollapsed?: boolean
  rightCollapsed?: boolean
  leftWidth?: number
  rightWidth?: number

  // 🔥 新增：显示控制选项
  showHeader?: boolean // 控制标题区域显示
  showToolbar?: boolean // 控制工具栏显示
  showFooter?: boolean // 控制底部区域显示（新增）

  // 🔥 新增：高度控制选项
  headerHeight?: number // 标题栏高度
  toolbarHeight?: number // 工具栏高度
  footerHeight?: number // 底部栏高度

  // 🔥 新增：动画和交互选项
  enableAnimations?: boolean // 启用过渡动画
  enableResize?: boolean // 启用侧边栏拖拽调整

  // 🔥 新增：自定义样式类
  customClass?: string // 自定义CSS类
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'edit',
  leftCollapsed: false,
  rightCollapsed: false,
  leftWidth: 280,
  rightWidth: 320,

  // 🔥 新增默认值
  showHeader: true,
  showToolbar: true,
  showFooter: false,

  headerHeight: 60,
  toolbarHeight: 48,
  footerHeight: 40,

  enableAnimations: true,
  enableResize: false,

  customClass: ''
})

const emit = defineEmits<{
  'update:leftCollapsed': [value: boolean]
  'update:rightCollapsed': [value: boolean]
}>()

// 🔥 抽屉关闭事件处理
const handleLeftDrawerClose = (show: boolean) => {
  if (!show) {
    // 当抽屉关闭时，设置leftCollapsed为true
    emit('update:leftCollapsed', true)
  }
}

const handleRightDrawerClose = (show: boolean) => {
  if (!show) {
    // 当抽屉关闭时，设置rightCollapsed为true
    emit('update:rightCollapsed', true)
  }
}

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

// 🔥 优化：插槽存在性检查
const hasHeader = computed(() => !!slots.header)
const hasToolbar = computed(() => !!slots.toolbar)
const hasLeft = computed(() => !!slots.left)
const hasRight = computed(() => !!slots.right)
const hasFooter = computed(() => !!slots.footer)

// 🔥 优化：显示条件 - 适配抽屉模式
const displayHeader = computed(() => props.showHeader && hasHeader.value)
const displayToolbar = computed(() => props.showToolbar && hasToolbar.value) // 🔥 移除 isEditMode 限制，预览模式也显示工具栏
const displayLeft = computed(() => isEditMode.value && hasLeft.value && !props.leftCollapsed)
const displayRight = computed(() => isEditMode.value && hasRight.value && !props.rightCollapsed)
const displayFooter = computed(() => props.showFooter && hasFooter.value)

// 🔥 新增：动态高度计算
const dynamicHeights = computed(() => {
  // 🔥 强制修复：确保正确的高度计算逻辑  
  let totalFixedHeight = 0
  
  // 🔥 直接计算固定区域高度，不依赖任何条件判断
  if (props.showHeader && slots.header) {
    totalFixedHeight += props.headerHeight
    console.log('✅ 添加 header 高度:', props.headerHeight)
  }
  if (props.showToolbar && slots.toolbar) {
    totalFixedHeight += props.toolbarHeight
    console.log('✅ 添加 toolbar 高度:', props.toolbarHeight)
  }
  if (props.showFooter && slots.footer) {
    totalFixedHeight += props.footerHeight  
    console.log('✅ 添加 footer 高度:', props.footerHeight)
  }

  const safetyMargin = 10
  const actualTotal = Math.max(118, totalFixedHeight + safetyMargin) // 🔥 确保最小值118px
  const availableHeight = Math.max(300, window.innerHeight - actualTotal)
  
  // 🔥🔥🔥 强制确保正确的CSS格式！永远是正数！
  const correctMainHeightCss = `calc(100vh - ${actualTotal}px)`
  
  // 🔥 调试：输出所有相关值
  console.log('🔥🔥🔥 CRITICAL 高度计算调试:', {
    'header显示': props.showHeader,
    'header插槽': !!slots.header,
    'header高度': props.headerHeight,
    'toolbar显示': props.showToolbar, 
    'toolbar插槽': !!slots.toolbar,
    'toolbar高度': props.toolbarHeight,
    'footer显示': props.showFooter,
    'footer插槽': !!slots.footer,
    'footer高度': props.footerHeight,
    totalFixedHeight,
    safetyMargin,
    actualTotal,
    '绝对值actualTotal': Math.abs(actualTotal),
    availableHeight,
    windowHeight: window.innerHeight,
    '最终CSS应该是': correctMainHeightCss,
    '检查actualTotal是否负数': actualTotal < 0 ? '⚠️ 负数!' : '✅ 正数'
  })

  // 🔥 如果actualTotal是负数，强制设为合理值
  if (actualTotal < 0) {
    console.error('❌ actualTotal 是负数！强制修正为118')
    const forcedTotal = 118 // 强制使用一个合理的固定值
    return {
      fixedHeight: totalFixedHeight,
      availableHeight: Math.max(300, window.innerHeight - forcedTotal),
      mainHeight: `${Math.max(300, window.innerHeight - forcedTotal)}px`,
      mainHeightCss: `calc(100vh - ${forcedTotal}px)`, // 🔥 强制正值
      headerHeight: `${props.headerHeight}px`,
      toolbarHeight: `${props.toolbarHeight}px`,
      footerHeight: `${props.footerHeight}px`,
      safetyMargin,
      actualTotal: forcedTotal
    }
  }

  return {
    fixedHeight: totalFixedHeight,
    availableHeight,
    mainHeight: `${availableHeight}px`,
    mainHeightCss: correctMainHeightCss, // 🔥 使用正确变量
    headerHeight: `${props.headerHeight}px`,
    toolbarHeight: `${props.toolbarHeight}px`,
    footerHeight: `${props.footerHeight}px`,
    safetyMargin,
    actualTotal
  }
})

// 🔥 CSS Variables 用于向子组件传递高度信息
const cssVariables = computed(() => ({
  ...themeColors.value,
  '--available-height': `${dynamicHeights.value.availableHeight}px`,
  '--main-height': dynamicHeights.value.mainHeightCss,
  '--header-height': dynamicHeights.value.headerHeight,
  '--toolbar-height': dynamicHeights.value.toolbarHeight,
  '--footer-height': dynamicHeights.value.footerHeight
}))

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
  hasRight: hasRight.value,
  // 🔥 新增：高度信息暴露给父组件
  dynamicHeights: dynamicHeights.value,
  availableHeight: dynamicHeights.value.availableHeight
})
</script>

<template>
  <div
    class="panel-layout h-full w-full flex flex-col"
    :class="[props.customClass, { 'no-animations': !props.enableAnimations }]"
    :style="cssVariables"
  >
    <!-- 🔥 新增：页面标题区域 -->
    <div
      v-if="displayHeader"
      class="header-area flex-shrink-0 px-4 flex items-center justify-between"
      :class="{ 'transition-all duration-300': props.enableAnimations }"
      :style="{
        height: dynamicHeights.headerHeight,
        backgroundColor: 'var(--panel-bg)',
        borderBottom: '1px solid var(--panel-border)'
      }"
    >
      <slot name="header" :mode="props.mode" :isEditMode="isEditMode" />
    </div>

    <!-- 🔥 优化：工具栏区域 -->
    <div
      v-if="displayToolbar"
      class="toolbar-area flex-shrink-0 px-4 flex items-center justify-between"
      :class="{ 'transition-all duration-300': props.enableAnimations }"
      :style="{
        height: dynamicHeights.toolbarHeight,
        backgroundColor: 'var(--toolbar-bg)',
        borderBottom: '1px solid var(--panel-border)'
      }"
    >
      <slot name="toolbar" :mode="props.mode" :isEditMode="isEditMode" />
    </div>

    <!-- 🔥 新改进：主内容区域 - 修复高度计算 -->
    <div
      class="main-content flex-1 overflow-hidden relative"
      :style="{
        height: dynamicHeights.mainHeightCss,
        backgroundColor: 'var(--panel-bg)'
      }"
    >
      <!-- 🔥 中央主区域 - 修复高度层级问题 -->
      <div
        class="main-area w-full overflow-auto"
        :class="{ 'transition-all duration-300': props.enableAnimations }"
        :style="{
          height: '100%',
          minHeight: '100%',
          backgroundColor: 'var(--panel-bg)'
        }"
      >
        <slot
          name="main"
          :mode="props.mode"
          :isEditMode="isEditMode"
          :availableHeight="dynamicHeights.availableHeight"
          :dynamicHeights="dynamicHeights"
        />
      </div>

      <!-- 🔥 左侧抽屉 -->
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

      <!-- 🔥 右侧抽屉 -->
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

    <!-- 🔥 新增：底部区域 -->
    <div
      v-if="displayFooter"
      class="footer-area flex-shrink-0 px-4 flex items-center justify-between"
      :class="{ 'transition-all duration-300': props.enableAnimations }"
      :style="{
        height: dynamicHeights.footerHeight,
        backgroundColor: 'var(--toolbar-bg)',
        borderTop: '1px solid var(--panel-border)'
      }"
    >
      <slot name="footer" :mode="props.mode" :isEditMode="isEditMode" />
    </div>
  </div>
</template>

<style scoped>
/* 🔥 优化：基础布局样式 */
.panel-layout {
  /* 确保布局占满全部空间 */
  min-height: 0;
  position: relative;
}

/* 🔥 新增：禁用动画模式 */
.panel-layout.no-animations * {
  transition: none !important;
}

/* 🔥 优化：各区域基础样式 */
.header-area,
.toolbar-area,
.footer-area {
  flex-shrink: 0;
  z-index: 10; /* 确保固定区域在上层 */
}

.main-content {
  /* 确保主内容区域能够正确处理 overflow */
  min-height: 0;
  flex: 1;
}

.left-area,
.right-area,
.main-area {
  /* 防止子元素溢出 */
  min-width: 0;
  min-height: 0;
}

/* 🔥 新增：侧边栏调整功能样式 */
.left-area.resizable,
.right-area.resizable {
  position: relative;
}

.left-area.resizable::after {
  content: '';
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  z-index: 10;
}

.right-area.resizable::before {
  content: '';
  position: absolute;
  left: -2px;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  z-index: 10;
}

.left-area.resizable::after:hover,
.right-area.resizable::before:hover {
  background: var(--primary-color, #1890ff);
  opacity: 0.3;
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
