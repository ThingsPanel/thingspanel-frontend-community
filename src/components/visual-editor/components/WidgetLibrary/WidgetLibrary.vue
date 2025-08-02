<template>
  <div class="widget-library">
    <n-card title="组件库" size="small" :bordered="false">
      <n-collapse>
        <n-collapse-item v-for="category in widgetCategories" :key="category.name" :title="category.name">
          <n-space vertical size="small">
            <n-button 
              v-for="widget in category.widgets" 
              :key="widget.type"
              block 
              size="small"
              type="tertiary"
              draggable="true"
              @click="handleAddWidget(widget.type)"
              @dragstart="handleDragStart(widget.type, $event)"
            >
              <template #icon>
                <n-icon>
                  <component :is="widget.icon" />
                </n-icon>
              </template>
              {{ widget.name }}
            </n-button>
          </n-space>
        </n-collapse-item>
      </n-collapse>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { TextOutline, ImageOutline, BarChartOutline, PieChartOutline, TrendingUpOutline, StatsChartOutline } from '@vicons/ionicons5'

// 分类组织组件库
const widgetCategories = [
  {
    name: '基础组件',
    widgets: [
      { type: 'text', name: '文本', icon: TextOutline },
      { type: 'image', name: '图片', icon: ImageOutline }
    ]
  },
  {
    name: '图表组件',
    widgets: [
      { type: 'bar-chart', name: '柱状图', icon: BarChartOutline },
      { type: 'line-chart', name: '折线图', icon: TrendingUpOutline },
      { type: 'pie-chart', name: '饼图', icon: PieChartOutline },
      { type: 'digit-indicator', name: '数字指示器', icon: StatsChartOutline }
    ]
  },
  {
    name: '数据组件',
    widgets: [
      { type: 'chart-digit-indicator', name: '数据指示器', icon: StatsChartOutline },
      { type: 'chart-bar', name: '数据柱状图', icon: BarChartOutline }
    ]
  }
]

const emit = defineEmits<{
  'add-widget': [type: string]
}>()

const handleAddWidget = (type: string) => {
  emit('add-widget', type)
}

const handleDragStart = (type: string, event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', type)
    event.dataTransfer.effectAllowed = 'copy'
  }
}
</script>

<style scoped>
.widget-library {
  padding: 16px;
}
</style>