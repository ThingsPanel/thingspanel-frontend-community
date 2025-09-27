<template>
  <div ref="cardRef" class="digit-indicator-container">
    <!-- 🔥 直接显示数据源结果 - 测试用 -->
    <div class="raw-data-display">
      <div class="raw-data-title">🔥 直接数据源显示（测试）:</div>
      <div class="raw-data-content">{{ JSON.stringify(props.data) }}</div>
      <div class="raw-data-timestamp">{{ new Date().toLocaleTimeString() }}</div>
      <div class="raw-data-debug">🚨 强制调试: {{ debugTimestamp }}</div>
    </div>

    <div class="digit-indicator-content" :style="{ fontSize: fontSize }">
      <!-- 图标容器 -->
      <div class="icon-container">
        <NIcon class="icon-class" :color="iconColor">
          <component :is="iconComponent" />
        </NIcon>
      </div>

      <!-- 数值容器 -->
      <div class="value-container">
        <span
          class="value"
          :title="displayValueWithUnit"
        >
          {{ getDisplayValue('value', '45') }} {{ getDisplayValue('unit', '%') }}
        </span>
      </div>

      <!-- 指标名称容器 -->
      <div class="metric-name-container">
        <span
          class="metric-name"
          :title="getDisplayValue('metricsName', '湿度')"
        >
          {{ getDisplayValue('metricsName', '湿度') }}
        </span>
      </div>
    </div>

    <!-- 调试信息 -->
    <div v-if="shouldShowDebug" class="debug-info">
      <NCollapse size="small">
        <NCollapseItem title="调试信息" name="debug">
          <NCode :code="debugInfo" language="json" />
        </NCollapseItem>
      </NCollapse>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 数字指示器组件 - Card 2.1 版本
 * 用于显示设备的遥测数据或属性数据，包括图标、数值、单位和指标名称
 */

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NIcon, NCollapse, NCollapseItem, NCode } from 'naive-ui'
import { icons as iconOptions } from '@/components/common/icons'
import { useCard2Props } from '@/card2.1/hooks/useCard2Props'

// 🚀 导入Card2.1 Core数据绑定支持
import { dataBindingManager } from '@/card2.1/core/data-source/data-binding-manager'
import { reactiveDataManager } from '@/card2.1/core/data-source/reactive-data-manager'
import { ComponentRegistry } from '@/card2.1/core/component-registry'

// Props 接口 - Card 2.1 标准接口
interface Props {
  config: any          // 🔥 配置数据
  data?: Record<string, unknown>  // 🔥 数据源执行结果
  componentId?: string
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

// 🔥 获取初始统一配置 - 从Card2Wrapper的统一配置架构获取
function getInitialUnifiedConfig() {
  if (!props.componentId) return undefined

  console.log(`🔥 [DigitIndicator] 获取初始统一配置开始:`, props.componentId)

  try {
    // 通过DOM查找Card2Wrapper实例获取完整配置
    const cardElement = document.querySelector(`[data-component-id="${props.componentId}"]`)
    if (cardElement && (cardElement as any)?.__vueParentComponent?.exposed?.getFullConfiguration) {
      const fullConfig = (cardElement as any).__vueParentComponent.exposed.getFullConfiguration()
      console.log(`🔥 [DigitIndicator] 从Card2Wrapper获取初始配置:`, fullConfig)

      // 🔥 关键调试：显示组件配置的具体内容
      if (fullConfig?.component) {
        console.log(`🔥 [DigitIndicator] 初始组件配置:`, {
          value: fullConfig.component.value,
          unit: fullConfig.component.unit,
          metricsName: fullConfig.component.metricsName,
          iconName: fullConfig.component.iconName,
          color: fullConfig.component.color,
          完整配置: fullConfig.component
        })
      } else {
        console.warn(`🔥 [DigitIndicator] 初始配置中没有component节!`)
      }

      return fullConfig
    } else {
      console.warn(`🔥 [DigitIndicator] 未找到Card2Wrapper元素或暴露方法`)
    }
  } catch (error) {
    console.warn(`🔥 [DigitIndicator] 获取初始配置失败:`, error)
  }

  console.log(`🔥 [DigitIndicator] 返回undefined，使用默认配置`)
  return undefined
}

// 🔥 使用 Card 2.1 统一配置管理
const {
  unifiedConfig,
  updateConfig
} = useCard2Props({
  config: props.config,
  data: props.data,
  componentId: props.componentId,
  initialUnifiedConfig: getInitialUnifiedConfig()  // 🔥 传递初始统一配置
})

// 🚀 Card2.1 Core数据绑定状态
const card2CoreDataBinding = ref<string | null>(null)
const card2CoreBindingStatus = ref<any>({})
const card2CoreData = ref<Record<string, any>>({})
const useCard2CoreDataBinding = ref(false)

// 🚨 强制调试时间戳 - 监听props.data变化
const debugTimestamp = ref(Date.now())

// 🚨 监听props.data变化并强制更新调试时间戳
watch(() => props.data, (newData, oldData) => {
  debugTimestamp.value = Date.now()
  console.log('🚨 [DigitIndicator] props.data发生变化:', {
    newData,
    oldData,
    newTimestamp: debugTimestamp.value,
    调用时间: new Date().toISOString()
  })
}, { deep: true, immediate: true })

// 🚀 检查组件是否支持Card2.1 Core数据绑定
const checkCard2CoreSupport = () => {
  if (!props.componentId) return false

  const isRegistered = ComponentRegistry.has('digit-indicator')
  const dataSourceKeys = ComponentRegistry.getDataSourceKeys('digit-indicator')
  const supportsDataBinding = isRegistered && dataSourceKeys.length > 0

  console.log(`🚀 [DigitIndicator] Card2.1 Core支持检查:`, {
    componentId: props.componentId,
    isRegistered,
    dataSourceKeys,
    supportsDataBinding
  })

  useCard2CoreDataBinding.value = supportsDataBinding
  return supportsDataBinding
}

// 🚀 初始化Card2.1 Core数据绑定
const initializeCard2CoreBinding = async () => {
  if (!useCard2CoreDataBinding.value || !props.componentId) {
    console.log(`🚀 [DigitIndicator] 组件不支持Card2.1 Core数据绑定`)
    return
  }

  try {
    console.log(`🚀 [DigitIndicator] 开始初始化Card2.1 Core数据绑定:`, props.componentId)

    // 创建组件数据绑定配置
    const bindingConfig = {
      componentId: props.componentId,
      dataSourceId: `${props.componentId}-datasource`,
      bindingConfig: {
        value: { dataPath: 'value', fallbackValue: '0' },
        unit: { dataPath: 'unit', fallbackValue: '%' },
        metricsName: { dataPath: 'metricsName', fallbackValue: '数值' },
        iconName: { dataPath: 'iconName', fallbackValue: 'Water' },
        color: { dataPath: 'color', fallbackValue: '#1890ff' }
      }
    }

    // 创建绑定
    const bindingId = dataBindingManager.createBinding(bindingConfig)
    card2CoreDataBinding.value = bindingId

    // 订阅数据更新
    dataBindingManager.subscribe(bindingId, (newData) => {
      console.log(`🚀 [DigitIndicator] Card2.1 Core数据更新:`, newData)
      card2CoreData.value = newData

      // 更新绑定状态
      const status = dataBindingManager.getBindingStatus(bindingId)
      if (status) {
        card2CoreBindingStatus.value = status
      }
    })

    console.log(`✅ [DigitIndicator] Card2.1 Core数据绑定初始化完成:`, bindingId)
  } catch (error) {
    console.error(`❌ [DigitIndicator] Card2.1 Core数据绑定初始化失败:`, error)
  }
}

// 🚀 清理Card2.1 Core绑定
const cleanupCard2CoreBinding = () => {
  if (card2CoreDataBinding.value) {
    dataBindingManager.removeBinding(card2CoreDataBinding.value)
    card2CoreDataBinding.value = null
    card2CoreData.value = {}
    card2CoreBindingStatus.value = {}
    console.log(`🚀 [DigitIndicator] 已清理Card2.1 Core数据绑定:`, props.componentId)
  }
}

// 响应式数据
const fontSize = ref('14px')
const cardRef = ref<HTMLElement>()
let resizeObserver: ResizeObserver | null = null

// 🔥 增强的数据获取函数：优先使用Card2.1 Core数据，然后是props.data，最后是配置
const getDisplayValue = (field: string, defaultValue: any) => {
  console.log(`🔥 [DigitIndicator] getDisplayValue调试开始 - 字段: ${field}`)

  // 🚀 首先检查Card2.1 Core数据
  if (useCard2CoreDataBinding.value && Object.keys(card2CoreData.value).length > 0) {
    if (field in card2CoreData.value && card2CoreData.value[field] !== undefined && card2CoreData.value[field] !== null) {
      console.log(`✅ [DigitIndicator] ${field} 使用Card2.1 Core数据:`, card2CoreData.value[field])
      return String(card2CoreData.value[field])
    }
  }

  console.log('🔥 [DigitIndicator] props.data类型:', typeof props.data)
  console.log('🔥 [DigitIndicator] props.data内容:', props.data)
  console.log('🔥 [DigitIndicator] props.data的键:', props.data && typeof props.data === 'object' ? Object.keys(props.data) : '不是对象')
  console.log('🔥 [DigitIndicator] unifiedConfig.component:', unifiedConfig.value.component)
  console.log('🔥 [DigitIndicator] componentId:', props.componentId)

  // 1. 使用数据源数据
  if (props.data && typeof props.data === 'object' && field in props.data && props.data[field] !== undefined && props.data[field] !== null) {
    console.log(`✅ [DigitIndicator] ${field} 使用数据源:`, props.data[field])
    return String(props.data[field])
  } else {
    console.log(`❌ [DigitIndicator] ${field} 数据源检查失败:`, {
      hasData: !!props.data,
      isObject: typeof props.data === 'object',
      hasField: props.data && typeof props.data === 'object' && field in props.data,
      fieldValue: props.data && typeof props.data === 'object' ? props.data[field] : '无法获取',
      isUndefined: props.data && typeof props.data === 'object' ? props.data[field] === undefined : '无法判断',
      isNull: props.data && typeof props.data === 'object' ? props.data[field] === null : '无法判断'
    })
  }

  // 2. 回退到统一配置中的组件配置
  if (unifiedConfig.value.component && field in unifiedConfig.value.component && unifiedConfig.value.component[field] !== undefined) {
    console.log(`✅ [DigitIndicator] ${field} 使用配置:`, unifiedConfig.value.component[field])
    return String(unifiedConfig.value.component[field])
  } else {
    console.log(`❌ [DigitIndicator] ${field} 配置检查失败:`, {
      hasComponent: !!unifiedConfig.value.component,
      hasField: unifiedConfig.value.component && field in unifiedConfig.value.component,
      fieldValue: unifiedConfig.value.component ? unifiedConfig.value.component[field] : '无配置',
      componentKeys: unifiedConfig.value.component ? Object.keys(unifiedConfig.value.component) : '无配置'
    })
  }

  // 3. 使用默认值
  console.log(`⚠️ [DigitIndicator] ${field} 使用默认值:`, defaultValue)
  return String(defaultValue)
}

// 计算图标组件
const iconComponent = computed(() => {
  const iconName = getDisplayValue('iconName', 'Water')
  return iconOptions[iconName] || iconOptions.Water
})

// 计算图标颜色
const iconColor = computed(() => {
  return getDisplayValue('color', '#1890ff')
})

// 计算完整显示值（包含单位）
const displayValueWithUnit = computed(() => {
  return `${getDisplayValue('value', '45')} ${getDisplayValue('unit', '%')}`
})

// 计算是否显示调试信息
const shouldShowDebug = computed(() => {
  return unifiedConfig.value.component?.showDebug || false
})

// 调试信息
const debugInfo = computed(() => {
  return JSON.stringify({
    props: {
      data: props.data,
      config: props.config
    },
    unifiedConfig: unifiedConfig.value,
    computedValues: {
      value: getDisplayValue('value', '45'),
      unit: getDisplayValue('unit', '%'),
      metricsName: getDisplayValue('metricsName', '湿度'),
      iconName: getDisplayValue('iconName', 'Water'),
      color: getDisplayValue('color', '#1890ff'),
      shouldShowDebug: shouldShowDebug.value
    }
  }, null, 2)
})

// 处理 ResizeObserver 回调
const handleResize = (entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect
    const newFontSize = `${Math.min(width, height) / 10}px`
    fontSize.value = newFontSize
  }
}

// 🚀 监听Card2.1 Core数据变化
watch(() => card2CoreData.value, (newData, oldData) => {
  console.log('🚀 [DigitIndicator] Card2.1 Core数据变化监听:', {
    componentId: props.componentId,
    newData,
    oldData,
    timestamp: new Date().toISOString()
  })
}, { deep: true, immediate: true })

// 🔥 监听 props.data
watch(() => props.data, (newData, oldData) => {
  console.log('🔥 [DigitIndicator] props.data 变化监听:', {
    componentId: props.componentId,
    newData,
    oldData,
    newDataKeys: newData && typeof newData === 'object' ? Object.keys(newData) : '不是对象',
    oldDataKeys: oldData && typeof oldData === 'object' ? Object.keys(oldData) : '不是对象',
    timestamp: new Date().toISOString()
  })
}, { deep: true, immediate: true })

// 🔥 监听 unifiedConfig 变化
watch(() => unifiedConfig.value, (newConfig, oldConfig) => {
  console.log('🔥 [DigitIndicator] unifiedConfig 变化监听:', {
    componentId: props.componentId,
    newComponent: newConfig.component,
    oldComponent: oldConfig?.component,
    timestamp: new Date().toISOString()
  })
}, { deep: true, immediate: true })

// 生命周期钩子
onMounted(async () => {
  // 🚀 首先初始化Card2.1 Core数据绑定
  checkCard2CoreSupport()
  if (useCard2CoreDataBinding.value) {
    await initializeCard2CoreBinding()
  }

  if (cardRef.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(cardRef.value)
  }
})

onBeforeUnmount(() => {
  // 🚀 清理Card2.1 Core数据绑定
  cleanupCard2CoreBinding()

  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// 暴露给父组件的方法
defineExpose({
  // Card 2.1 组件的数据更新通过 props.data 自动处理
})
</script>

<style scoped>
.digit-indicator-container {
  width: 100%;
  height: 100%;
}

/* 🔥 原始数据显示区域样式 */
.raw-data-display {
  background: #f0f0f0;
  border: 2px solid #ff6b6b;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  word-break: break-all;
}

.raw-data-title {
  color: #ff6b6b;
  font-weight: bold;
  margin-bottom: 4px;
}

.raw-data-content {
  background: #fff;
  padding: 4px;
  border-radius: 2px;
  margin-bottom: 4px;
  min-height: 20px;
  font-family: monospace;
}

.raw-data-timestamp {
  color: #666;
  font-size: 10px;
  text-align: right;
}

.digit-indicator-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 5% 5%;
}

.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.icon-class {
  font-size: 3em;
}

.value-container {
  display: flex;
  justify-content: center;
  align-items: baseline;
  width: 100%;
}

.value {
  font-size: 2em;
  font-weight: bold;
  text-wrap: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-color);
}

.metric-name-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
}

.metric-name {
  font-size: 1em;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
  color: var(--text-color-2);
}

.debug-info {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .digit-indicator-content {
    padding: 3% 3%;
  }

  .icon-class {
    font-size: 2.5em;
  }

  .value {
    font-size: 1.5em;
  }
}

/* 暗主题适配 */
[data-theme="dark"] .digit-indicator-container {
  .value {
    color: var(--text-color);
  }

  .metric-name {
    color: var(--text-color-2);
  }
}
</style>