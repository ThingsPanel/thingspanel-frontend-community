<script setup lang="ts">
/**
 * simple-display 主组件
 * 基于新的三文件结构标准，支持 CustomConfig 类型配置和属性绑定
 */

import { computed, reactive } from 'vue'
import type { SimpleDisplayConfig, SimpleDisplayCustomize } from './settingConfig'

// 组件状态接口
interface ComponentState {
  isActive: boolean
  clickCount: number
}

// 组件props - 简化后的props接口
interface Props {
  /** 新的CustomConfig结构配置 */
  customConfig?: SimpleDisplayConfig
  /** 向后兼容：旧的config结构 */
  config?: Partial<SimpleDisplayCustomize>
  /** 组件ID */
  componentId?: string
  /** 预览模式 */
  previewMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  componentId: '',
  customConfig: undefined,
  config: () => ({}),
  previewMode: false
})

// 组件事件定义 - 简化为标准DOM事件
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
 * 优先使用 customConfig.customize，回退到 config
 */
const currentCustomize = computed((): SimpleDisplayCustomize => {
  // 优先使用新的customConfig结构
  if (props.customConfig?.customize) {
    return props.customConfig.customize
  }

  // 回退到旧的config结构（向后兼容）
  return {
    title: props.config?.title || '简单展示组件',
    content: props.config?.content || '这是一个静态展示组件，不需要数据源',
    themeColor: props.config?.themeColor || '#2080f0',
    fontSize: props.config?.fontSize || 16,
    showIcon: props.config?.showIcon ?? true,
    iconName: props.config?.iconName || '📊'
  }
})

/**
 * 获取变换配置
 */
const currentTransform = computed(() => {
  return props.customConfig?.root?.transform || { rotate: 0, scale: 1 }
})

// 计算属性：从customize中提取各个属性
const currentTitle = computed(() => currentCustomize.value.title)
const currentContent = computed(() => currentCustomize.value.content)
const themeColor = computed(() => currentCustomize.value.themeColor)
const fontSize = computed(() => currentCustomize.value.fontSize)
const showIcon = computed(() => currentCustomize.value.showIcon)
const iconName = computed(() => currentCustomize.value.iconName)

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

<template>
  <div
    class="simple-display"
    :class="{
      'preview-mode': previewMode
    }"
    :style="{
      '--theme-color': themeColor,
      '--font-size': `${fontSize}px`,
      transform: `rotate(${currentTransform.rotate}deg) scale(${currentTransform.scale})`
    }"
    :data-component-id="componentId"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div class="header">
      <div class="title-section">
        <span v-if="showIcon" class="icon">{{ iconName }}</span>
        <h3>{{ currentTitle }}</h3>
      </div>
    </div>

    <div class="content-section">
      <p class="main-content">{{ currentContent }}</p>

      <div class="info-panel">
        <div class="info-item">
          <span class="label">组件类型:</span>
          <span class="value">静态展示</span>
        </div>
        <div class="info-item">
          <span class="label">数据源:</span>
          <span class="value">无需数据源</span>
        </div>
        <div class="info-item">
          <span class="label">状态:</span>
          <span class="value status-ready">就绪</span>
        </div>
      </div>
    </div>

    <!-- 组件信息和状态 -->
    <div class="component-info">
      <div class="basic-info">
        <small>组件ID: {{ componentId || '未设置' }}</small>
      </div>

      <!-- 开发/调试模式下显示基本状态信息 -->
      <div v-if="previewMode" class="state-info">
        <div class="state-item">
          <small>点击次数: {{ componentState.clickCount }}</small>
        </div>
        <div class="state-item">
          <small>配置类型: {{ customConfig ? 'CustomConfig' : 'Legacy Config' }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.simple-display {
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

.simple-display:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--theme-color);
}

/* 预览模式样式 */
.simple-display.preview-mode {
  cursor: pointer;
}

.header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--theme-color);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon {
  font-size: calc(var(--font-size, 16px) + 8px);
  color: var(--theme-color);
}

.title-section h3 {
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

.main-content {
  margin: 0;
  color: var(--text-color);
  line-height: 1.6;
  padding: 16px;
  background: var(--body-color);
  border-radius: 6px;
  border-left: 4px solid var(--theme-color);
}

.info-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--body-color);
  border-radius: 6px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-item .label {
  color: var(--text-color-2);
  font-weight: 500;
}

.info-item .value {
  color: var(--text-color);
  font-weight: bold;
}

.status-ready {
  color: var(--success-color) !important;
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
@media (max-height: 250px) {
  .simple-display .component-info {
    display: none;
  }
  .simple-display {
    padding: 12px; /* 小高度时减少内边距 */
  }
}

/* 容器查询支持的浏览器使用更精确的容器查询 */
@container (height < 200px) {
  .component-info {
    display: none;
  }
}

@container (height < 180px) {
  .simple-display {
    padding: 12px;
  }
  .header {
    margin-bottom: 12px;
    padding-bottom: 8px;
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
  margin-bottom: 8px;
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
@media (max-width: 600px) {
  .simple-display {
    padding: 16px;
  }

  .title-section {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .info-item {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
}
</style>
