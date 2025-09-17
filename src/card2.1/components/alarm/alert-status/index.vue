<template>
  <n-card class="alert-status" embedded>
    <div class="content">
      <!-- 🔥 直接显示 props.data 转成的字符串 -->
      <div class="field-group">
        <label class="field-label">🔥 数据源数据:</label>
        <div class="field-value">{{ JSON.stringify(props.data) }}</div>
      </div>

      <!-- 标题显示 -->
      <div class="field-group">
        <label class="field-label">标题:</label>
        <div class="field-value">{{ getDisplayValue('title', '未设置') }}</div>
        <n-button size="tiny" @click="changeTitle">修改标题</n-button>
      </div>

      <!-- 金额显示 -->
      <div class="field-group">
        <label class="field-label">金额:</label>
        <div class="field-value">{{ getDisplayValue('amount', 0) }}</div>
        <n-button size="tiny" @click="changeAmount">修改金额</n-button>
      </div>

      <!-- 简介显示 -->
      <div class="field-group">
        <label class="field-label">简介:</label>
        <div class="field-value">{{ getDisplayValue('description', '无描述') }}</div>
        <n-button size="tiny" @click="changeDescription">修改简介</n-button>
      </div>

      <!-- 数据源调试信息 -->
      <div class="debug-info">
        <n-divider>🔍 调试信息</n-divider>
        <div class="debug-section">
          <span class="debug-label">统一配置值:</span>
          <pre class="debug-value debug-scrollable">{{ JSON.stringify({
            title: unifiedConfig.component?.title,
            amount: unifiedConfig.component?.amount,
            description: unifiedConfig.component?.description
          }, null, 2) }}</pre>
        </div>
        <div class="debug-section">
          <span class="debug-label">数据源值:</span>
          <pre class="debug-value debug-scrollable">{{ JSON.stringify(props.data, null, 2) }}</pre>
        </div>
        <div class="debug-section">
          <span class="debug-label">最终显示值（数据源优先）:</span>
          <pre class="debug-value debug-scrollable">{{ JSON.stringify({
            title: getDisplayValue('title', '未设置'),
            amount: getDisplayValue('amount', 0),
            description: getDisplayValue('description', '无描述')
          }, null, 2) }}</pre>
        </div>
        <div class="debug-section">
          <span class="debug-label">数据来源分析:</span>
          <pre class="debug-value debug-scrollable">{{ JSON.stringify({
            title: getDataSource('title'),
            amount: getDataSource('amount'),
            description: getDataSource('description')
          }, null, 2) }}</pre>
        </div>
      </div>

      <!-- 测试按钮 -->
      <div class="actions">
        <n-button type="primary" size="small" @click="randomUpdate">随机更新所有值</n-button>
        <n-button size="small" @click="resetToDefault">重置为默认值</n-button>
        <n-button type="warning" size="small" @click="testDataSource">测试数据源</n-button>
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 告警状态组件 - 统一配置管理版本
 * 🔥 采用新的统一配置架构：所有配置归集到卡片级别
 */

import { watch, onMounted, onUnmounted, ref } from 'vue'
import { NCard, NButton, useMessage } from 'naive-ui'
import { useCard2Props, type UnifiedCard2Configuration } from '@/card2.1/hooks'
import type { AlertStatusCustomize } from './settingConfig'

// 组件属性接口 - 支持统一配置架构
interface Props {
  config: AlertStatusCustomize  // 接收扁平的配置对象
  data?: Record<string, unknown>
  componentId?: string  // 🔥 新增：组件ID用于配置管理
}

// 组件事件 - 用于通知配置变更
interface Emits {
  (e: 'update:config', config: AlertStatusCustomize): void
  (e: 'update:unified-config', config: UnifiedCard2Configuration): void  // 🔥 新增：统一配置变更事件
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

const emit = defineEmits<Emits>()

// 🔥 获取初始统一配置 - 从Card2Wrapper的统一配置架构获取
function getInitialUnifiedConfig(): UnifiedCard2Configuration | undefined {
  if (!props.componentId) return undefined

  console.log(`🔥 [alert-status] 获取初始统一配置开始:`, props.componentId)

  try {
    // 通过DOM查找Card2Wrapper实例获取完整配置
    const cardElement = document.querySelector(`[data-component-id="${props.componentId}"]`)
    if (cardElement && (cardElement as any)?.__vueParentComponent?.exposed?.getFullConfiguration) {
      const fullConfig = (cardElement as any).__vueParentComponent.exposed.getFullConfiguration()
      console.log(`🔥 [alert-status] 从Card2Wrapper获取初始配置:`, fullConfig)

      // 🔥 关键调试：显示组件配置的具体内容
      if (fullConfig?.component) {
        console.log(`🔥 [alert-status] 初始组件配置:`, {
          title: fullConfig.component.title,
          amount: fullConfig.component.amount,
          description: fullConfig.component.description,
          完整配置: fullConfig.component
        })
      } else {
        console.warn(`🔥 [alert-status] 初始配置中没有component节!`)
      }

      return fullConfig
    } else {
      console.warn(`🔥 [alert-status] 未找到Card2Wrapper元素或暴露方法`)
    }
  } catch (error) {
    console.warn(`🔥 [alert-status] 获取初始配置失败:`, error)
  }

  console.log(`🔥 [alert-status] 返回undefined，使用默认配置`)
  return undefined
}

// 🔥 使用增强的 Card 2.1 数据绑定，支持统一配置管理
const {
  config,
  displayData,
  unifiedConfig,
  updateConfig: updateCard2Config,   // 🔥 重命名避免冲突
  updateUnifiedConfigWithSync,       // 🔥 使用增强版配置更新（自动同步）
  getFullConfiguration,
  cleanupAutoSync,                   // 🔥 清理函数
  // 🔥 新增：属性暴露功能（现在自动处理，但保留接口）
  exposeProperty,
  exposeProperties,
  exposePropertyWithWatch,
  // 🔥 关键修复：添加缺失的 watchProperty 方法
  watchProperty
} = useCard2Props({
  config: props.config,
  data: props.data,
  componentId: props.componentId,
  initialUnifiedConfig: getInitialUnifiedConfig()  // 🔥 传递初始统一配置
})

const message = useMessage()

// 🔥 核心数据获取函数：修复为完全基于统一配置
const getDisplayValue = (field: string, defaultValue: any) => {
  console.log(`🔥 [getDisplayValue] 获取字段 ${field}:`, {
    字段名: field,
    默认值: defaultValue,
    统一配置存在: !!unifiedConfig.value.component,
    统一配置全部: unifiedConfig.value.component,
    字段在配置中: unifiedConfig.value.component && field in unifiedConfig.value.component,
    字段值: unifiedConfig.value.component?.[field],
    字段值类型: typeof unifiedConfig.value.component?.[field]
  })

  // 🔥 关键修复：title, amount, description 是组件配置属性，优先从统一配置获取
  if (['title', 'amount', 'description'].includes(field)) {
    // 只从统一配置中的组件配置获取
    if (unifiedConfig.value.component && field in unifiedConfig.value.component && unifiedConfig.value.component[field] !== undefined) {
      const value = unifiedConfig.value.component[field]
      console.log(`🎯 [alert-status] 字段${field}使用统一配置数据:`, value)
      return String(value)
    }

    // 使用默认值
    console.log(`🎯 [alert-status] 字段${field}使用默认值:`, defaultValue)
    return String(defaultValue)
  }

  // 🔥 其他字段可以继续使用原来的逻辑（先数据源，后配置，最后默认值）
  // 1. 优先使用数据源数据（这是执行结果）
  if (props.data && typeof props.data === 'object' && field in props.data && props.data[field] !== undefined && props.data[field] !== null) {
    console.log(`🎯 [alert-status] 字段${field}使用数据源数据:`, props.data[field])
    return String(props.data[field])
  }

  // 2. 回退到统一配置中的组件配置
  if (unifiedConfig.value.component && field in unifiedConfig.value.component && unifiedConfig.value.component[field] !== undefined) {
    console.log(`🎯 [alert-status] 字段${field}使用统一配置数据:`, unifiedConfig.value.component[field])
    return String(unifiedConfig.value.component[field])
  }

  // 3. 使用默认值
  console.log(`🎯 [alert-status] 字段${field}使用默认值:`, defaultValue)
  return String(defaultValue)
}

// 🔥 数据来源分析函数：判断数据来自哪里
const getDataSource = (field: string) => {
  // 检查数据源数据
  if (props.data && typeof props.data === 'object' && field in props.data && props.data[field] !== undefined && props.data[field] !== null) {
    return `数据源: ${props.data[field]}`
  }

  // 检查配置数据
  if (unifiedConfig.value.component && field in unifiedConfig.value.component && unifiedConfig.value.component[field] !== undefined) {
    return `配置: ${unifiedConfig.value.component[field]}`
  }

  // 默认值
  return '使用默认值'
}

// 🔥 修复递归更新：深度比较函数，替代JSON.stringify避免proxy序列化问题
const isConfigEqual = (a: any, b: any): boolean => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (typeof a !== typeof b) return false

  if (typeof a === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
      if (!keysB.includes(key)) return false
      if (!isConfigEqual(a[key], b[key])) return false
    }

    return true
  }

  return false
}

// 🔥 监听统一配置变化 - 现在属性暴露由 useCard2Props 自动处理
watch(
  () => unifiedConfig.value,
  (newUnifiedConfig) => {
    console.log(`🔥 [alert-status] 统一配置变化 ${props.componentId}:`, {
      component: newUnifiedConfig?.component,
      title: newUnifiedConfig?.component?.title,
      amount: newUnifiedConfig?.component?.amount,
      description: newUnifiedConfig?.component?.description
    })
    // 🔥 属性暴露现在由 useCard2Props 自动处理，无需手动调用
  },
  { deep: true, immediate: true }
)

// 🔥 监听数据源变化 - 现在属性暴露由 useCard2Props 自动处理
watch(
  () => props.data,
  () => {
    console.log(`🔥 [alert-status] 数据源变化，属性暴露由Hook自动处理`)
  },
  { deep: true, immediate: true }
)

// 生命周期管理
onMounted(() => {
  console.log(`🔥 [alert-status] 组件挂载，自动同步已由useCard2Props处理`)
})

onUnmounted(() => {
  console.log(`🔥 [alert-status] 组件卸载开始，清理自动同步`)
  // 🔥 调用 Hook 提供的清理函数
  cleanupAutoSync()
  console.log(`🔥 [alert-status] 组件卸载完成`)
})

// 🔥 简化的配置更新函数 - 直接使用统一配置管理
const updateConfig = (partialCustomize: Partial<AlertStatusCustomize>) => {
  console.log(`🔥 [alert-status] 组件内部更新配置:`, {
    更新内容: partialCustomize,
    当前配置: unifiedConfig.value.component,
    组件ID: props.componentId
  })

  // 🔥 关键修复：直接使用 updateCard2Config 更新组件配置层
  updateCard2Config('component', partialCustomize)

  // 🔥 新增：同步到配置管理器，确保配置表单同步
  if (props.componentId) {
    import('@/components/visual-editor/configuration/ConfigurationIntegrationBridge')
      .then(({ configurationIntegrationBridge }) => {
        configurationIntegrationBridge.updateConfiguration(
          props.componentId!,
          'component',
          partialCustomize,
          'component-internal-update'
        )
        console.log(`✅ [alert-status] 配置已同步到配置管理器和表单`)
      })
      .catch(error => {
        console.error(`❌ [alert-status] 同步配置到管理器失败:`, error)
      })
  }

  // 🔥 发出更新事件
  emit('update:config', partialCustomize)

  console.log(`🔥 [alert-status] 配置更新完成，已同步到统一配置`)
}

// 修改标题
const changeTitle = () => {
  // 🔥 关键修复：使用统一配置中的实际值，而不是config.value
  const currentTitle = unifiedConfig.value.component?.title || '告警状态'
  const newTitle = currentTitle === '告警状态' ? '新的标题' : '告警状态'
  updateConfig({ title: newTitle })

  // 🔥 属性暴露现在由 useCard2Props 自动处理，无需手动调用

  message.success(`标题已更改为: ${newTitle}`)
}

// 修改金额
const changeAmount = () => {
  // 🔥 关键修复：使用统一配置中的实际值，而不是config.value
  const currentAmount = unifiedConfig.value.component?.amount || 0
  const newAmount = currentAmount === 0 ? Math.floor(Math.random() * 10000) : 0
  updateConfig({ amount: newAmount })

  // 🔥 属性暴露现在由 useCard2Props 自动处理，无需手动调用

  message.success(`金额已更改为: ${newAmount}`)
}

// 修改简介
const changeDescription = () => {
  const descriptions = ['系统运行正常', '数据更新中', '监控中...', '状态良好']
  // 🔥 关键修复：使用统一配置中的实际值，而不是config.value
  const currentDescription = unifiedConfig.value.component?.description || '系统运行正常'
  const currentIndex = descriptions.indexOf(currentDescription)
  const newDescription = descriptions[(currentIndex + 1) % descriptions.length]
  updateConfig({ description: newDescription })

  // 🔥 属性暴露现在由 useCard2Props 自动处理，无需手动调用

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

  // 🔥 属性暴露现在由 useCard2Props 自动处理，无需手动调用

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

  // 🔥 属性暴露现在由 useCard2Props 自动处理，无需手动调用

  message.info('已重置为默认值')
}

// 测试数据源
const testDataSource = () => {
  console.log('🔍 数据源测试信息:')
  console.log('1. 组件ID:', props.componentId)
  console.log('2. 原始数据源数据:', props.data)
  console.log('3. 当前配置:', config.value)
  console.log('4. 计算后的显示数据:', displayData.value)
  console.log('5. 统一配置:', unifiedConfig.value)

  message.info('数据源测试信息已输出到控制台，请按F12查看')
}

// 🔥 简化的外部接口，大部分功能已由 useCard2Props 自动处理
const expose = {
  getFullConfiguration,
  updateConfig,  // 使用简化的本地更新函数
  // 🔥 保留：属性监听接口，供交互引擎使用
  watchProperty: (propertyName: string, callback: (newValue: any, oldValue: any) => void) => {
    console.log(`🔥 [alert-status] 注册属性监听器: ${propertyName}`)
    return watchProperty(propertyName, callback)
  }
}

defineExpose(expose)
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
  height: 120px;
  overflow: auto;
  word-break: break-all;
}

/* 调试信息区域 */
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
  /* 🔥 增强滚动显示效果 */
  max-height: 120px;
  overflow-y: auto;
  overflow-x: auto;
  color: var(--text-color-1);
  white-space: pre-wrap;
  word-break: break-all;
  /* 🔥 美化滚动条 */
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-color) transparent;
}

/* 🔥 WebKit 浏览器滚动条美化 */
.debug-value::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.debug-value::-webkit-scrollbar-track {
  background: var(--fill-color-1);
  border-radius: 3px;
}

.debug-value::-webkit-scrollbar-thumb {
  background: var(--fill-color-3);
  border-radius: 3px;
  transition: background-color 0.2s;
}

.debug-value::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
}

/* 🔥 焦点状态下的滚动条增强 */
.debug-value:focus-within::-webkit-scrollbar-thumb {
  background: var(--primary-color-hover);
}

/* 操作按钮区域 */
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
