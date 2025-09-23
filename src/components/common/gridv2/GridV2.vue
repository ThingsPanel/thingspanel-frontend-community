<template>
  <!--
    GridV2 组件（已迁移到独立的 gridv2 模块）
    - 功能：不进行任何网格逻辑处理，仅将传入的 props 转换为字符串并展示出来
    - 用途：用于快速验证 props 传参（包括 idKey 任意重构）在渲染链路中的透传是否正确
    - 插槽：保持与 GridLayoutPlus 一致，提供默认插槽并传入 { item }，以便外层按原有写法渲染节点
  -->
  <div class="grid-v2">
    <h3 class="grid-v2__title">GridV2 Props 调试输出</h3>
    <!-- 以 JSON 字符串的形式展示 props（对 layout 进行轻量化提取，避免循环引用） -->
    <pre class="grid-v2__content">{{ serialized }}</pre>

    <!--
      插槽渲染区：与 GridLayoutPlus 对齐，遍历 layout 并为每个 item 提供默认插槽参数 { item }
      - 这样可以无缝替换 GridLayoutPlus 而不修改调用方模板
    -->
    <div class="grid-v2__slot-list" v-if="Array.isArray(props.layout) && props.layout.length">
      <div class="grid-v2__item" v-for="item in props.layout" :key="item.i">
        <!-- 默认插槽，向外暴露 { item }，以便外部用 <template #default="{ item }"> 正常渲染 -->
        <slot :item="item">
          <!-- 插槽兜底：如外部未提供默认插槽，展示当前 item 的轻量信息 -->
          <pre class="grid-v2__item-fallback">{{ formatItem(item) }}</pre>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * GridV2
 * - 该组件的 Props 接口与 `GridLayoutPlus` 保持完全一致（GridLayoutPlusProps）。
 * - 为了兼容 v-model:layout 的写法，事件类型也与 GridLayoutPlusEmits 对齐（组件自身不主动触发这些事件）。
 * - 组件不进行任何业务处理，仅用来将 props 转为字符串进行展示，便于调试主键（idKey）等协议。
 */
import type { GridLayoutPlusProps, GridLayoutPlusEmits, GridLayoutPlusItem } from '@/components/common/grid/gridLayoutPlusTypes'
import { computed } from 'vue'

// 使用与 GridLayoutPlus 完全一致的 Props 类型定义
const props = defineProps<GridLayoutPlusProps>()

// 事件签名保持一致（本组件不主动 emit，仅为类型与调用方监听对齐）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const emit = defineEmits<GridLayoutPlusEmits>()

/**
 * 提取用于展示的轻量 Item 信息，避免将复杂/循环引用对象（如 raw/component）参与序列化
 */
function pickDisplayItem(item: GridLayoutPlusItem, idKey?: string): Record<string, unknown> {
  const key = idKey && idKey.length > 0 ? idKey : 'i'
  const display: Record<string, unknown> = {
    i: item.i,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
    type: item.type,
    title: item.title
  }
  // 当外部使用了自定义主键别名时，补充该字段便于观察
  if (key !== 'i') {
    display[key] = (item as unknown as Record<string, unknown>)[key] ?? item.i
  }
  return display
}

/**
 * 将所有 props 内容序列化为可读性较好的 JSON 字符串
 * 注意：为避免 Vue 响应式 Proxy 与循环引用问题，这里对 layout 做了轻量映射，只保留关键信息
 */
const serialized = computed<string>(() => {
  const plain: Record<string, unknown> = {
    // 逐项铺平，避免直接展开 Proxy
    layout: Array.isArray(props.layout) ? props.layout.map(it => pickDisplayItem(it, props.idKey)) : [],
    readonly: props.readonly,
    showGrid: props.showGrid,
    showDropZone: props.showDropZone,
    showTitle: props.showTitle,
    config: props.config,
    containerStyle: props.containerStyle,
    containerClass: props.containerClass,
    idKey: props.idKey
  }
  return JSON.stringify(plain, null, 2)
})

/**
 * 单个条目的格式化输出（用于插槽兜底内容）
 */
function formatItem(item: GridLayoutPlusItem): string {
  return JSON.stringify(pickDisplayItem(item, props.idKey), null, 2)
}
</script>

<style scoped>
.grid-v2 {
  /* 简单的容器样式，便于阅读输出内容 */
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background-color: #fafafa;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.grid-v2__title {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #555;
}

.grid-v2__content {
  margin: 0 0 12px 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.grid-v2__slot-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.grid-v2__item {
  padding: 8px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  background: #fff;
}

.grid-v2__item-fallback {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>