<template>
  <!-- Fabric.js 依赖检查 -->
  <div v-if="!fabricAvailable" class="fabric-missing-container">
    <n-result status="warning" title="需要安装 Fabric.js" description="Canvas 渲染器需要 Fabric.js 依赖才能正常工作">
      <template #footer>
        <n-space vertical :size="16">
          <n-alert type="info" :show-icon="false">
            <strong>安装命令：</strong>
            <n-code>pnpm add fabric && pnpm add --save-dev @types/fabric</n-code>
          </n-alert>
          <n-space>
            <n-button type="primary" @click="checkFabricAvailability">
              重新检测
            </n-button>
            <n-button @click="switchToGridstack">
              切换到 GridStack 渲染器
            </n-button>
          </n-space>
        </n-space>
      </template>
    </n-result>
  </div>

  <!-- 简单Canvas渲染区域 - 平铺显示组件 -->
  <div v-else ref="canvasContainer" class="simple-canvas-wrapper">
    <!-- 工具栏信息 -->
    <div class="canvas-info-bar">
      <n-space align="center">
        <n-tag type="info">Canvas 渲染器</n-tag>
        <n-text depth="3">节点数量: {{ nodes.length }}</n-text>
        <n-text depth="3">数据源: {{ Object.keys(props.multiDataSourceStore || {}).length }}</n-text>
        <n-text v-if="props.readonly" type="warning">只读模式</n-text>
      </n-space>
    </div>

    <!-- 节点平铺显示区域 -->
    <div class="canvas-nodes-container" :class="{ 'show-grid': showGrid }">
      <div
        v-for="node in nodes"
        :key="node.id"
        class="canvas-node-item"
        :class="{
          'selected': selectedNodes.includes(node.id),
          'readonly': props.readonly
        }"
        @click="handleNodeClick(node.id)"
      >
        <!-- 使用 NodeWrapper 渲染实际组件 -->
        <NodeWrapper
          :node="node"
          :node-id="node.id"
          :readonly="props.readonly"
          :is-selected="selectedNodes.includes(node.id)"
          :show-resize-handles="false"
          :get-widget-component="() => null"
          :multi-data-source-data="props.multiDataSourceStore?.[node.id]"
          :multi-data-source-config="props.multiDataSourceConfigStore?.[node.id]"
          @node-click="() => handleNodeClick(node.id)"
          @title-update="handleTitleUpdate"
        />

        <!-- 节点信息叠加层 -->
        <div v-if="props.showWidgetTitles" class="node-info-overlay">
          <n-tag size="small" type="primary">{{ node.type }}</n-tag>
          <n-text depth="3" style="font-size: 12px;">{{ node.id }}</n-text>
        </div>

        <!-- 数据源指示器 -->
        <div v-if="props.multiDataSourceStore?.[node.id]" class="data-source-indicator">
          <n-tooltip trigger="hover">
            <template #trigger>
              <n-tag size="tiny" type="success">数据</n-tag>
            </template>
            已绑定数据源
          </n-tooltip>
        </div>
      </div>
    </div>

    <!-- 空状态显示 -->
    <div v-if="nodes.length === 0" class="empty-state">
      <n-empty description="暂无节点数据">
        <template #icon>
          <n-icon size="48">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
              <path d="M2 17L12 22L22 17"/>
              <path d="M2 12L12 17L22 12"/>
            </svg>
          </n-icon>
        </template>
      </n-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 简单 Canvas 包装器组件 - 纯渲染层
 * 负责接收数据并以简单平铺方式展示节点
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { NResult, NSpace, NAlert, NCode, NButton, NTag, NText, NTooltip, NEmpty, NIcon } from 'naive-ui'
import { $t } from '@/locales'
import NodeWrapper from '@/components/visual-editor/renderers/base/NodeWrapper.vue'

// Props 接口定义 - 完全按照 GridLayoutPlusWrapper 的模式
const props = withDefaults(defineProps<{
  graphData: any  // 来自外层的节点数据
  readonly?: boolean
  canvasConfig?: any  // Canvas 特定配置
  showWidgetTitles?: boolean
  multiDataSourceStore?: Record<string, Record<string, any>>  // 数据源数据
  multiDataSourceConfigStore?: Record<string, any>  // 数据源配置
}>(), {
  readonly: false,
  canvasConfig: () => ({}),
  showWidgetTitles: false,
  multiDataSourceStore: () => ({}),
  multiDataSourceConfigStore: () => ({})
})

const emit = defineEmits(['node-select', 'request-settings'])

const message = useMessage()

// 组件状态 - 暂时设为true，跳过Fabric检查
const fabricAvailable = ref(true)
const canvasContainer = ref<HTMLElement>()

// 从 graphData 中提取节点数据
const nodes = computed(() => props.graphData?.nodes || [])
const selectedNodes = computed(() => props.graphData?.selectedIds || [])

// 简单的网格显示控制
const showGrid = ref(props.canvasConfig?.showGrid ?? true)

/**
 * 检查 Fabric.js 依赖是否可用 (临时跳过)
 */
const checkFabricAvailability = async () => {
  // 暂时直接设为可用，跳过复杂的检查逻辑
  fabricAvailable.value = true
  console.log('[FabricCanvasWrapper] 使用简单渲染模式')
}

/**
 * 切换到 GridStack 渲染器
 */
const switchToGridstack = () => {
  message.info('请在渲染器选择中切换到 GridStack')
}

/**
 * 处理节点点击
 */
const handleNodeClick = (nodeId: string) => {
  console.log('[FabricCanvasWrapper] 节点点击:', nodeId)
  emit('node-select', nodeId)
}

/**
 * 处理标题更新
 */
const handleTitleUpdate = (nodeId: string, newTitle: string) => {
  console.log('[FabricCanvasWrapper] 标题更新:', nodeId, newTitle)
}

/**
 * 监听数据变化
 */
watch(
  () => [props.graphData, props.multiDataSourceStore],
  ([newGraphData, newDataStore]) => {
    console.log('[FabricCanvasWrapper] 数据更新:', {
      nodes: newGraphData?.nodes?.length || 0,
      dataSources: Object.keys(newDataStore || {}).length
    })
  },
  { deep: true }
)

// 生命周期
onMounted(async () => {
  await checkFabricAvailability()
  console.log('[FabricCanvasWrapper] 组件已挂载，节点数量:', nodes.value.length)
})
</script>

<style scoped>
/* 简单Canvas包装器样式 */
.simple-canvas-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background: var(--n-color);
  border-radius: var(--n-border-radius);
  padding: 16px;
}

/* Fabric依赖缺失容器 */
.fabric-missing-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 600px;
  background: var(--n-color);
  border-radius: var(--n-border-radius);
}

/* 信息栏样式 */
.canvas-info-bar {
  padding: 12px 16px;
  background: var(--n-card-color);
  border-radius: var(--n-border-radius);
  margin-bottom: 16px;
  border: 1px solid var(--n-border-color);
}

/* 节点容器样式 */
.canvas-nodes-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 16px;
  min-height: 400px;
}

/* 网格背景 */
.canvas-nodes-container.show-grid {
  background-image:
    linear-gradient(var(--n-border-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--n-border-color) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0, 0 0;
}

/* 节点项样式 */
.canvas-node-item {
  position: relative;
  min-height: 200px;
  border: 2px solid var(--n-border-color);
  border-radius: var(--n-border-radius);
  background: var(--n-card-color);
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.canvas-node-item:hover {
  border-color: var(--n-primary-color);
  box-shadow: var(--n-box-shadow-2);
  transform: translateY(-2px);
}

.canvas-node-item.selected {
  border-color: var(--n-primary-color);
  box-shadow: 0 0 0 2px var(--n-primary-color-pressed);
  background: var(--n-primary-color-suppl);
}

.canvas-node-item.readonly {
  cursor: default;
  opacity: 0.8;
}

.canvas-node-item.readonly:hover {
  transform: none;
}

/* 节点信息叠加层 */
.node-info-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
}

/* 数据源指示器 */
.data-source-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  grid-column: 1 / -1;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .canvas-nodes-container {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 12px;
  }

  .simple-canvas-wrapper {
    padding: 12px;
  }
}

/* 节点内容区域 */
.canvas-node-item :deep(.node-wrapper-content) {
  height: 100%;
  overflow: hidden;
}
</style>