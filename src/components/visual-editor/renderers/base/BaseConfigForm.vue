<template>
  <div class="base-config-form">
    <!-- 基础样式配置 - 基于NodeWrapper实际使用的配置 -->
    <n-form :model="formData" label-placement="left" label-width="80" size="small">
      <!-- 显示标题开关 -->
      <n-form-item :label="$t('config.base.showTitle')" path="showTitle">
        <n-switch 
          v-model:value="formData.showTitle" 
          @update:value="handleUpdate"
        />
      </n-form-item>

      <!-- 节点标题 -->
      <n-form-item v-if="formData.showTitle" :label="$t('config.base.title')" path="title">
        <n-input 
          v-model:value="formData.title" 
          :placeholder="$t('config.base.title.placeholder')"
          @input="handleUpdate"
        />
      </n-form-item>

      <!-- 可见性开关 -->
      <n-form-item :label="$t('config.base.visible')" path="visible">
        <n-switch 
          v-model:value="formData.visible" 
          @update:value="handleUpdate"
        />
      </n-form-item>

      <!-- 透明度配置 -->
      <n-form-item :label="$t('config.base.opacity')" path="opacity">
        <n-slider 
          v-model:value="formData.opacity" 
          :min="0" 
          :max="1" 
          :step="0.1" 
          :format-tooltip="(value) => `${Math.round(value * 100)}%`"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <!-- 背景颜色 -->
      <n-form-item :label="$t('config.base.backgroundColor')" path="backgroundColor">
        <n-color-picker 
          v-model:value="formData.backgroundColor" 
          :show-alpha="true"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <!-- 边框配置 -->
      <n-form-item :label="$t('config.base.border.width')" path="borderWidth">
        <n-input-number 
          v-model:value="formData.borderWidth" 
          :min="0" 
          :max="20"
          :placeholder="$t('config.base.border.width.placeholder')"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <n-form-item :label="$t('config.base.border.color')" path="borderColor">
        <n-color-picker 
          v-model:value="formData.borderColor"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <n-form-item :label="$t('config.base.border.style')" path="borderStyle">
        <n-select 
          v-model:value="formData.borderStyle"
          :options="[
            { label: 'solid', value: 'solid' },
            { label: 'dashed', value: 'dashed' },
            { label: 'dotted', value: 'dotted' }
          ]"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <n-form-item :label="$t('config.base.border.radius')" path="borderRadius">
        <n-input-number 
          v-model:value="formData.borderRadius" 
          :min="0" 
          :max="50"
          :placeholder="$t('config.base.border.radius.placeholder')"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <!-- 阴影配置 -->
      <n-form-item :label="$t('config.base.boxShadow')" path="boxShadow">
        <n-input 
          v-model:value="formData.boxShadow" 
          :placeholder="$t('config.base.boxShadow.placeholder')"
          @input="handleUpdate"
        />
      </n-form-item>

      <!-- 内边距配置 - 四个方向 -->
      <n-divider title-placement="left">内边距配置</n-divider>
      
      <n-form-item label="上边距" path="padding.top">
        <n-input-number 
          v-model:value="formData.padding.top" 
          :min="0" 
          :max="50"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <n-form-item label="右边距" path="padding.right">
        <n-input-number 
          v-model:value="formData.padding.right" 
          :min="0" 
          :max="50"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <n-form-item label="下边距" path="padding.bottom">
        <n-input-number 
          v-model:value="formData.padding.bottom" 
          :min="0" 
          :max="50"
          @update:value="handleUpdate"
        />
      </n-form-item>

      <n-form-item label="左边距" path="padding.left">
        <n-input-number 
          v-model:value="formData.padding.left" 
          :min="0" 
          :max="50"
          @update:value="handleUpdate"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * Base配置表单
 * 位置：src/components/visual-editor/renderers/base/BaseConfigForm.vue  
 * 负责处理组件的基础渲染配置，如标题、透明度、边距等
 */

import { reactive, watch, computed, onMounted, onUnmounted } from 'vue'
import { configurationManager } from '../../configuration'
import type { BaseConfiguration } from '../../configuration/types'

// 接收props - 与ConfigurationPanel传递的参数保持一致
interface Props {
  nodeId?: string  // ConfigurationPanel传递的selectedWidget?.id
  readonly?: boolean
}

const props = defineProps<Props>()

// 定义emits
interface Emits {
  (e: 'apply', config: BaseConfiguration): void
  (e: 'reset'): void
}

const emit = defineEmits<Emits>()

/**
 * 基础配置数据结构
 * 基于NodeWrapper.vue中实际使用的BaseConfiguration接口
 */
interface BaseConfigData {
  showTitle: boolean
  title: string
  opacity: number
  visible: boolean
  backgroundColor?: string
  borderWidth?: number
  borderColor?: string
  borderStyle?: string
  borderRadius?: number
  boxShadow?: string
  padding: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

/**
 * 表单数据 - 基于NodeWrapper的实际配置结构
 */
const formData = reactive<BaseConfigData>({
  showTitle: false,
  title: '',
  opacity: 1,
  visible: true,
  backgroundColor: undefined,
  borderWidth: undefined,
  borderColor: undefined,
  borderStyle: 'solid',
  borderRadius: undefined,
  boxShadow: undefined,
  padding: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
})

// 当前选中的节点ID
const selectedNodeId = computed(() => {
  return props.nodeId || null
})

/**
 * 处理配置更新 - 使用configurationManager直接更新
 */
const handleUpdate = () => {
  const nodeId = selectedNodeId.value
  if (!nodeId) {
    console.warn('[BaseConfigForm] 没有选中的节点，无法更新配置')
    return
  }

  try {
    // 构建base配置对象
    const baseConfig: BaseConfiguration = {
      showTitle: formData.showTitle,
      title: formData.title,
      opacity: formData.opacity,
      visible: formData.visible,
      backgroundColor: formData.backgroundColor,
      borderWidth: formData.borderWidth,
      borderColor: formData.borderColor,
      borderStyle: formData.borderStyle,
      borderRadius: formData.borderRadius,
      boxShadow: formData.boxShadow,
      padding: formData.padding
    }

    // 通过configurationManager更新base配置
    configurationManager.updateConfiguration(nodeId, 'base', baseConfig)
    
    console.log('[BaseConfigForm] 已更新base配置:', {
      nodeId,
      baseConfig
    })
  } catch (error) {
    console.error('[BaseConfigForm] 更新配置失败:', error)
  }
}

/**
 * 从configurationManager加载配置数据到表单
 */
const loadConfigurationFromManager = () => {
  const nodeId = selectedNodeId.value
  if (!nodeId) {
    console.log('[BaseConfigForm] 没有选中节点，使用默认配置')
    resetToDefaults()
    return
  }

  try {
    const config = configurationManager.getConfiguration(nodeId)
    const baseConfig = config?.base

    if (baseConfig) {
      console.log('[BaseConfigForm] 从configurationManager加载配置:', baseConfig)
      
      // 同步配置到表单
      Object.assign(formData, {
        showTitle: baseConfig.showTitle ?? false,
        title: baseConfig.title || '',
        opacity: baseConfig.opacity ?? 1,
        visible: baseConfig.visible ?? true,
        backgroundColor: baseConfig.backgroundColor,
        borderWidth: baseConfig.borderWidth,
        borderColor: baseConfig.borderColor,
        borderStyle: baseConfig.borderStyle || 'solid',
        borderRadius: baseConfig.borderRadius,
        boxShadow: baseConfig.boxShadow,
        padding: baseConfig.padding || {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        }
      })
    } else {
      console.log('[BaseConfigForm] 节点没有base配置，使用默认值')
      resetToDefaults()
    }
  } catch (error) {
    console.error('[BaseConfigForm] 加载配置失败:', error)
    resetToDefaults()
  }
}

/**
 * 重置为默认值
 */
const resetToDefaults = () => {
  Object.assign(formData, {
    showTitle: false,
    title: '',
    opacity: 1,
    visible: true,
    backgroundColor: undefined,
    borderWidth: undefined,
    borderColor: undefined,
    borderStyle: 'solid',
    borderRadius: undefined,
    boxShadow: undefined,
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  })
}

// 配置变化监听器
let removeConfigListener: (() => void) | null = null

/**
 * 监听选中节点变化，重新加载配置
 */
watch(
  selectedNodeId,
  (newNodeId, oldNodeId) => {
    console.log('[BaseConfigForm] 选中节点变化:', { oldNodeId, newNodeId })
    
    // 移除旧的监听器
    if (removeConfigListener) {
      removeConfigListener()
      removeConfigListener = null
    }
    
    // 加载新节点的配置
    loadConfigurationFromManager()
    
    // 如果有新节点，添加配置变化监听器
    if (newNodeId) {
      try {
        removeConfigListener = configurationManager.onConfigurationChange(newNodeId, (newConfig) => {
          console.log('[BaseConfigForm] 配置变化回调:', newConfig.base)
          // 重新加载配置（防止外部修改配置时表单不同步）
          loadConfigurationFromManager()
        })
      } catch (error) {
        console.warn('[BaseConfigForm] 添加配置监听器失败:', error)
      }
    }
  },
  { immediate: true }
)

// 组件挂载时初始化
onMounted(() => {
  console.log('[BaseConfigForm] 组件挂载，初始化配置')
  loadConfigurationFromManager()
})

// 组件卸载时清理
onUnmounted(() => {
  if (removeConfigListener) {
    try {
      removeConfigListener()
    } catch (error) {
      console.warn('[BaseConfigForm] 移除配置监听器失败:', error)
    }
  }
})

console.log('[BaseConfigForm] 🔧 Base配置表单加载完成')
</script>

<style scoped>
.base-config-form {
  padding: 12px;
  border-radius: 6px;
  background: var(--card-color);
}

/* 表单项样式优化 */
:deep(.n-form-item) {
  margin-bottom: 12px;
}

:deep(.n-form-item-label) {
  font-size: 12px;
  color: var(--text-color-2);
}

/* 输入控件样式 */
:deep(.n-input-number) {
  width: 100%;
}

:deep(.n-select) {
  width: 100%;
}

/* 分割线样式 */
:deep(.n-divider) {
  margin: 16px 0 12px 0;
}

:deep(.n-divider__title) {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}
</style>