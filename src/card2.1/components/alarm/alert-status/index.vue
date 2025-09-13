<template>
  <n-card class="alert-status" embedded>
    <div class="content">
      <!-- 标题显示 -->
      <div class="field-group">
        <label class="field-label">标题:</label>
        <div class="field-value">{{ config.title }}</div>
        <n-button size="tiny" @click="changeTitle">修改标题</n-button>
      </div>
      
      <!-- 金额显示 -->
      <div class="field-group">
        <label class="field-label">金额:</label>
        <div class="field-value">{{ config.amount }}</div>
        <n-button size="tiny" @click="changeAmount">修改金额</n-button>
      </div>
      
      <!-- 简介显示 -->
      <div class="field-group">
        <label class="field-label">简介:</label>
        <div class="field-value">{{ config.description }}</div>
        <n-button size="tiny" @click="changeDescription">修改简介</n-button>
      </div>
      
      <!-- 测试按钮 -->
      <div class="actions">
        <n-button type="primary" size="small" @click="randomUpdate">随机更新所有值</n-button>
        <n-button size="small" @click="resetToDefault">重置为默认值</n-button>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 告警状态组件 - 简化版，用于测试双向数据绑定
 */

import { NCard, NButton, useMessage } from 'naive-ui'
import { useCard2Props } from '@/card2.1/hooks'
import type { AlertStatusCustomize } from './settingConfig'

// 组件属性接口
interface Props { 
  config: AlertStatusCustomize  // 接收扁平的配置对象
  data?: Record<string, unknown> 
}

// 组件事件 - 用于通知配置变更
interface Emits {
  (e: 'update:config', config: AlertStatusCustomize): void
}

const props = withDefaults(defineProps<Props>(), { 
  data: () => ({}) 
})

const emit = defineEmits<Emits>()

// 使用 Card 2.1 数据绑定
const { config, displayData } = useCard2Props(props)
const message = useMessage()

// 本地更新配置函数
const updateConfig = (partialCustomize: Partial<AlertStatusCustomize>) => {
  const newConfig: AlertStatusCustomize = {
    ...props.config,
    ...partialCustomize
  }
  emit('update:config', newConfig)
}

// 修改标题
const changeTitle = () => {
  const newTitle = config.value.title === '告警状态' ? '新的标题' : '告警状态'
  updateConfig({ title: newTitle })
  message.success(`标题已更改为: ${newTitle}`)
}

// 修改金额
const changeAmount = () => {
  const newAmount = config.value.amount === 0 ? Math.floor(Math.random() * 10000) : 0
  updateConfig({ amount: newAmount })
  message.success(`金额已更改为: ${newAmount}`)
}

// 修改简介
const changeDescription = () => {
  const descriptions = ['系统运行正常', '数据更新中', '监控中...', '状态良好']
  const currentIndex = descriptions.indexOf(config.value.description)
  const newDescription = descriptions[(currentIndex + 1) % descriptions.length]
  updateConfig({ description: newDescription })
  message.success(`简介已更改为: ${newDescription}`)
}

// 随机更新所有值
const randomUpdate = () => {
  const newConfig = {
    title: `随机标题 ${Math.floor(Math.random() * 100)}`,
    amount: Math.floor(Math.random() * 50000),
    description: `随机描述 ${new Date().toLocaleTimeString()}`
  }
  
  updateConfig(newConfig)
  message.success('所有配置已随机更新')
}

// 重置为默认值
const resetToDefault = () => {
  const defaultConfig = {
    title: '告警状态',
    amount: 0,
    description: '系统运行正常'
  }
  
  updateConfig(defaultConfig)
  message.info('已重置为默认值')
}
</script>

<style scoped>
/* 主容器样式 */
.alert-status {
  height: 100%;
  padding: 16px;
}

/* 内容区域 */
.content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

/* 字段组样式 */
.field-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--card-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.field-label {
  font-size: 12px;
  color: var(--text-color-2);
  min-width: 40px;
  font-weight: 500;
}

.field-value {
  flex: 1;
  font-size: 13px;
  color: var(--text-color-1);
  padding: 4px 8px;
  background: var(--input-color);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  min-height: 20px;
  word-break: break-all;
}

/* 操作按钮区域 */
.actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
}

.actions .n-button {
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .alert-status {
    padding: 12px;
  }
  
  .field-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .field-label {
    min-width: auto;
  }
  
  .field-value {
    width: 100%;
  }
  
  .actions {
    flex-direction: column;
  }
}
</style>