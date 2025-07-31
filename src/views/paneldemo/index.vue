<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import PanelV2 from '@/components/panelv2/PanelV2.vue'
import { useMessage, NCard, NButton, NSpace, NSpin, NAlert } from 'naive-ui'
import { getBoard } from '@/service/api/panel'
import type { BaseCanvasItem, PanelConfig } from '@/components/panelv2/types/core'

// 路由和组件引用
const route = useRoute()
const panelRef = ref()
const message = useMessage()

// 响应式状态
const loading = ref(false)
const error = ref<string | null>(null)
const panelData = ref<any>(null)

// 从路由获取面板ID，如果没有提供则使用演示数据
const panelId = computed(() => route.query.id as string || 'demo')

// 是否为演示模式
const isDemoMode = computed(() => !route.query.id)

// 演示数据（仅在演示模式下使用）
const mockPanelData = {
  id: 'demo-panel-001',
  name: 'PanelV2 演示面板',
  config: JSON.stringify([
    {
      x: 0, y: 0, w: 4, h: 3, i: 1,
      minW: 2, minH: 2,
      data: {
        cardId: 'chart-card-001',
        type: 'chart',
        title: '演示图表',
        config: { chartType: 'line', dataSource: 'demo' },
        layout: { w: 4, h: 3, minW: 2, minH: 2 },
        basicSettings: { showTitle: true, backgroundColor: '#ffffff' },
        dataSource: {
          origin: 'system',
          systemSource: [{ metric: 'demo_data' }],
          deviceSource: []
        }
      }
    },
    {
      x: 4, y: 0, w: 4, h: 2, i: 2,
      minW: 2, minH: 1,
      data: {
        cardId: 'data-card-001',
        type: 'builtin',
        title: '演示数据',
        config: { displayType: 'number', unit: '个' },
        layout: { w: 4, h: 2, minW: 2, minH: 1 },
        basicSettings: { showTitle: true },
        dataSource: {
          origin: 'system',
          systemSource: [{ metric: 'demo_count' }],
          deviceSource: []
        }
      }
    },
    {
      x: 8, y: 0, w: 4, h: 4, i: 3,
      minW: 3, minH: 3,
      data: {
        cardId: 'table-card-001',
        type: 'custom',
        title: '设备状态表',
        config: { 
          columns: ['设备名称', '状态', '温度'],
          pagination: true,
          pageSize: 10
        },
        layout: { w: 4, h: 4, minW: 3, minH: 3 },
        basicSettings: { showTitle: true, bordered: true },
        dataSource: {
          origin: 'device',
          deviceSource: [{ device_id: 'all', metricsType: 'status' }],
          systemSource: []
        }
      }
    }
  ]),
  tenant_id: 'demo_tenant',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  home_flag: '0'
}

// 加载面板数据
const loadPanelData = async () => {
  if (isDemoMode.value) {
    // 演示模式：使用模拟数据
    panelData.value = mockPanelData
    message.info('当前为演示模式，使用模拟数据')
    return
  }

  try {
    loading.value = true
    error.value = null
    
    console.log('Loading panel data for ID:', panelId.value)
    
    // 调用实际API获取面板数据
    const { data } = await getBoard(panelId.value)
    
    if (data) {
      panelData.value = data
      message.success('面板数据加载成功')
      console.log('Panel data loaded:', data)
    } else {
      throw new Error('未找到面板数据')
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载面板数据失败'
    message.error(error.value)
    console.error('Failed to load panel data:', err)
  } finally {
    loading.value = false
  }
}

// 重试加载
const retryLoad = () => {
  loadPanelData()
}

// Event handlers
const handleModeChange = (mode: 'edit' | 'preview') => {
  console.log('Mode changed to:', mode)
  message.info(`切换到${mode === 'edit' ? '编辑' : '预览'}模式`)
}

const handleRendererChange = (rendererId: string) => {
  console.log('Renderer changed to:', rendererId)
  message.info(`切换到${rendererId === 'kanban' ? '看板' : '可视化大屏'}渲染器`)
}

const handleDataChange = (items: BaseCanvasItem[]) => {
  console.log('Panel data changed:', items)
  // 可以在这里保存数据到后端
  // 注意：为避免无限更新循环，不应在此处将 items 数据直接赋值回 panelData prop。
}

const handleSave = (config: PanelConfig) => {
  console.log('Panel config saved:', config)
  message.success('面板配置保存成功！')
  
  // 模拟保存到后端
  // await savePanelConfig(config)
}

const handleError = (error: Error) => {
  console.error('Panel error:', error)
  message.error(`面板操作失败: ${error.message}`)
}

// 生命周期
onMounted(() => {
  loadPanelData()
})
</script>

<template>
  <div class="h-full w-full">
    <!-- 加载状态 -->
    <div v-if="loading" class="h-full flex items-center justify-center">
      <NSpin size="large">
        <template #description>
          正在加载面板数据...
        </template>
      </NSpin>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="h-full flex items-center justify-center p-6">
      <NCard class="max-w-md">
        <template #header>
          <div class="flex items-center gap-2">
            <span class="text-red-500">⚠️</span>
            <span>加载失败</span>
          </div>
        </template>
        
        <NAlert type="error" class="mb-4">
          {{ error }}
        </NAlert>
        
        <NSpace justify="center">
          <NButton type="primary" @click="retryLoad">
            重试
          </NButton>
          <NButton @click="() => { panelData = mockPanelData; error = null; message.info('已切换到演示模式') }">
            使用演示数据
          </NButton>
        </NSpace>
      </NCard>
    </div>

    <!-- 面板组件 -->
    <div v-else-if="panelData" class="h-full">
      <!-- 演示模式提示 -->
      <div v-if="isDemoMode" class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-2">
        <div class="flex">
          <div class="ml-3">
            <p class="text-sm text-yellow-700">
              <strong>演示模式:</strong> 当前使用模拟数据。访问 
              <code class="bg-yellow-100 px-1 rounded">/paneldemo?id=your-panel-id</code> 
              可加载真实面板数据。
            </p>
          </div>
        </div>
      </div>

      <!-- PanelV2 组件 -->
      <PanelV2
        ref="panelRef"
        :panel-data="panelData"
        :config="{
          panelId: panelData.id || 'demo-panel-001',
          title: panelData.name || 'PanelV2 演示面板',
          theme: 'default'
        }"
        mode="edit"
        renderer-type="kanban"
        :readonly="false"
        @mode-change="handleModeChange"
        @renderer-change="handleRendererChange"
        @data-change="handleDataChange"
        @save="handleSave"
        @error="handleError"
      />
    </div>

    <!-- 无数据状态 -->
    <div v-else class="h-full flex items-center justify-center">
      <NCard class="max-w-md text-center">
        <template #header>
          <span>无面板数据</span>
        </template>
        
        <p class="text-gray-500 mb-4">未找到面板数据</p>
        
        <NSpace justify="center">
          <NButton type="primary" @click="loadPanelData">
            重新加载
          </NButton>
        </NSpace>
      </NCard>
    </div>
  </div>
</template>


