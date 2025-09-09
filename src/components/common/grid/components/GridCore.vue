<!--
  Grid 核心组件
  负责网格布局的核心逻辑和渲染
-->
<template>
  <GridLayout
    v-model:layout="internalLayout"
    :col-num="config.colNum"
    :row-height="config.rowHeight"
    :is-draggable="!readonly && config.isDraggable && !config.staticGrid"
    :is-resizable="!readonly && config.isResizable && !config.staticGrid"
    :is-mirrored="config.isMirrored"
    :auto-size="config.autoSize"
    :vertical-compact="config.verticalCompact"
    :margin="config.margin"
    :use-css-transforms="config.useCssTransforms"
    :responsive="config.responsive"
    :breakpoints="config.breakpoints"
    :cols="config.cols"
    :prevent-collision="config.preventCollision"
    :use-style-cursor="config.useStyleCursor"
    :restore-on-drag="config.restoreOnDrag"
    @layout-created="handleLayoutCreated"
    @layout-before-mount="handleLayoutBeforeMount"
    @layout-mounted="handleLayoutMounted"
    @layout-updated="handleLayoutUpdated"
    @layout-ready="handleLayoutReady"
    @update:layout="handleLayoutChange"
    @breakpoint-changed="handleBreakpointChanged"
    @container-resized="handleContainerResized"
    @item-resize="handleItemResize"
    @item-resized="handleItemResized"
    @item-move="handleItemMove"
    @item-moved="handleItemMoved"
  >
    <GridItem
      v-for="item in internalLayout"
      :key="item.i"
      :x="item.x"
      :y="item.y"
      :w="item.w"
      :h="item.h"
      :i="item.i"
      :min-w="item.minW"
      :min-h="item.minH"
      :max-w="item.maxW"
      :max-h="item.maxH"
      :is-draggable="!readonly && item.isDraggable !== false && !item.static"
      :is-resizable="!readonly && item.isResizable !== false && !item.static"
      :static="item.static"
      :drag-ignore-from="item.dragIgnoreFrom"
      :drag-allow-from="item.dragAllowFrom"
      :resize-ignore-from="item.resizeIgnoreFrom"
      :preserve-aspect-ratio="item.preserveAspectRatio"
      :drag-option="item.dragOption"
      :resize-option="item.resizeOption"
      @resize="(i, newH, newW, newHPx, newWPx) => handleItemResize(i, newH, newW, newHPx, newWPx)"
      @resized="(i, newH, newW, newHPx, newWPx) => handleItemResized(i, newH, newW, newHPx, newWPx)"
      @move="(i, newX, newY) => handleItemMove(i, newX, newY)"
      @moved="(i, newX, newY) => handleItemMoved(i, newX, newY)"
      @container-resized="(i, newH, newW, newHPx, newWPx) => handleItemContainerResized(i, newH, newW, newHPx, newWPx)"
    >
      <GridItemContent :item="item" :readonly="readonly" :show-title="showTitle">
        <template #default="{ item: slotItem }">
          <slot :item="slotItem">
            <!-- 回退到默认内容 -->
          </slot>
        </template>
      </GridItemContent>
    </GridItem>
  </GridLayout>
</template>

<script setup lang="ts">
/**
 * Grid 核心组件
 * 专注于网格布局的核心功能和事件处理
 */

import { computed, shallowRef, watch } from 'vue'
import { GridLayout, GridItem } from 'grid-layout-plus'
import GridItemContent from './GridItemContent.vue'
import type { GridLayoutPlusConfig, GridLayoutPlusItem, GridLayoutPlusEmits } from '../gridLayoutPlusTypes'

interface Props {
  /** 网格布局数据 */
  layout: GridLayoutPlusItem[]
  /** 网格配置 */
  config: GridLayoutPlusConfig
  /** 是否只读模式 */
  readonly?: boolean
  /** 是否显示网格项标题 */
  showTitle?: boolean
}

interface Emits extends GridLayoutPlusEmits {}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  showTitle: false
})

const emit = defineEmits<Emits>()

// 内部布局状态
const internalLayout = shallowRef<GridLayoutPlusItem[]>([...props.layout])

// 监听外部布局变化
watch(
  () => props.layout,
  newLayout => {
    internalLayout.value = [...newLayout]
  },
  { deep: true }
)

// 事件处理函数
const handleLayoutCreated = (event: any) => {
  emit('layout-created', event)
}

const handleLayoutBeforeMount = (event: any) => {
  emit('layout-before-mount', event)
}

const handleLayoutMounted = (event: any) => {
  emit('layout-mounted', event)
}

const handleLayoutUpdated = (event: any) => {
  emit('layout-updated', event)
}

const handleLayoutReady = (event: any) => {
  emit('layout-ready', event)
}

const handleLayoutChange = (newLayout: GridLayoutPlusItem[]) => {
  internalLayout.value = newLayout
  emit('layout-change', newLayout)
}

const handleBreakpointChanged = (breakpoint: string, layout: GridLayoutPlusItem[]) => {
  emit('breakpoint-changed', breakpoint, layout)
}

const handleContainerResized = (width: number, height: number, cols: number) => {
  emit('container-resized', width, height, cols)
}

const handleItemResize = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  emit('item-resize', i, newH, newW, newHPx, newWPx)
}

const handleItemResized = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  emit('item-resized', i, newH, newW, newHPx, newWPx)
}

const handleItemMove = (i: string, newX: number, newY: number) => {
  emit('item-move', i, newX, newY)
}

const handleItemMoved = (i: string, newX: number, newY: number) => {
  emit('item-moved', i, newX, newY)
}

const handleItemContainerResized = (i: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  emit('item-container-resized', i, newH, newW, newHPx, newWPx)
}

// 暴露内部状态给父组件
defineExpose({
  internalLayout
})
</script>

<style scoped>
/* Grid 核心样式将继承父组件的样式 */
</style>
