<template>
  <div 
    class="triple-data-display"
    :class="{
      'preview-mode': previewMode
    }"
    :style="{
      '--theme-color': themeColor,
      '--font-size': `${fontSize}px`
    }"
    :data-component-id="componentId"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 组件标题 -->
    <div class="header">
      <h3>{{ currentTitle }}</h3>
    </div>

    <!-- 三个数据源展示区域 -->
    <div class="content-section">
      <div class="data-grid">
        <!-- 数据源1 -->
        <div class="data-item">
          <div class="data-label">{{ dataSource1Label }}</div>
          <div class="data-value">
            {{ formatData(dataSource1) }}
          </div>
        </div>

        <!-- 数据源2 -->
        <div class="data-item">
          <div class="data-label">{{ dataSource2Label }}</div>
          <div class="data-value">
            {{ formatData(dataSource2) }}
          </div>
        </div>

        <!-- 数据源3 -->
        <div class="data-item">
          <div class="data-label">{{ dataSource3Label }}</div>
          <div class="data-value">
            {{ formatData(dataSource3) }}
          </div>
        </div>
      </div>
    </div>

    <!-- 组件信息和状态 -->
    <div class="component-info">
      <div class="basic-info">
        <small>组件ID: {{ componentId || '未设置' }}</small>
      </div>

      <div v-if="previewMode" class="state-info">
        <div class="state-item">
          <small>点击次数: {{ componentState.clickCount }}</small>
        </div>
        <div class="state-item">
          <small>组件类型: 三数据展示</small>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * triple-data-display 主组件
 * 简化后专注于业务展示逻辑，交互由 Card2Wrapper 统一处理
 */

import { computed, reactive } from 'vue'
import type { TripleDataDisplayConfig, TripleDataDisplayCustomize } from './settingConfig'

// 组件状态接口
interface ComponentState {
  isActive: boolean
  clickCount: number
}

// 简化的组件props
interface Props {
  /** 新的CustomConfig结构配置 */
  customConfig?: TripleDataDisplayConfig
  /** 向后兼容：旧的config结构 */
  config?: Partial<TripleDataDisplayCustomize>
  /** 组件ID */
  componentId?: string
  /** 预览模式 */
  previewMode?: boolean
  /** 数据源1的数据 */
  dataSource1?: any
  /** 数据源2的数据 */
  dataSource2?: any
  /** 数据源3的数据 */
  dataSource3?: any
}

const props = withDefaults(defineProps<Props>(), {
  componentId: '',
  customConfig: undefined,
  config: () => ({}),
  previewMode: false,
  dataSource1: null,
  dataSource2: null,
  dataSource3: null
})

// 简化的事件定义
interface Emits {
  (e: 'click', data: { componentId: string; timestamp: string }): void
  (e: 'hover', data: { componentId: string; type: 'enter' | 'leave' }): void
}

const emit = defineEmits<Emits>()

// 组件状态管理
const componentState = reactive<ComponentState>({
  isActive: true,
  clickCount: 0
})

/**
 * 获取组件配置 - 支持新旧格式
 */
const currentCustomize = computed((): TripleDataDisplayCustomize => {
  // 优先使用新的customConfig结构
  if (props.customConfig?.customize) {
    return props.customConfig.customize
  }

  // 回退到旧的config结构（向后兼容）
  return {
    title: props.config?.title || '三数据展示',
    themeColor: props.config?.themeColor || '#2080f0',
    fontSize: props.config?.fontSize || 16,
    showBorder: props.config?.showBorder ?? true,
    dataSource1Label: props.config?.dataSource1Label || '数据源A',
    dataSource2Label: props.config?.dataSource2Label || '数据源B',
    dataSource3Label: props.config?.dataSource3Label || '数据源C',
    numberFormat: props.config?.numberFormat || 'raw',
    unit: props.config?.unit || ''
  }
})

// 计算属性：从customize中提取各个属性
const currentTitle = computed(() => currentCustomize.value.title)
const themeColor = computed(() => currentCustomize.value.themeColor)
const fontSize = computed(() => currentCustomize.value.fontSize)
const dataSource1Label = computed(() => currentCustomize.value.dataSource1Label)
const dataSource2Label = computed(() => currentCustomize.value.dataSource2Label)
const dataSource3Label = computed(() => currentCustomize.value.dataSource3Label)

/**
 * 数据格式化 - 简化版
 */
const formatData = (data: any): string => {
  if (data === null || data === undefined) {
    return '暂无数据'
  }

  // 处理对象类型的数据源
  let actualValue = data
  if (typeof data === 'object' && data !== null) {
    if (data.type && data.data && typeof data.data === 'object') {
      // 尝试从data对象中提取第一个数值字段
      const dataObj = data.data
      for (const [key, val] of Object.entries(dataObj)) {
        if (typeof val === 'number') {
          actualValue = val
          break
        }
        if (typeof val === 'string' && !isNaN(parseFloat(val as string))) {
          actualValue = parseFloat(val as string)
          break
        }
      }

      // 如果没有找到数值，显示第一个字符串值
      if (actualValue === data && Object.keys(dataObj).length > 0) {
        const firstValue = Object.values(dataObj)[0]
        actualValue = String(firstValue)
      }
    } else if (typeof data.value === 'number' || typeof data.value === 'string') {
      actualValue = data.value
    } else if (typeof data.data === 'number' || typeof data.data === 'string') {
      actualValue = data.data
    } else {
      return '[需要配置数据字段]'
    }
  }

  if (typeof actualValue === 'number') {
    return actualValue.toString()
  }

  return String(actualValue)
}

/**
 * 简化的点击处理 - 只处理组件业务逻辑
 */
const handleClick = () => {
  // 更新组件状态  
  componentState.clickCount++

  // 发送标准点击事件 - Card2Wrapper会拦截处理交互
  emit('click', {
    componentId: props.componentId || '',
    timestamp: new Date().toISOString()
  })
}

/**
 * 简化的悬停处理 - 只处理组件业务逻辑
 */
const handleMouseEnter = () => {
  emit('hover', {
    componentId: props.componentId || '',
    type: 'enter'
  })
}

const handleMouseLeave = () => {
  emit('hover', {
    componentId: props.componentId || '',
    type: 'leave'
  })
}
</script>

<style scoped>
.triple-data-display {
  padding: 20px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size, 16px);
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  container-type: size; /* 启用容器查询 */
}

.triple-data-display:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--theme-color);
}

.triple-data-display.preview-mode {
  cursor: pointer;
}

.header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--theme-color);
}

.header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: calc(var(--font-size, 16px) + 4px);
  font-weight: bold;
}

.content-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.data-item {
  padding: 16px;
  background: var(--body-color);
  border-radius: 6px;
  border-left: 4px solid var(--theme-color);
  text-align: center;
}

.data-label {
  font-size: calc(var(--font-size, 16px) - 2px);
  color: var(--text-color-2);
  margin-bottom: 8px;
  font-weight: 500;
}

.data-value {
  font-size: calc(var(--font-size, 16px) + 4px);
  color: var(--text-color);
  font-weight: bold;
  word-break: break-all;
}

/* 组件信息区域 - 优化高度自适应 */
.component-info {
  margin-top: auto; /* 自动推到底部 */
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  color: var(--text-color-3);
  font-size: calc(var(--font-size, 16px) - 4px);
  flex-shrink: 0; /* 防止被压缩 */
}

/* 在小高度容器中隐藏组件信息 */
@media (max-height: 280px) {
  .triple-data-display .component-info {
    display: none;
  }
  .triple-data-display {
    padding: 12px;
  }
}

/* 容器查询支持的浏览器使用更精确的容器查询 */
@container (height < 250px) {
  .component-info {
    display: none;
  }
}

@container (height < 200px) {
  .triple-data-display {
    padding: 12px;
  }
  .data-grid {
    gap: 12px;
  }
}

.basic-info {
  text-align: center;
  margin-bottom: 8px;
}

/* 状态信息 */
.state-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  padding: 8px;
  background: var(--body-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.state-item {
  padding: 2px 6px;
  background: var(--tag-color, var(--card-color));
  border-radius: 3px;
  font-size: 10px;
  color: var(--text-color-2);
}

.state-item small {
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .triple-data-display {
    padding: 16px;
  }

  .data-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
