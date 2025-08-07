<template>
  <div class="simple-test-card" :style="cardStyle">
    <h3 v-if="showTitle" class="card-title" :style="titleStyle">
      {{ title }}
    </h3>

    <div class="card-content">
      <p class="description" :style="descriptionStyle">
        {{ description }}
      </p>

      <div v-if="showDetails" class="details">
        <div class="detail-item">
          <strong>组件类型：</strong>
          {{ componentType }}
        </div>
        <div class="detail-item">
          <strong>创建时间：</strong>
          {{ createTime }}
        </div>
        <div v-if="customMessage" class="detail-item">
          <strong>自定义消息：</strong>
          {{ customMessage }}
        </div>
      </div>

      <div v-if="showCounter" class="counter-section">
        <p>计数器: {{ counter }}</p>
        <n-button type="primary" size="small" @click="incrementCounter">点击增加</n-button>
      </div>

      <div v-if="showColorDemo" class="color-demo" :style="{ backgroundColor: demoColor }">颜色演示区域</div>
    </div>

    <div v-if="showActions" class="card-actions">
      <n-space>
        <n-button size="small" @click="handleTest">测试按钮</n-button>
        <n-button size="small" type="info" @click="showMessage">显示消息</n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 简单测试卡片组件
 * 用于测试新配置系统，支持多种配置属性
 */

import { ref, computed, onMounted } from 'vue'
import { NButton, NSpace, useMessage } from 'naive-ui'

// 组件属性接口
interface Props {
  /** 是否显示标题 */
  showTitle?: boolean
  /** 卡片标题 */
  title?: string
  /** 描述文本 */
  description?: string
  /** 是否显示详细信息 */
  showDetails?: boolean
  /** 自定义消息 */
  customMessage?: string
  /** 是否显示计数器 */
  showCounter?: boolean
  /** 是否显示操作按钮 */
  showActions?: boolean
  /** 是否显示颜色演示 */
  showColorDemo?: boolean
  /** 演示颜色 */
  demoColor?: string
  /** 卡片背景色 */
  backgroundColor?: string
  /** 标题颜色 */
  titleColor?: string
  /** 文本颜色 */
  textColor?: string
  /** 边框样式 */
  borderStyle?: string
  /** 圆角大小 */
  borderRadius?: number
  /** 内边距 */
  padding?: number
}

const props = withDefaults(defineProps<Props>(), {
  showTitle: true,
  title: '简单测试组件',
  description: '这是一个用于测试新配置系统的组件，支持多种可配置属性。',
  showDetails: true,
  customMessage: '',
  showCounter: false,
  showActions: true,
  showColorDemo: false,
  demoColor: '#e6f7ff',
  backgroundColor: '#ffffff',
  titleColor: '#1890ff',
  textColor: '#333333',
  borderStyle: '1px solid #d9d9d9',
  borderRadius: 8,
  padding: 16
})

// 消息提示
const message = useMessage()

// 响应式数据
const counter = ref(0)
const componentType = 'simple-test'
const createTime = new Date().toLocaleString()

// 计算样式
const cardStyle = computed(() => ({
  backgroundColor: props.backgroundColor,
  border: props.borderStyle,
  borderRadius: `${props.borderRadius}px`,
  padding: `${props.padding}px`,
  color: props.textColor
}))

const titleStyle = computed(() => ({
  color: props.titleColor,
  margin: '0 0 12px 0'
}))

const descriptionStyle = computed(() => ({
  color: props.textColor,
  lineHeight: '1.6'
}))

// 方法
const incrementCounter = () => {
  counter.value++
}

const handleTest = () => {
  message.success('测试按钮被点击了！')
}

const showMessage = () => {
  message.info(props.customMessage || '这是一条默认消息')
}

// 生命周期
onMounted(() => {
  console.log('SimpleTestCard 组件已挂载', { props })
})
</script>

<style scoped>
.simple-test-card {
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.simple-test-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-title {
  font-weight: 600;
  font-size: 16px;
}

.card-content {
  margin-bottom: 16px;
}

.description {
  margin: 0 0 12px 0;
  font-size: 14px;
}

.details {
  margin: 12px 0;
  padding: 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  font-size: 12px;
}

.detail-item {
  margin: 4px 0;
}

.counter-section {
  margin: 12px 0;
  padding: 8px;
  background: rgba(24, 144, 255, 0.1);
  border-radius: 4px;
  text-align: center;
}

.color-demo {
  margin: 12px 0;
  padding: 12px;
  text-align: center;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.card-actions {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 12px;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .simple-test-card {
    padding: 12px;
  }

  .card-title {
    font-size: 14px;
  }

  .description {
    font-size: 13px;
  }
}
</style>
