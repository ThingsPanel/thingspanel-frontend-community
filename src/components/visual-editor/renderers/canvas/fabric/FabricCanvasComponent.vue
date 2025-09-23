<template>
  <div ref="fabricContainer" class="fabric-canvas-container">
    <!-- Fabric.js 依赖检查 -->
    <div v-if="!fabricAvailable" class="fabric-missing-container">
      <n-result status="warning" title="需要安装 Fabric.js" description="Fabric Canvas 渲染器需要 Fabric.js 依赖才能正常工作">
        <template #footer>
          <n-space vertical :size="16">
            <n-alert type="info" :show-icon="false">
              <strong>安装命令：</strong>
              <n-code>pnpm add fabric</n-code>
            </n-alert>
            <n-space>
              <n-button type="primary" @click="checkFabricAvailability">
                重新检测
              </n-button>
              <n-button @click="switchToSimpleRenderer">
                切换到简单渲染器
              </n-button>
            </n-space>
          </n-space>
        </template>
      </n-result>
    </div>

    <!-- Fabric Canvas 渲染区域 -->
    <div v-else class="fabric-canvas-wrapper">
      <!-- 工具栏信息 -->
      <div class="fabric-info-bar">
        <n-space align="center">
          <n-tag type="success">Fabric.js Canvas</n-tag>
          <n-text depth="3">节点数量: {{ nodes.length }}</n-text>
          <n-text depth="3">画布尺寸: {{ canvasSize.width }}×{{ canvasSize.height }}</n-text>
          <n-text v-if="props.readonly" type="warning">只读模式</n-text>
        </n-space>
      </div>

      <!-- Fabric 画布容器 -->
      <div ref="canvasContainer" class="fabric-canvas-area"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Fabric.js Canvas 组件
 * 基于 Fabric.js 6.7.1 的高级画布渲染器
 */

import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { NResult, NSpace, NAlert, NCode, NButton, NTag, NText } from 'naive-ui'
import FabricRenderer, { type FabricRendererConfig } from './FabricRenderer'
import type { VisualEditorWidget } from '@/components/visual-editor/types'

interface Props {
  graphData: any  // 来自外层的节点数据
  readonly?: boolean
  canvasConfig?: FabricRendererConfig
  showWidgetTitles?: boolean
  multiDataSourceStore?: Record<string, Record<string, any>>
  multiDataSourceConfigStore?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  canvasConfig: () => ({}),
  showWidgetTitles: false,
  multiDataSourceStore: () => ({}),
  multiDataSourceConfigStore: () => ({})
})

const emit = defineEmits(['node-select', 'request-settings'])

const message = useMessage()

// 组件状态
const fabricAvailable = ref(false)
const fabricContainer = ref<HTMLElement>()
const canvasContainer = ref<HTMLElement>()
const fabricRenderer = ref<FabricRenderer | null>(null)

// 从 graphData 中提取节点数据
const nodes = computed(() => props.graphData?.nodes || [])
const selectedNodes = computed(() => props.graphData?.selectedIds || [])

// 画布尺寸状态
const canvasSize = ref({ width: 1200, height: 800 })

/**
 * 检查 Fabric.js 依赖是否可用
 */
const checkFabricAvailability = async () => {
  try {
    // 动态导入 Fabric.js 进行检测
    const { Canvas } = await import('fabric')
    if (Canvas) {
      fabricAvailable.value = true
      console.log('✅ Fabric.js 6.7.1 依赖检测成功')

      // 初始化 Fabric 渲染器
      await initFabricRenderer()
    }
  } catch (error) {
    fabricAvailable.value = false
    console.warn('⚠️ Fabric.js 依赖未找到:', error)
  }
}

/**
 * 初始化 Fabric 渲染器
 */
const initFabricRenderer = async () => {
  if (!canvasContainer.value || fabricRenderer.value) return

  try {
    const config: FabricRendererConfig = {
      width: 1200,
      height: 800,
      backgroundColor: '#f8f9fa',
      selection: !props.readonly,
      interactive: !props.readonly,
      ...props.canvasConfig
    }

    fabricRenderer.value = new FabricRenderer(config)

    // 绑定事件
    fabricRenderer.value.onNodeSelect = handleNodeSelect
    fabricRenderer.value.onNodeMove = handleNodeMove
    fabricRenderer.value.onCanvasClick = handleCanvasClick
    fabricRenderer.value.onNodeContextMenu = handleNodeContextMenu

    // 初始化画布
    await fabricRenderer.value.init(canvasContainer.value)

    // 更新画布尺寸状态
    canvasSize.value = fabricRenderer.value.getSize()

    // 添加现有节点
    for (const node of nodes.value) {
      await fabricRenderer.value.addNode(node)
    }

    console.log('🎨 Fabric 渲染器组件初始化完成')

  } catch (error) {
    console.error('❌ Fabric 渲染器初始化失败:', error)
    message.error(`Fabric 渲染器初始化失败: ${error}`)
  }
}

/**
 * 切换到简单渲染器
 */
const switchToSimpleRenderer = () => {
  message.info('请在渲染器选择中切换到简单渲染器')
}

/**
 * 处理节点选择
 */
const handleNodeSelect = (nodeId: string) => {
  console.log('🎯 Fabric 节点选择:', nodeId)
  emit('node-select', nodeId)
}

/**
 * 处理节点移动
 */
const handleNodeMove = (nodeId: string, x: number, y: number) => {
  console.log('🎯 Fabric 节点移动:', nodeId, { x, y })
  // TODO: 更新节点在 store 中的位置
}

/**
 * 处理画布点击
 */
const handleCanvasClick = (event: MouseEvent) => {
  console.log('🎯 Fabric 画布点击')
  emit('node-select', '') // 清空选择
}

/**
 * 处理右键菜单
 */
const handleNodeContextMenu = (nodeId: string, event: MouseEvent) => {
  console.log('🎯 Fabric 右键菜单:', nodeId)
  emit('request-settings', nodeId)
}

/**
 * 监听节点数据变化
 */
watch(
  () => [nodes.value, props.multiDataSourceStore],
  async ([newNodes, newDataStore]) => {
    if (!fabricRenderer.value) return

    console.log('🔄 Fabric 数据更新:', {
      nodes: newNodes?.length || 0,
      dataSources: Object.keys(newDataStore || {}).length
    })

    // 简单的重新渲染策略
    fabricRenderer.value.clear()
    for (const node of newNodes || []) {
      await fabricRenderer.value.addNode(node)
    }
  },
  { deep: true }
)

/**
 * 监听只读模式变化
 */
watch(
  () => props.readonly,
  (newReadonly) => {
    if (fabricRenderer.value) {
      // TODO: 更新 Fabric 画布的交互模式
      console.log('🔄 Fabric 只读模式:', newReadonly)
    }
  }
)

// 生命周期
onMounted(async () => {
  await checkFabricAvailability()
})

onUnmounted(() => {
  if (fabricRenderer.value) {
    fabricRenderer.value.destroy()
    fabricRenderer.value = null
  }
})
</script>

<style scoped>
/* Fabric Canvas 容器样式 */
.fabric-canvas-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background: var(--n-color);
  border-radius: var(--n-border-radius);
}

/* Fabric 依赖缺失容器 */
.fabric-missing-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 600px;
  background: var(--n-color);
  border-radius: var(--n-border-radius);
}

/* Fabric Canvas 包装器 */
.fabric-canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 信息栏样式 */
.fabric-info-bar {
  padding: 12px 16px;
  background: var(--n-card-color);
  border-radius: var(--n-border-radius);
  margin: 16px 16px 0 16px;
  border: 1px solid var(--n-border-color);
  flex-shrink: 0;
}

/* Fabric 画布区域 */
.fabric-canvas-area {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

/* 画布样式 */
.fabric-canvas-area :deep(#fabric-canvas) {
  border: 1px solid var(--n-border-color);
  border-radius: var(--n-border-radius);
  box-shadow: var(--n-box-shadow-1);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .fabric-info-bar {
    margin: 12px;
    padding: 8px 12px;
  }

  .fabric-canvas-area {
    padding: 12px;
  }
}
</style>