<template>
  <div class="data-source-config-form">
    <!-- 数据源头部 -->
    <DataSourceHeader
      :data-source-options="dataSourceOptions"
      :active-data-source-key="activeDataSourceKey"
      @update:active-data-source-key="handleDataSourceChange"
    />

    <!-- 最终数据处理 -->
    <FinalDataProcessing
      :data-value="currentDataSource"
      @update:finalProcessingType="handleFinalProcessingTypeUpdate"
      @update:finalProcessingScript="handleFinalProcessingScriptUpdate"
      @formatFinalScript="handleFormatFinalScript"
      @validateFinalScript="handleValidateFinalScript"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DataSourceHeader from './DataSourceHeader.vue'
import FinalDataProcessing from './FinalDataProcessing.vue'
import { componentExecutorManager } from '../../core/ComponentExecutorManager'

// Props 定义
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  dataSources: {
    type: Object,
    required: true
  },
  componentId: {
    type: String,
    required: true
  },
  componentType: {
    type: String,
    required: true
  }
})

// Emits 定义
const emit = defineEmits(['update:modelValue'])

// 获取当前激活的数据源键
const activeDataSourceKey = computed(() => {
  return Object.keys(props.modelValue)[0] || ''
})

// 获取当前数据源的完整配置对象
const currentDataSource = computed(() => {
  return props.modelValue[activeDataSourceKey.value] || {}
})

// 获取数据源选项
const dataSourceOptions = computed(() => {
  return Object.keys(props.dataSources).map(key => ({
    label: `${props.dataSources[key].type} - ${key}`,
    value: key,
    type: props.dataSources[key].type,
    example: props.dataSources[key].example
  }))
})

// 处理数据源切换
function handleDataSourceChange(newKey) {
  if (newKey && newKey !== activeDataSourceKey.value) {
    const newConfig = {
      [newKey]: props.dataSources[newKey]
    }
    emit('update:modelValue', newConfig)
    triggerExecutorUpdate()
  }
}

// 处理最终处理类型更新
function handleFinalProcessingTypeUpdate(type) {
  const updatedConfig = {
    ...props.modelValue,
    [activeDataSourceKey.value]: {
      ...currentDataSource.value,
      finalProcessingType: type
    }
  }
  emit('update:modelValue', updatedConfig)
  triggerExecutorUpdate()
}

// 处理最终处理脚本更新
function handleFinalProcessingScriptUpdate(script) {
  const updatedConfig = {
    ...props.modelValue,
    [activeDataSourceKey.value]: {
      ...currentDataSource.value,
      finalProcessingScript: script
    }
  }
  emit('update:modelValue', updatedConfig)
  triggerExecutorUpdate()
}

// 处理脚本格式化
function handleFormatFinalScript() {
  // 这里可以添加脚本格式化逻辑
  console.log('格式化最终处理脚本')
}

// 处理脚本验证
function handleValidateFinalScript() {
  // 这里可以添加脚本验证逻辑
  console.log('验证最终处理脚本')
}

// 触发执行器更新的函数
function triggerExecutorUpdate() {
  try {
    componentExecutorManager.updateComponentConfig(props.componentId, {
      dataSourceBindings: props.modelValue
    })
    console.log('✅ 触发执行器更新成功:', props.componentId)
  } catch (error) {
    console.error('❌ 触发执行器更新失败:', error)
  }
}
</script>

<style scoped>
.data-source-config-form {
  padding: 16px;
}
.config-editor {
  margin-top: 16px;
}
</style>
