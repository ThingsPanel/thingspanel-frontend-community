<script setup lang="ts">
import { ref } from 'vue'
import PanelLayout from './layout/PanelLayout.vue'
import GridStackRenderer from './renderers/gridstack/index.vue'
import CanvasRenderer from './renderers/canvas/index.vue'

// Props definition
interface Props {
  panelId: string
  mode?: 'edit' | 'preview'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'edit'
})

// 当前使用的渲染器类型
const currentRenderer = ref<'gridstack' | 'canvas'>('gridstack')

// 切换渲染器
const switchRenderer = () => {
  currentRenderer.value = currentRenderer.value === 'gridstack' ? 'canvas' : 'gridstack'
}
</script>

<template>
  <div class="panel-v2 h-full w-full">
    <PanelLayout :mode="mode">
      <!-- 工具栏 - 简单的渲染器切换 -->
      <template #toolbar>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            PanelV2 - {{ props.panelId }}
          </h3>
          <button 
            @click="switchRenderer"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            切换到{{ currentRenderer === 'gridstack' ? 'Canvas渲染器' : 'GridStack渲染器' }}
          </button>
        </div>
      </template>

      <!-- 左侧暂时空着 -->
      <template #left>
        <div class="p-4 text-gray-500">
          左侧组件库 - 待实现
        </div>
      </template>

      <!-- 中间渲染器区域 -->
      <template #main>
        <div class="h-full w-full">
          <!-- 动态渲染不同的渲染器 -->
          <GridStackRenderer 
            v-if="currentRenderer === 'gridstack'" 
            :mode="mode"
            :items="[]"
            :selected-ids="[]"
          />
          <CanvasRenderer 
            v-else 
            :mode="mode"
            :items="[]"
            :selected-ids="[]"
          />
        </div>
      </template>

      <!-- 右侧暂时空着 -->
      <template #right>
        <div class="p-4 text-gray-500">
          右侧配置面板 - 待实现
        </div>
      </template>
    </PanelLayout>
  </div>
</template>

<style scoped>
.panel-v2 {
  font-family: var(--font-family);
}

.component-item:hover {
  transform: translateY(-1px);
}

.component-item:active {
  transform: rotate(5deg) scale(0.95);
}

.canvas-wrapper {
  height: 100%;
  width: 100%;
}
</style>