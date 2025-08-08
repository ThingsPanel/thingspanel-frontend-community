<template>
  <div
    ref="containerRef"
    class="grid-plus-container"
    :class="[
      containerClass,
      {
        'grid-plus-readonly': readonly,
        'grid-plus-show-grid': showGrid
      }
    ]"
    :style="containerStyles"
  >
    <!-- GridStack 容器 -->
    <div ref="gridStackRef" class="grid-stack"></div>

    <!-- 网格信息 -->
    <div v-if="showGrid" class="grid-plus-grid-info">
      <span>{{ computedConfig.column }}列 × {{ gridRowCount }}行</span>
    </div>

    <!-- 使用 Teleport 将插槽内容传送到动态创建的容器中 -->
    <teleport v-for="item in items" :key="item.id" :to="`#grid-plus-slot-${item.id}`">
      <slot :item="item"></slot>
    </teleport>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import 'gridstack/dist/gridstack.min.css';
import type { GridProps, GridEmits } from './types';
import { useGridStack } from './useGridStack';
import { LIGHT_THEME, DARK_THEME } from './types';

// Props 定义
const props = withDefaults(defineProps<GridProps>(), {
  items: () => [],
  readonly: false,
  showGrid: false,
  showTitle: true,
  config: () => ({}),
  containerStyle: () => ({}),
  containerClass: '',
  theme: 'auto',
});

// Emits 定义
const emit = defineEmits<GridEmits>();

// 响应式状态
const gridStackRef = ref<HTMLElement | null>(null);
const gridRowCount = ref(0); // 暂时保留，后续可以考虑移入 hook

// 工具函数
const createItemContent = (item: GridItem): HTMLElement => {
  const itemWrapper = document.createElement('div');
  itemWrapper.className = 'grid-plus-item';
  itemWrapper.setAttribute('data-item-id', item.id);

  const header = props.showTitle && item.title
    ? `<div class="grid-plus-item-header">
         <span class="grid-plus-item-title">${item.title}</span>
         <div class="grid-plus-item-actions">
           <span class="grid-plus-item-position">${item.x},${item.y}</span>
         </div>
       </div>`
    : '';

  // 这里是关键：我们为 slot 创建一个容器
  const content = `<div class="grid-plus-item-content">
    <div id="grid-plus-slot-${item.id}"></div>
  </div>`;

  itemWrapper.innerHTML = `${header}${content}`;

  // 注意：因为我们是动态创建元素，Vue 的模板编译器不会处理它。
  // 如果需要将 Vue 组件作为内容，需要更复杂的处理，例如使用 Teleport 或者动态组件。
  // 对于简单的 HTML 或非 Vue 内容，这是可行的。
  // 如果 slot 内容是简单的，可以像下面这样处理，但它不会有 Vue 的响应性。
  // 如果需要完整的 Vue 功能，我们需要重新考虑实现方式。

  return itemWrapper;
};

// 使用自定义 Hook
const { getItems, compact, addItem, removeItem, updateItem } = useGridStack(
  gridStackRef,
  props,
  emit,
  createItemContent
);

// 计算属性
const currentTheme = computed(() => {
  if (props.theme === 'auto') {
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDark ? DARK_THEME : LIGHT_THEME;
  }
  return props.theme === 'dark' ? DARK_THEME : LIGHT_THEME;
});

const containerStyles = computed(() => ({
  ...props.containerStyle,
  backgroundColor: currentTheme.value.backgroundColor,
}));

// 暴露给父组件的方法
defineExpose({
  getItems,
  compact,
  addItem,
  removeItem,
  updateItem,
});
</script>

<style lang="scss" scoped>
.grid-plus-container {
  position: relative;
  width: 100%;
  min-height: 200px;
  overflow: hidden;
  transition: all 0.2s ease;
  user-select: none;
}

.grid-stack {
  width: 100%;
  min-height: 200px;
}

.grid-plus-grid-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1001;
  display: flex;
  gap: 8px;
}

/* GridStack 项目样式覆盖 */
:deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #fff);
  border: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  border-radius: 8px;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
  transition:
    transform 0.1s ease,
    width 0.1s ease,
    height 0.1s ease,
    box-shadow 0.2s ease;
  will-change: transform, width, height;
  overflow: hidden;
}

:deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.15));
  transform: translateY(-1px);
}

:deep(.grid-stack-item.ui-draggable-dragging) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item.ui-resizable-resizing) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  background-color: var(--grid-plus-item-header-bg-color, #f8f9fa);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 20px;
}

.grid-plus-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--grid-plus-item-title-color, #495057);
}

.grid-plus-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid-plus-item-position {
  font-size: 11px;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 10px;
}

.grid-plus-item-content {
  flex: 1;
  padding: 12px;
  overflow: auto;
  color: var(--grid-plus-text-color, #495057);
}

.grid-plus-item-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  font-style: italic;
}

/* 状态类 */
.grid-plus-readonly :deep(.grid-stack-item) {
  cursor: default;
}

.grid-plus-readonly :deep(.grid-stack-item:hover) {
  transform: none;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.grid-plus-readonly :deep(.ui-resizable-handle) {
  display: none;
}

/* 深色主题 */
[data-theme='dark'] .grid-plus-container {
  background-color: var(--grid-plus-bg-color, #1a1a1a);
}

[data-theme='dark'] :deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #2d2d2d);
  border-color: var(--grid-plus-item-border-color, #404040);
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
}

[data-theme='dark'] :deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.4));
}

[data-theme='dark'] .grid-plus-item-header {
  background-color: var(--grid-plus-item-header-bg-color, #333);
  border-color: var(--grid-plus-item-border-color, #404040);
}

[data-theme='dark'] .grid-plus-item-title {
  color: var(--grid-plus-item-title-color, #fff);
}

[data-theme='dark'] .grid-plus-item-content {
  color: var(--grid-plus-item-text-color, #fff);
}

[data-theme='dark'] .grid-plus-item-placeholder {
  color: var(--grid-plus-secondary-text-color, #b0b0b0);
}

/* 主题变量 */
:root {
  --grid-plus-bg-color: #f8f9fa;
  --grid-plus-item-bg-color: #fff;
  --grid-plus-item-border-color: #e1e5e9;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --grid-plus-item-header-bg-color: #f8f9fa;
  --grid-plus-item-title-color: #495057;
  --grid-plus-text-color: #495057;
  --grid-plus-secondary-text-color: #6c757d;
}

[data-theme='dark'] {
  --grid-plus-bg-color: #1a1a1a;
  --grid-plus-item-bg-color: #2d2d2d;
  --grid-plus-item-border-color: #404040;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  --grid-plus-item-header-bg-color: #333;
  --grid-plus-item-title-color: #fff;
  --grid-plus-text-color: #fff;
  --grid-plus-secondary-text-color: #b0b0b0;
}
</style>

</script>

<style scoped>
.grid-plus-container {
  position: relative;
  width: 100%;
  min-height: 200px;
  overflow: hidden;
  transition: all 0.2s ease;
  user-select: none;
}

.grid-stack {
  width: 100%;
  min-height: 200px;
}

.grid-plus-grid-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1001;
  display: flex;
  gap: 8px;
}

/* GridStack 项目样式覆盖 */
:deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #fff);
  border: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  border-radius: 8px;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
  transition:
    transform 0.1s ease,
    width 0.1s ease,
    height 0.1s ease,
    box-shadow 0.2s ease;
  will-change: transform, width, height;
  overflow: hidden;
}

:deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.15));
  transform: translateY(-1px);
}

:deep(.grid-stack-item.ui-draggable-dragging) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item.ui-resizable-resizing) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  background-color: var(--grid-plus-item-header-bg-color, #f8f9fa);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 20px;
}

.grid-plus-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--grid-plus-item-title-color, #495057);
}

.grid-plus-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid-plus-item-position {
  font-size: 11px;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 10px;
}

.grid-plus-item-content {
  flex: 1;
  padding: 12px;
  overflow: auto;
  color: var(--grid-plus-text-color, #495057);
}

.grid-plus-item-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  font-style: italic;
}

/* 状态类 */
.grid-plus-readonly :deep(.grid-stack-item) {
  cursor: default;
}

.grid-plus-readonly :deep(.grid-stack-item:hover) {
  transform: none;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.grid-plus-readonly :deep(.ui-resizable-handle) {
  display: none;
}

/* 深色主题 */
[data-theme='dark'] .grid-plus-container {
  background-color: var(--grid-plus-bg-color, #1a1a1a);
}

[data-theme='dark'] :deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #2d2d2d);
  border-color: var(--grid-plus-item-border-color, #404040);
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
}

[data-theme='dark'] :deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.4));
}

[data-theme='dark'] .grid-plus-item-header {
  background-color: var(--grid-plus-item-header-bg-color, #333);
  border-color: var(--grid-plus-item-border-color, #404040);
}

[data-theme='dark'] .grid-plus-item-title {
  color: var(--grid-plus-item-title-color, #fff);
}

[data-theme='dark'] .grid-plus-item-content {
  color: var(--grid-plus-item-text-color, #fff);
}

[data-theme='dark'] .grid-plus-item-placeholder {
  color: var(--grid-plus-secondary-text-color, #b0b0b0);
}

/* 主题变量 */
:root {
  --grid-plus-bg-color: #f8f9fa;
  --grid-plus-item-bg-color: #fff;
  --grid-plus-item-border-color: #e1e5e9;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --grid-plus-item-header-bg-color: #f8f9fa;
  --grid-plus-item-title-color: #495057;
  --grid-plus-text-color: #495057;
  --grid-plus-secondary-text-color: #6c757d;
}

[data-theme='dark'] {
  --grid-plus-bg-color: #1a1a1a;
  --grid-plus-item-bg-color: #2d2d2d;
  --grid-plus-item-border-color: #404040;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  --grid-plus-item-header-bg-color: #333;
  --grid-plus-item-title-color: #fff;
  --grid-plus-text-color: #fff;
  --grid-plus-secondary-text-color: #b0b0b0;
}
</style>

</script>

<style scoped>
.grid-plus-container {
  position: relative;
  width: 100%;
  min-height: 200px;
  overflow: hidden;
  transition: all 0.2s ease;
  user-select: none;
}

.grid-stack {
  width: 100%;
  min-height: 200px;
}

.grid-plus-grid-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1001;
  display: flex;
  gap: 8px;
}

/* GridStack 项目样式覆盖 */
:deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #fff);
  border: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  border-radius: 8px;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
  transition:
    transform 0.1s ease,
    width 0.1s ease,
    height 0.1s ease,
    box-shadow 0.2s ease;
  will-change: transform, width, height;
  overflow: hidden;
}

:deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.15));
  transform: translateY(-1px);
}

:deep(.grid-stack-item.ui-draggable-dragging) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item.ui-resizable-resizing) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  background-color: var(--grid-plus-item-header-bg-color, #f8f9fa);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 20px;
}

.grid-plus-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--grid-plus-item-title-color, #495057);
}

.grid-plus-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid-plus-item-position {
  font-size: 11px;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 10px;
}

.grid-plus-item-content {
  flex: 1;
  padding: 12px;
  overflow: auto;
  color: var(--grid-plus-text-color, #495057);
}

.grid-plus-item-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  font-style: italic;
}

/* 状态类 */
.grid-plus-readonly :deep(.grid-stack-item) {
  cursor: default;
}

.grid-plus-readonly :deep(.grid-stack-item:hover) {
  transform: none;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.grid-plus-readonly :deep(.ui-resizable-handle) {
  display: none;
}

/* 深色主题 */
[data-theme='dark'] .grid-plus-container {
  background-color: var(--grid-plus-bg-color, #1a1a1a);
}

[data-theme='dark'] :deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #2d2d2d);
  border-color: var(--grid-plus-item-border-color, #404040);
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
}

[data-theme='dark'] :deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.4));
}

[data-theme='dark'] .grid-plus-item-header {
  background-color: var(--grid-plus-item-header-bg-color, #333);
  border-color: var(--grid-plus-item-border-color, #404040);
}

[data-theme='dark'] .grid-plus-item-title {
  color: var(--grid-plus-item-title-color, #fff);
}

[data-theme='dark'] .grid-plus-item-content {
  color: var(--grid-plus-item-text-color, #fff);
}

[data-theme='dark'] .grid-plus-item-placeholder {
  color: var(--grid-plus-secondary-text-color, #b0b0b0);
}

/* 主题变量 */
:root {
  --grid-plus-bg-color: #f8f9fa;
  --grid-plus-item-bg-color: #fff;
  --grid-plus-item-border-color: #e1e5e9;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --grid-plus-item-header-bg-color: #f8f9fa;
  --grid-plus-item-title-color: #495057;
  --grid-plus-text-color: #495057;
  --grid-plus-secondary-text-color: #6c757d;
}

[data-theme='dark'] {
  --grid-plus-bg-color: #1a1a1a;
  --grid-plus-item-bg-color: #2d2d2d;
  --grid-plus-item-border-color: #404040;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  --grid-plus-item-header-bg-color: #333;
  --grid-plus-item-title-color: #fff;
  --grid-plus-text-color: #fff;
  --grid-plus-secondary-text-color: #b0b0b0;
}
</style>

</script>

<style scoped>
.grid-plus-container {
  position: relative;
  width: 100%;
  min-height: 200px;
  overflow: hidden;
  transition: all 0.2s ease;
  user-select: none;
}

.grid-stack {
  width: 100%;
  min-height: 200px;
}

.grid-plus-grid-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1001;
  display: flex;
  gap: 8px;
}

/* GridStack 项目样式覆盖 */
:deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #fff);
  border: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  border-radius: 8px;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
  transition:
    transform 0.1s ease,
    width 0.1s ease,
    height 0.1s ease,
    box-shadow 0.2s ease;
  will-change: transform, width, height;
  overflow: hidden;
}

:deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.15));
  transform: translateY(-1px);
}

:deep(.grid-stack-item.ui-draggable-dragging) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item.ui-resizable-resizing) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  background-color: var(--grid-plus-item-header-bg-color, #f8f9fa);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 20px;
}

.grid-plus-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--grid-plus-item-title-color, #495057);
}

.grid-plus-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid-plus-item-position {
  font-size: 11px;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 10px;
}

.grid-plus-item-content {
  flex: 1;
  padding: 12px;
  overflow: auto;
  color: var(--grid-plus-text-color, #495057);
}

.grid-plus-item-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  font-style: italic;
}

/* 状态类 */
.grid-plus-readonly :deep(.grid-stack-item) {
  cursor: default;
}

.grid-plus-readonly :deep(.grid-stack-item:hover) {
  transform: none;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.grid-plus-readonly :deep(.ui-resizable-handle) {
  display: none;
}

/* 深色主题 */
[data-theme='dark'] .grid-plus-container {
  background-color: var(--grid-plus-bg-color, #1a1a1a);
}

[data-theme='dark'] :deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #2d2d2d);
  border-color: var(--grid-plus-item-border-color, #404040);
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
}

[data-theme='dark'] :deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.4));
}

[data-theme='dark'] .grid-plus-item-header {
  background-color: var(--grid-plus-item-header-bg-color, #333);
  border-color: var(--grid-plus-item-border-color, #404040);
}

[data-theme='dark'] .grid-plus-item-title {
  color: var(--grid-plus-item-title-color, #fff);
}

[data-theme='dark'] .grid-plus-item-content {
  color: var(--grid-plus-item-text-color, #fff);
}

[data-theme='dark'] .grid-plus-item-placeholder {
  color: var(--grid-plus-secondary-text-color, #b0b0b0);
}

/* 主题变量 */
:root {
  --grid-plus-bg-color: #f8f9fa;
  --grid-plus-item-bg-color: #fff;
  --grid-plus-item-border-color: #e1e5e9;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --grid-plus-item-header-bg-color: #f8f9fa;
  --grid-plus-item-title-color: #495057;
  --grid-plus-text-color: #495057;
  --grid-plus-secondary-text-color: #6c757d;
}

[data-theme='dark'] {
  --grid-plus-bg-color: #1a1a1a;
  --grid-plus-item-bg-color: #2d2d2d;
  --grid-plus-item-border-color: #404040;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  --grid-plus-item-header-bg-color: #333;
  --grid-plus-item-title-color: #fff;
  --grid-plus-text-color: #fff;
  --grid-plus-secondary-text-color: #b0b0b0;
}
</style>

</script>

<style scoped>
.grid-plus-container {
  position: relative;
  width: 100%;
  min-height: 200px;
  overflow: hidden;
  transition: all 0.2s ease;
  user-select: none;
}

.grid-stack {
  width: 100%;
  min-height: 200px;
}

.grid-plus-grid-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1001;
  display: flex;
  gap: 8px;
}

/* GridStack 项目样式覆盖 */
:deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #fff);
  border: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  border-radius: 8px;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
  transition:
    transform 0.1s ease,
    width 0.1s ease,
    height 0.1s ease,
    box-shadow 0.2s ease;
  will-change: transform, width, height;
  overflow: hidden;
}

:deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.15));
  transform: translateY(-1px);
}

:deep(.grid-stack-item.ui-draggable-dragging) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item.ui-resizable-resizing) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  background-color: var(--grid-plus-item-header-bg-color, #f8f9fa);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 20px;
}

.grid-plus-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--grid-plus-item-title-color, #495057);
}

.grid-plus-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid-plus-item-position {
  font-size: 11px;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 10px;
}

.grid-plus-item-content {
  flex: 1;
  padding: 12px;
  overflow: auto;
  color: var(--grid-plus-text-color, #495057);
}

.grid-plus-item-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  font-style: italic;
}

/* 状态类 */
.grid-plus-readonly :deep(.grid-stack-item) {
  cursor: default;
}

.grid-plus-readonly :deep(.grid-stack-item:hover) {
  transform: none;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.grid-plus-readonly :deep(.ui-resizable-handle) {
  display: none;
}

/* 深色主题 */
[data-theme='dark'] .grid-plus-container {
  background-color: var(--grid-plus-bg-color, #1a1a1a);
}

[data-theme='dark'] :deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #2d2d2d);
  border-color: var(--grid-plus-item-border-color, #404040);
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
}

[data-theme='dark'] :deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.4));
}

[data-theme='dark'] .grid-plus-item-header {
  background-color: var(--grid-plus-item-header-bg-color, #333);
  border-color: var(--grid-plus-item-border-color, #404040);
}

[data-theme='dark'] .grid-plus-item-title {
  color: var(--grid-plus-item-title-color, #fff);
}

[data-theme='dark'] .grid-plus-item-content {
  color: var(--grid-plus-item-text-color, #fff);
}

[data-theme='dark'] .grid-plus-item-placeholder {
  color: var(--grid-plus-secondary-text-color, #b0b0b0);
}

/* 主题变量 */
:root {
  --grid-plus-bg-color: #f8f9fa;
  --grid-plus-item-bg-color: #fff;
  --grid-plus-item-border-color: #e1e5e9;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --grid-plus-item-header-bg-color: #f8f9fa;
  --grid-plus-item-title-color: #495057;
  --grid-plus-text-color: #495057;
  --grid-plus-secondary-text-color: #6c757d;
}

[data-theme='dark'] {
  --grid-plus-bg-color: #1a1a1a;
  --grid-plus-item-bg-color: #2d2d2d;
  --grid-plus-item-border-color: #404040;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  --grid-plus-item-header-bg-color: #333;
  --grid-plus-item-title-color: #fff;
  --grid-plus-text-color: #fff;
  --grid-plus-secondary-text-color: #b0b0b0;
}
</style>

</script>

<style scoped>
.grid-plus-container {
  position: relative;
  width: 100%;
  min-height: 200px;
  overflow: hidden;
  transition: all 0.2s ease;
  user-select: none;
}

.grid-stack {
  width: 100%;
  min-height: 200px;
}

.grid-plus-grid-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1001;
  display: flex;
  gap: 8px;
}

/* GridStack 项目样式覆盖 */
:deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #fff);
  border: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  border-radius: 8px;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
  transition:
    transform 0.1s ease,
    width 0.1s ease,
    height 0.1s ease,
    box-shadow 0.2s ease;
  will-change: transform, width, height;
  overflow: hidden;
}

:deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.15));
  transform: translateY(-1px);
}

:deep(.grid-stack-item.ui-draggable-dragging) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item.ui-resizable-resizing) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  background-color: var(--grid-plus-item-header-bg-color, #f8f9fa);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 20px;
}

.grid-plus-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--grid-plus-item-title-color, #495057);
}

.grid-plus-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid-plus-item-position {
  font-size: 11px;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 10px;
}

.grid-plus-item-content {
  flex: 1;
  padding: 12px;
  overflow: auto;
  color: var(--grid-plus-text-color, #495057);
}

.grid-plus-item-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  font-style: italic;
}

/* 状态类 */
.grid-plus-readonly :deep(.grid-stack-item) {
  cursor: default;
}

.grid-plus-readonly :deep(.grid-stack-item:hover) {
  transform: none;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.grid-plus-readonly :deep(.ui-resizable-handle) {
  display: none;
}

/* 深色主题 */
[data-theme='dark'] .grid-plus-container {
  background-color: var(--grid-plus-bg-color, #1a1a1a);
}

[data-theme='dark'] :deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #2d2d2d);
  border-color: var(--grid-plus-item-border-color, #404040);
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
}

[data-theme='dark'] :deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.4));
}

[data-theme='dark'] .grid-plus-item-header {
  background-color: var(--grid-plus-item-header-bg-color, #333);
  border-color: var(--grid-plus-item-border-color, #404040);
}

[data-theme='dark'] .grid-plus-item-title {
  color: var(--grid-plus-item-title-color, #fff);
}

[data-theme='dark'] .grid-plus-item-content {
  color: var(--grid-plus-item-text-color, #fff);
}

[data-theme='dark'] .grid-plus-item-placeholder {
  color: var(--grid-plus-secondary-text-color, #b0b0b0);
}

/* 主题变量 */
:root {
  --grid-plus-bg-color: #f8f9fa;
  --grid-plus-item-bg-color: #fff;
  --grid-plus-item-border-color: #e1e5e9;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --grid-plus-item-header-bg-color: #f8f9fa;
  --grid-plus-item-title-color: #495057;
  --grid-plus-text-color: #495057;
  --grid-plus-secondary-text-color: #6c757d;
}

[data-theme='dark'] {
  --grid-plus-bg-color: #1a1a1a;
  --grid-plus-item-bg-color: #2d2d2d;
  --grid-plus-item-border-color: #404040;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  --grid-plus-item-header-bg-color: #333;
  --grid-plus-item-title-color: #fff;
  --grid-plus-text-color: #fff;
  --grid-plus-secondary-text-color: #b0b0b0;
}
</style>

</script>

<style scoped>
.grid-plus-container {
  position: relative;
  width: 100%;
  min-height: 200px;
  overflow: hidden;
  transition: all 0.2s ease;
  user-select: none;
}

.grid-stack {
  width: 100%;
  min-height: 200px;
}

.grid-plus-grid-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1001;
  display: flex;
  gap: 8px;
}

/* GridStack 项目样式覆盖 */
:deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #fff);
  border: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  border-radius: 8px;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
  transition:
    transform 0.1s ease,
    width 0.1s ease,
    height 0.1s ease,
    box-shadow 0.2s ease;
  will-change: transform, width, height;
  overflow: hidden;
}

:deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.15));
  transform: translateY(-1px);
}

:deep(.grid-stack-item.ui-draggable-dragging) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item.ui-resizable-resizing) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  background-color: var(--grid-plus-item-header-bg-color, #f8f9fa);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 20px;
}

.grid-plus-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--grid-plus-item-title-color, #495057);
}

.grid-plus-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid-plus-item-position {
  font-size: 11px;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 10px;
}

.grid-plus-item-content {
  flex: 1;
  padding: 12px;
  overflow: auto;
  color: var(--grid-plus-text-color, #495057);
}

.grid-plus-item-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  font-style: italic;
}

/* 状态类 */
.grid-plus-readonly :deep(.grid-stack-item) {
  cursor: default;
}

.grid-plus-readonly :deep(.grid-stack-item:hover) {
  transform: none;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.grid-plus-readonly :deep(.ui-resizable-handle) {
  display: none;
}

/* 深色主题 */
[data-theme='dark'] .grid-plus-container {
  background-color: var(--grid-plus-bg-color, #1a1a1a);
}

[data-theme='dark'] :deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #2d2d2d);
  border-color: var(--grid-plus-item-border-color, #404040);
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
}

[data-theme='dark'] :deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.4));
}

[data-theme='dark'] .grid-plus-item-header {
  background-color: var(--grid-plus-item-header-bg-color, #333);
  border-color: var(--grid-plus-item-border-color, #404040);
}

[data-theme='dark'] .grid-plus-item-title {
  color: var(--grid-plus-item-title-color, #fff);
}

[data-theme='dark'] .grid-plus-item-content {
  color: var(--grid-plus-item-text-color, #fff);
}

[data-theme='dark'] .grid-plus-item-placeholder {
  color: var(--grid-plus-secondary-text-color, #b0b0b0);
}

/* 主题变量 */
:root {
  --grid-plus-bg-color: #f8f9fa;
  --grid-plus-item-bg-color: #fff;
  --grid-plus-item-border-color: #e1e5e9;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --grid-plus-item-header-bg-color: #f8f9fa;
  --grid-plus-item-title-color: #495057;
  --grid-plus-text-color: #495057;
  --grid-plus-secondary-text-color: #6c757d;
}

[data-theme='dark'] {
  --grid-plus-bg-color: #1a1a1a;
  --grid-plus-item-bg-color: #2d2d2d;
  --grid-plus-item-border-color: #404040;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  --grid-plus-item-header-bg-color: #333;
  --grid-plus-item-title-color: #fff;
  --grid-plus-text-color: #fff;
  --grid-plus-secondary-text-color: #b0b0b0;
}
</style>

</script>

<style scoped>
.grid-plus-container {
  position: relative;
  width: 100%;
  min-height: 200px;
  overflow: hidden;
  transition: all 0.2s ease;
  user-select: none;
}

.grid-stack {
  width: 100%;
  min-height: 200px;
}

.grid-plus-grid-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1001;
  display: flex;
  gap: 8px;
}

/* GridStack 项目样式覆盖 */
:deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #fff);
  border: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  border-radius: 8px;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
  transition:
    transform 0.1s ease,
    width 0.1s ease,
    height 0.1s ease,
    box-shadow 0.2s ease;
  will-change: transform, width, height;
  overflow: hidden;
}

:deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.15));
  transform: translateY(-1px);
}

:deep(.grid-stack-item.ui-draggable-dragging) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item.ui-resizable-resizing) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  background-color: var(--grid-plus-item-header-bg-color, #f8f9fa);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 20px;
}

.grid-plus-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--grid-plus-item-title-color, #495057);
}

.grid-plus-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid-plus-item-position {
  font-size: 11px;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 10px;
}

.grid-plus-item-content {
  flex: 1;
  padding: 12px;
  overflow: auto;
  color: var(--grid-plus-text-color, #495057);
}

.grid-plus-item-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  font-style: italic;
}

/* 状态类 */
.grid-plus-readonly :deep(.grid-stack-item) {
  cursor: default;
}

.grid-plus-readonly :deep(.grid-stack-item:hover) {
  transform: none;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.grid-plus-readonly :deep(.ui-resizable-handle) {
  display: none;
}

/* 深色主题 */
[data-theme='dark'] .grid-plus-container {
  background-color: var(--grid-plus-bg-color, #1a1a1a);
}

[data-theme='dark'] :deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #2d2d2d);
  border-color: var(--grid-plus-item-border-color, #404040);
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
}

[data-theme='dark'] :deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.4));
}

[data-theme='dark'] .grid-plus-item-header {
  background-color: var(--grid-plus-item-header-bg-color, #333);
  border-color: var(--grid-plus-item-border-color, #404040);
}

[data-theme='dark'] .grid-plus-item-title {
  color: var(--grid-plus-item-title-color, #fff);
}

[data-theme='dark'] .grid-plus-item-content {
  color: var(--grid-plus-item-text-color, #fff);
}

[data-theme='dark'] .grid-plus-item-placeholder {
  color: var(--grid-plus-secondary-text-color, #b0b0b0);
}

/* 主题变量 */
:root {
  --grid-plus-bg-color: #f8f9fa;
  --grid-plus-item-bg-color: #fff;
  --grid-plus-item-border-color: #e1e5e9;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --grid-plus-item-header-bg-color: #f8f9fa;
  --grid-plus-item-title-color: #495057;
  --grid-plus-text-color: #495057;
  --grid-plus-secondary-text-color: #6c757d;
}

[data-theme='dark'] {
  --grid-plus-bg-color: #1a1a1a;
  --grid-plus-item-bg-color: #2d2d2d;
  --grid-plus-item-border-color: #404040;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  --grid-plus-item-header-bg-color: #333;
  --grid-plus-item-title-color: #fff;
  --grid-plus-text-color: #fff;
  --grid-plus-secondary-text-color: #b0b0b0;
}
</style>

</script>

<style scoped>
.grid-plus-container {
  position: relative;
  width: 100%;
  min-height: 200px;
  overflow: hidden;
  transition: all 0.2s ease;
  user-select: none;
}

.grid-stack {
  width: 100%;
  min-height: 200px;
}

.grid-plus-grid-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1001;
  display: flex;
  gap: 8px;
}

/* GridStack 项目样式覆盖 */
:deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #fff);
  border: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  border-radius: 8px;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
  transition:
    transform 0.1s ease,
    width 0.1s ease,
    height 0.1s ease,
    box-shadow 0.2s ease;
  will-change: transform, width, height;
  overflow: hidden;
}

:deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-
