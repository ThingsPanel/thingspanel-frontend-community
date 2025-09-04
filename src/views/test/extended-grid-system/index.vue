<!--
  扩展网格系统测试页面
  测试 0-99 列网格功能和不同预设配置
-->
<template>
  <div class="extended-grid-test">
    <!-- 控制面板 -->
    <n-card class="mb-4" title="扩展网格系统测试" size="small">
      <n-space vertical>
        <!-- 网格尺寸选择器 -->
        <n-form-item label="网格尺寸预设：">
          <n-select v-model:value="selectedGridSize" :options="gridSizeOptions" @update:value="handleGridSizeChange" />
        </n-form-item>

        <!-- 自定义列数（仅当选择 custom 时显示） -->
        <n-form-item v-if="selectedGridSize === 'custom'" label="自定义列数：">
          <n-input-number v-model:value="customColumns" :min="1" :max="99" @update:value="handleCustomColumnsChange" />
        </n-form-item>

        <!-- 网格信息显示 -->
        <n-descriptions :column="3" bordered size="small" title="当前网格配置">
          <n-descriptions-item label="列数">
            {{ gridInfo.colNum }}
          </n-descriptions-item>
          <n-descriptions-item label="行高">{{ gridConfig.rowHeight }}px</n-descriptions-item>
          <n-descriptions-item label="边距">{{ gridConfig.margin.join(' x ') }}px</n-descriptions-item>
          <n-descriptions-item label="响应式">
            {{ gridConfig.responsive ? '启用' : '禁用' }}
          </n-descriptions-item>
          <n-descriptions-item label="配置有效性">
            <n-tag :type="gridValidation.isValid ? 'success' : 'error'">
              {{ gridValidation.isValid ? '有效' : '无效' }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="项目数量">
            {{ testLayout.length }}
          </n-descriptions-item>
        </n-descriptions>

        <!-- 性能警告 -->
        <n-alert v-if="gridValidation.performance?.warning" type="warning" :title="`性能警告`">
          {{ gridValidation.performance.warning }}
          <template #action>
            <n-button size="small" @click="showPerformanceTips = !showPerformanceTips">
              {{ showPerformanceTips ? '隐藏建议' : '查看建议' }}
            </n-button>
          </template>
        </n-alert>

        <!-- 性能建议 -->
        <n-alert
          v-if="showPerformanceTips && gridValidation.performance?.recommendation"
          type="info"
          :title="`性能建议`"
        >
          {{ gridValidation.performance.recommendation }}
        </n-alert>

        <!-- 操作按钮 -->
        <n-space>
          <n-button type="primary" @click="generateTestItems">生成测试项目 ({{ testItemCount }})</n-button>
          <n-button @click="optimizeLayout">优化布局</n-button>
          <n-button @click="clearLayout">清空布局</n-button>
          <n-button @click="exportLayoutData">导出布局数据</n-button>
        </n-space>
      </n-space>
    </n-card>

    <!-- 网格展示区域 -->
    <n-card class="grid-container" :bordered="false">
      <template #header>
        <n-space align="center">
          <span>网格展示区域</span>
          <n-tag size="small">{{ selectedGridSize.toUpperCase() }}</n-tag>
          <n-tag size="small" type="info">{{ gridInfo.colNum }}列</n-tag>
        </n-space>
      </template>

      <GridLayoutPlus
        ref="gridRef"
        v-model:layout="testLayout"
        :grid-size="selectedGridSize"
        :custom-columns="customColumns"
        :show-grid="true"
        :readonly="false"
        class="test-grid"
        @layout-change="handleLayoutChange"
      >
        <template #default="{ item }">
          <div class="test-grid-item">
            <div class="item-header">
              <span class="item-title">{{ item.title || item.i }}</span>
              <n-tag size="small">{{ item.w }}x{{ item.h }}</n-tag>
            </div>
            <div class="item-content">
              <p>位置: ({{ item.x }}, {{ item.y }})</p>
              <p>类型: {{ item.type || 'default' }}</p>
            </div>
          </div>
        </template>
      </GridLayoutPlus>
    </n-card>

    <!-- 调试信息 -->
    <n-card v-if="showDebugInfo" class="mt-4" title="调试信息" size="small">
      <n-code :code="JSON.stringify({ gridConfig, testLayout }, null, 2)" language="json" show-line-numbers />
    </n-card>

    <!-- 调试开关 -->
    <n-float-button :right="20" :bottom="20" @click="showDebugInfo = !showDebugInfo">
      <n-icon>
        <template v-if="showDebugInfo">
          <i class="i-ion-eye-off-outline" />
        </template>
        <template v-else>
          <i class="i-ion-eye-outline" />
        </template>
      </n-icon>
    </n-float-button>
  </div>
</template>

<script setup lang="ts">
/**
 * 扩展网格系统测试页面
 * 测试 GridLayoutPlus 组件的 0-99 列扩展功能
 */

import { ref, computed, watch, nextTick } from 'vue'
import { useMessage } from 'naive-ui'
import GridLayoutPlus from '@/components/common/grid/GridLayoutPlus.vue'
import type { GridLayoutPlusItem } from '@/components/common/grid/gridLayoutPlusTypes'

// 消息提示
const message = useMessage()

// 响应式状态
const gridRef = ref<InstanceType<typeof GridLayoutPlus> | null>(null)
const selectedGridSize = ref<'mini' | 'standard' | 'large' | 'mega' | 'extended' | 'custom'>('standard')
const customColumns = ref(50)
const testLayout = ref<GridLayoutPlusItem[]>([])
const testItemCount = ref(8)
const showPerformanceTips = ref(false)
const showDebugInfo = ref(false)

// 网格尺寸选项
const gridSizeOptions = [
  { label: 'Mini (12列)', value: 'mini' },
  { label: 'Standard (24列)', value: 'standard' },
  { label: 'Large (50列)', value: 'large' },
  { label: 'Mega (99列)', value: 'mega' },
  { label: 'Extended (50列响应式)', value: 'extended' },
  { label: 'Custom (自定义列数)', value: 'custom' }
]

// 计算属性
const gridInfo = computed(() => {
  return gridRef.value?.getGridInfo() || { colNum: 12, gridSize: 'standard', validation: { isValid: true } }
})

const gridConfig = computed(() => {
  return gridRef.value?.gridCore?.config || {}
})

const gridValidation = computed(() => {
  return gridRef.value?.getGridValidation() || { isValid: true, performance: null }
})

// 方法
const handleGridSizeChange = async (newSize: string) => {
  await nextTick()
  message.info(`已切换到 ${newSize.toUpperCase()} 网格配置`)
}

const handleCustomColumnsChange = async (newColumns: number) => {
  await nextTick()
  message.info(`自定义列数已更新为 ${newColumns}`)
}

const generateTestItems = () => {
  const items: GridLayoutPlusItem[] = []
  const colNum = gridInfo.value.colNum

  for (let i = 0; i < testItemCount.value; i++) {
    const w = Math.max(1, Math.min(4, Math.floor(Math.random() * 4) + 1))
    const h = Math.max(1, Math.floor(Math.random() * 3) + 1)
    const x = Math.floor(Math.random() * Math.max(1, colNum - w + 1))
    const y = Math.floor(Math.random() * 10)

    items.push({
      i: `test-item-${i}`,
      x,
      y,
      w,
      h,
      title: `测试项目 ${i + 1}`,
      type: `type-${(i % 3) + 1}`,
      isDraggable: true,
      isResizable: true
    })
  }

  testLayout.value = items
  message.success(`已生成 ${testItemCount.value} 个测试项目`)
}

const optimizeLayout = () => {
  if (gridRef.value) {
    gridRef.value.optimizeLayoutForGridSize()
    message.success('布局已优化')
  }
}

const clearLayout = () => {
  testLayout.value = []
  message.info('布局已清空')
}

const exportLayoutData = () => {
  const data = {
    gridSize: selectedGridSize.value,
    customColumns: customColumns.value,
    layout: testLayout.value,
    config: gridConfig.value
  }

  const dataStr = JSON.stringify(data, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `extended-grid-layout-${selectedGridSize.value}-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  message.success('布局数据已导出')
}

const handleLayoutChange = (newLayout: GridLayoutPlusItem[]) => {
  console.log('Layout changed:', newLayout)
}

// 监听器
watch(
  () => selectedGridSize.value,
  newSize => {
    console.log('Grid size changed to:', newSize)
  }
)

watch(
  () => customColumns.value,
  newColumns => {
    console.log('Custom columns changed to:', newColumns)
  }
)

// 初始化
generateTestItems()
</script>

<style scoped>
.extended-grid-test {
  padding: 16px;
  max-width: 100%;
}

.grid-container {
  min-height: 600px;
}

.test-grid {
  width: 100%;
  min-height: 500px;
}

.test-grid-item {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s ease;
}

.test-grid-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--card-color);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  font-weight: 500;
}

.item-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-content {
  flex: 1;
  padding: 12px;
  font-size: 11px;
  color: var(--text-color-2);
}

.item-content p {
  margin: 4px 0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .extended-grid-test {
    padding: 8px;
  }

  .grid-container {
    min-height: 400px;
  }
}
</style>
