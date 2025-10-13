<script setup lang="ts">
/**
 * IOT 可视化编辑器主组件
 * 整合 noyau 核心引擎、cartes 卡片框架、renderers 渲染器层
 */

import { ref, onMounted, watch, nextTick } from 'vue'
import {
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NButton,
  NSpace,
  NMessageProvider
} from 'naive-ui'
import { useEditorBridge } from './composables/useEditorBridge'
import { useRenderer } from './composables/useRenderer'
import { initializeCardRegistry } from '../cartes'

/**
 * 初始化编辑器
 */
const canvasContainer = ref<HTMLElement>()
const { renderTree, addCard, selectAll, clearSelection, undo, redo, canUndo, canRedo } =
  useEditorBridge()
const { initRenderer, updateRenderTree, isReady, error } = useRenderer()

/**
 * 组件挂载
 */
onMounted(async () => {
  try {
    // 初始化卡片注册表（加载所有 Card2.1 组件）
    await initializeCardRegistry()

    // 等待 DOM 渲染
    await nextTick()

    // 检查容器元素是否存在
    if (!canvasContainer.value) {
      console.error('[Editor] 画布容器元素未找到')
      return
    }

    console.log('[Editor] 开始初始化渲染器，容器:', canvasContainer.value)

    // 初始化渲染器
    await initRenderer(canvasContainer.value, renderTree.value, 'vue', {
      showGrid: true,
      gridSize: 10,
      snapToGrid: true
    })

    console.log('[Editor] 渲染器初始化成功')
  } catch (error) {
    console.error('[Editor] 初始化失败:', error)
  }
})

/**
 * 监听渲染树变化，自动更新渲染器
 */
watch(
  renderTree,
  async newTree => {
    if (isReady.value) {
      await updateRenderTree(newTree)
    }
  },
  { deep: true }
)

/**
 * 测试：添加一个示例卡片
 */
function addTestCard() {
  // 尝试添加 alert-status 卡片（来自 Card2.1 系统）
  addCard('alert-status', { x: 100, y: 100 })
}

/**
 * 测试：添加测试卡片
 */
function addTestCard2() {
  // 添加测试卡片
  addCard('test-card', { x: 300, y: 100 })
}
</script>

<template>
  <div class="iot-visualization-editor">
    <NMessageProvider>
      <NLayout has-sider class="h-screen">
        <!-- 左侧边栏：组件库 -->
        <NLayoutSider
          bordered
          :width="280"
          :collapsed-width="0"
          collapse-mode="width"
          show-trigger="bar"
          content-style="padding: 16px;"
        >
          <h3 class="mb-4 text-lg font-semibold">组件库</h3>
          <div class="space-y-2">
            <NButton type="primary" @click="addTestCard"> 添加告警卡片 </NButton>
            <NButton type="info" @click="addTestCard2"> 添加测试卡片 </NButton>
          </div>
          <!-- 未来：WidgetLibrary 组件 -->
        </NLayoutSider>

        <!-- 主内容区 -->
        <NLayout>
          <!-- 顶部工具栏 -->
          <NLayoutHeader bordered style="height: 60px; padding: 12px 16px">
            <NSpace align="center" justify="space-between">
              <NSpace>
                <NButton :disabled="!canUndo" @click="undo">
                  <template #icon>
                    <i class="i-carbon-undo" />
                  </template>
                  撤销
                </NButton>
                <NButton :disabled="!canRedo" @click="redo">
                  <template #icon>
                    <i class="i-carbon-redo" />
                  </template>
                  重做
                </NButton>
              </NSpace>

              <NSpace>
                <NButton @click="selectAll">全选</NButton>
                <NButton @click="clearSelection">清空选择</NButton>
              </NSpace>
            </NSpace>
          </NLayoutHeader>

          <!-- 画布区域 -->
          <NLayoutContent content-style="padding: 0;">
            <!-- 错误提示 -->
            <div v-if="error" class="error-message">
              <i class="i-carbon-warning" />
              <span>{{ error }}</span>
            </div>

            <!-- 渲染器容器 -->
            <div ref="canvasContainer" class="canvas-wrapper" />
          </NLayoutContent>
        </NLayout>

        <!-- 右侧边栏：属性面板 -->
        <NLayoutSider
          bordered
          :width="320"
          :collapsed-width="0"
          collapse-mode="width"
          show-trigger="bar"
          position="right"
          content-style="padding: 16px;"
        >
          <h3 class="mb-4 text-lg font-semibold">属性面板</h3>
          <p class="text-sm text-gray-500">选中节点后显示属性配置</p>
          <!-- 未来：PropertiesPanel 组件 -->
        </NLayoutSider>
      </NLayout>
    </NMessageProvider>
  </div>
</template>

<style scoped>
.iot-visualization-editor {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: #f5f5f5;
  position: relative;
}

.error-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: #fff;
  border: 1px solid #ff4d4f;
  border-radius: 8px;
  color: #ff4d4f;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}
</style>
