<template>
  <n-card class="alert-status-v2" embedded>
    <div class="content">
      <!-- 标题显示 -->
      <div class="field-group">
        <label class="field-label">标题:</label>
        <div class="field-value">{{ displayTitle }}</div>
        <n-button size="tiny" @click="changeTitle">修改标题</n-button>
      </div>

      <!-- 金额显示 -->
      <div class="field-group">
        <label class="field-label">金额:</label>
        <div class="field-value">{{ displayAmount }}</div>
        <n-button size="tiny" @click="changeAmount">修改金额</n-button>
      </div>

      <!-- 状态显示 -->
      <div class="field-group">
        <label class="field-label">状态:</label>
        <div class="field-value">{{ displayStatus }}</div>
        <n-button size="tiny" @click="changeStatus">修改状态</n-button>
      </div>

      <!-- 描述显示 -->
      <div class="field-group">
        <label class="field-label">描述:</label>
        <div class="field-value">{{ displayDescription }}</div>
        <n-button size="tiny" @click="changeDescription">修改描述</n-button>
      </div>

      <!-- 调试信息 -->
      <div class="debug-info">
        <n-divider>🔍 V2组件调试信息</n-divider>
        <div class="debug-section">
          <span class="debug-label">统一配置值:</span>
          <pre class="debug-value">{{ JSON.stringify({
            title: unifiedConfig.value.component?.title,
            amount: unifiedConfig.value.component?.amount,
            status: unifiedConfig.value.component?.status,
            description: unifiedConfig.value.component?.description
          }, null, 2) }}</pre>
        </div>
        <div class="debug-section">
          <span class="debug-label">显示值:</span>
          <pre class="debug-value">{{ JSON.stringify({
            title: displayTitle,
            amount: displayAmount,
            status: displayStatus,
            description: displayDescription
          }, null, 2) }}</pre>
        </div>
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
 * 告警状态组件 V2 - 标准4属性实现
 * 演示正确的单属性绑定和交互机制
 */

import { onMounted, onUnmounted, computed } from 'vue'
import { NCard, NButton, NDivider, useMessage } from 'naive-ui'
import { useCard2Props, type UnifiedCard2Configuration } from '@/card2.1/hooks'
import type { AlertStatusV2Customize } from './settingConfig'

// 组件属性接口 - 4个标准属性
interface Props {
  config: AlertStatusV2Customize
  data?: Record<string, unknown>
  componentId?: string
}

interface Emits {
  (e: 'update:config', config: AlertStatusV2Customize): void
  (e: 'update:unified-config', config: UnifiedCard2Configuration): void
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

const emit = defineEmits<Emits>()

// 获取初始统一配置
function getInitialUnifiedConfig(): UnifiedCard2Configuration | undefined {
  if (!props.componentId) return undefined

  console.log(`🔥 [alert-status-v2] 获取初始统一配置:`, props.componentId)

  try {
    const cardElement = document.querySelector(`[data-component-id="${props.componentId}"]`)
    if (cardElement && (cardElement as any)?.__vueParentComponent?.exposed?.getFullConfiguration) {
      const fullConfig = (cardElement as any).__vueParentComponent.exposed.getFullConfiguration()
      console.log(`🔥 [alert-status-v2] 从Card2Wrapper获取配置:`, fullConfig)
      return fullConfig
    }
  } catch (error) {
    console.warn(`🔥 [alert-status-v2] 获取初始配置失败:`, error)
  }

  return undefined
}

// 使用 Card 2.1 数据绑定
const {
  config,
  displayData,
  unifiedConfig,
  updateConfig: updateCard2Config,
  getFullConfiguration,
  cleanupAutoSync,
  // 🔥 关键：属性监听功能
  watchProperty
} = useCard2Props({
  config: props.config,
  data: props.data,
  componentId: props.componentId,
  initialUnifiedConfig: getInitialUnifiedConfig()
})

const message = useMessage()

// 🔥 通用计算属性：根据字段名动态获取显示值
const getDisplayValue = (field: string, defaultValue: any) => {
  // 优先从统一配置获取
  if (unifiedConfig.value.component && field in unifiedConfig.value.component && unifiedConfig.value.component[field] !== undefined) {
    return String(unifiedConfig.value.component[field])
  }
  // 回退到数据源
  if (props.data && typeof props.data === 'object' && field in props.data && props.data[field] !== undefined && props.data[field] !== null) {
    return String(props.data[field])
  }
  return String(defaultValue)
}

// 🔥 响应式显示值 - 使用computed确保响应式更新
const displayTitle = computed(() => getDisplayValue('title', '默认标题'))
const displayAmount = computed(() => getDisplayValue('amount', 0))
const displayStatus = computed(() => getDisplayValue('status', '正常'))
const displayDescription = computed(() => getDisplayValue('description', '无描述'))

// 配置更新函数
const updateConfig = (partialCustomize: Partial<AlertStatusV2Customize>) => {
  console.log(`🔥 [alert-status-v2] 更新配置:`, partialCustomize)

  // 更新本地配置
  updateCard2Config('component', partialCustomize)

  // 同步到配置管理器
  if (props.componentId) {
    import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
      .then(({ configurationIntegrationBridge }) => {
        configurationIntegrationBridge.updateConfiguration(
          props.componentId!,
          'component',
          partialCustomize,
          'component-internal-update'
        )
        console.log(`✅ [alert-status-v2] 配置已同步到管理器`)
      })
      .catch(error => {
        console.error(`❌ [alert-status-v2] 同步配置失败:`, error)
      })
  }

  emit('update:config', partialCustomize)
}

// 4个属性的修改函数
const changeTitle = () => {
  const titles = ['告警状态', '正常状态', '异常状态', '维护状态']
  const currentTitle = unifiedConfig.value.component?.title || '告警状态'
  const currentIndex = titles.indexOf(currentTitle)
  const newTitle = titles[(currentIndex + 1) % titles.length]

  updateConfig({ title: newTitle })
  message.success(`标题已更改为: ${newTitle}`)
}

const changeAmount = () => {
  const currentAmount = unifiedConfig.value.component?.amount || 0
  const newAmount = currentAmount === 0 ? Math.floor(Math.random() * 1000) : 0

  updateConfig({ amount: newAmount })
  message.success(`金额已更改为: ${newAmount}`)
}

const changeStatus = () => {
  const statuses = ['正常', '警告', '错误', '离线']
  const currentStatus = unifiedConfig.value.component?.status || '正常'
  const currentIndex = statuses.indexOf(currentStatus)
  const newStatus = statuses[(currentIndex + 1) % statuses.length]

  updateConfig({ status: newStatus })
  message.success(`状态已更改为: ${newStatus}`)
}

const changeDescription = () => {
  const descriptions = ['系统运行正常', '发现异常情况', '需要立即处理', '定期维护中']
  const currentDescription = unifiedConfig.value.component?.description || '系统运行正常'
  const currentIndex = descriptions.indexOf(currentDescription)
  const newDescription = descriptions[(currentIndex + 1) % descriptions.length]

  updateConfig({ description: newDescription })
  message.success(`描述已更改为: ${newDescription}`)
}

// 随机更新所有值
const randomUpdate = () => {
  const newConfig = {
    title: `随机标题 ${Math.floor(Math.random() * 100)}`,
    amount: Math.floor(Math.random() * 50000),
    status: ['正常', '警告', '错误', '离线'][Math.floor(Math.random() * 4)],
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
    status: '正常',
    description: '系统运行正常'
  }

  updateConfig(defaultConfig)
  message.info('已重置为默认值')
}

// 生命周期管理
onMounted(() => {
  console.log(`🔥 [alert-status-v2] 组件挂载完成 ${props.componentId}`)
})

onUnmounted(() => {
  console.log(`🔥 [alert-status-v2] 组件卸载，清理资源`)
  cleanupAutoSync()
})

// 暴露外部接口
const expose = {
  getFullConfiguration,
  updateConfig,
  // 🔥 关键：暴露属性监听接口
  watchProperty: (propertyName: string, callback: (newValue: any, oldValue: any) => void) => {
    console.log(`🔥 [alert-status-v2] 注册属性监听器: ${propertyName}`)
    return watchProperty(propertyName, callback)
  }
}

defineExpose(expose)
</script>

<style scoped>
.alert-status-v2 {
  height: 100%;
  padding: 16px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

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
}

.debug-info {
  margin: 16px 0;
  padding: 12px;
  background: var(--code-color);
  border-radius: 6px;
  font-size: 11px;
}

.debug-section {
  margin-bottom: 8px;
}

.debug-label {
  display: block;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 4px;
}

.debug-value {
  background: var(--input-color);
  padding: 6px;
  border-radius: 3px;
  border: 1px solid var(--border-color);
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 10px;
  line-height: 1.4;
  max-height: 120px;
  overflow: auto;
  color: var(--text-color-1);
  white-space: pre-wrap;
}

.actions {
  display: flex;
  gap: 6px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.actions .n-button {
  flex: 1;
  min-width: 80px;
}
</style>