<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { NInput, NInputNumber, NSwitch, NForm, NFormItem, NButton } from 'naive-ui'
import type { DataSource, ModelValue } from '../types'

// 🔥 新增：导入执行器管理器，实现配置变更后的数据更新
import { componentExecutorManager } from '../managers/ComponentExecutorManager'

/**
 * @file 数据源配置表单
 * @description 动态渲染表单来展示和修改数据源配置。
 */

// 定义组件的 Props
const props = defineProps<{
  modelValue: ModelValue // v-model 绑定的值
  dataSources: Record<string, DataSource> // 可用的数据源定义
  componentId?: string // 🔥 新增：组件ID，用于触发执行器更新
  componentType?: string // 🔥 新增：组件类型，用于触发执行器更新
}>()

// 定义组件的 Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: ModelValue): void
}>()

onMounted(() => {
  console.log('🎯 DataSourceConfigForm 组件挂载成功!')
  console.log('📊 Props modelValue:', props.modelValue)
  console.log('📋 Props dataSources:', props.dataSources)
})

// 获取当前激活的数据源键
const activeDataSourceKey = computed({
  get: () => props.modelValue?.activeDataSourceKey || '',
  set: (value: string) => {
    console.log('🔄 切换数据源:', value)
    emit('update:modelValue', {
      ...props.modelValue,
      activeDataSourceKey: value
    })
  }
})

// 获取当前数据源的完整配置对象
const activeDataSourceConfig = computed(() => {
  const key = activeDataSourceKey.value
  if (!key || !props.modelValue?.config?.dataSourceBindings) {
    return null
  }
  return props.modelValue.config.dataSourceBindings[key] || null
})

// 获取数据源选项
const dataSourceOptions = computed(() => {
  return Object.values(props.dataSources || {}).map(ds => ({
    label: ds.name,
    value: ds.key
  }))
})

// 获取原始数据
const rawData = computed({
  get: () => {
    const config = activeDataSourceConfig.value
    if (!config?.rawData) return ''
    try {
      const parsed = JSON.stringify(JSON.parse(config.rawData), null, 2)
      console.log('🔍 [DataSourceConfigForm] rawData getter 返回数据:', parsed)
      return parsed
    } catch {
      console.log('🔍 [DataSourceConfigForm] rawData getter 返回原始数据:', config.rawData)
      return config.rawData
    }
  },
  set: (value: string) => {
    console.log('🔥 [DataSourceConfigForm] rawData setter 接收到新值:', value)
    console.log('🔥 [DataSourceConfigForm] 当前活跃数据源:', activeDataSourceKey.value)
    updateDataSourceConfig('rawData', value)
  }
})

// 增强配置相关的计算属性已移除，保持代码简洁

/**
 * 更新数据源配置的顶级属性
 * @param key 配置项键名 (如 'rawData', 'metadata' 等)
 * @param value 新值
 */
const updateDataSourceConfig = (key: string, value: any) => {
  const activeKey = activeDataSourceKey.value
  if (!activeKey) {
    console.warn('⚠️ 没有选择数据源')
    return
  }

  console.log('🔧 [DataSourceConfigForm] 开始更新数据源配置:', { activeKey, key, value })
  console.log('🔍 [DataSourceConfigForm] 更新前的 modelValue:', JSON.stringify(props.modelValue, null, 2))

  const currentModelValue = { ...props.modelValue }
  if (!currentModelValue.config) {
    currentModelValue.config = { dataSourceBindings: {} }
  }
  if (!currentModelValue.config.dataSourceBindings) {
    currentModelValue.config.dataSourceBindings = {}
  }
  if (!currentModelValue.config.dataSourceBindings[activeKey]) {
    currentModelValue.config.dataSourceBindings[activeKey] = {}
  }

  // 🔥 关键调试：记录更新前后的值
  const oldValue = currentModelValue.config.dataSourceBindings[activeKey][key]
  console.log('🔍 [DataSourceConfigForm] 字段更新:', {
    field: `${activeKey}.${key}`,
    oldValue,
    newValue: value,
    valueChanged: oldValue !== value
  })

  currentModelValue.config.dataSourceBindings[activeKey][key] = value

  // 🔥 修复：添加强制更新标记，确保配置变更能被正确检测
  currentModelValue.metadata = {
    ...currentModelValue.metadata,
    updatedAt: Date.now(),
    forceUpdate: true, // 强制更新标记
    lastChangedField: `${activeKey}.${key}` // 记录变更字段
  }

  console.log('🔄 [DataSourceConfigForm] 更新后的完整 modelValue:', JSON.stringify(currentModelValue, null, 2))
  console.log('🔄 [DataSourceConfigForm] 即将 emit update:modelValue')
  emit('update:modelValue', currentModelValue)

  // 🔥 新增：直接触发执行器更新，实现即时数据刷新
  if (props.componentId && props.componentType) {
    console.log('🚀 [DataSourceConfigForm] 触发执行器更新:', {
      componentId: props.componentId,
      componentType: props.componentType,
      hasForceUpdate: currentModelValue.metadata?.forceUpdate
    })
    triggerExecutorUpdate(currentModelValue)
  } else {
    console.warn('⚠️ [DataSourceConfigForm] 缺少 componentId 或 componentType，跳过执行器更新')
  }
}

// 增强配置更新函数已移除，保持代码简洁

/**
 * 🔥 修复：触发执行器更新，实现配置变更后的即时数据刷新
 * 修复配置传递格式，与ConfigurationPanel的loadConfiguration保持一致
 */
const triggerExecutorUpdate = async (modelValue: ModelValue) => {
  if (!props.componentId || !props.componentType) {
    console.warn('⚠️ [DataSourceConfigForm] 缺少组件ID或类型，无法触发执行器更新')
    return
  }

  try {
    console.log('🚀 [DataSourceConfigForm] 触发执行器更新 - 开始:', {
      componentId: props.componentId,
      componentType: props.componentType,
      'modelValue.config': modelValue.config,
      'modelValue.metadata': modelValue.metadata,
      modelValue完整结构: JSON.stringify(modelValue, null, 2)
    })

    // 🔥 修复：直接传递 modelValue.config，与 ConfigurationPanel 保持一致
    // ConfigurationPanel 中传递的是 config.dataSource.config
    // 这里应该直接传递 modelValue.config，不要包装
    // 🔥 修复：将metadata合并到config中，确保forceUpdate标记能传递到ComponentExecutorManager
    const configWithMetadata = {
      ...modelValue.config,
      metadata: modelValue.metadata // 关键修复：将metadata合并到config中
    }

    console.log('📤 [DataSourceConfigForm] 即将调用 componentExecutorManager.updateComponentExecutor:', {
      参数1_componentId: props.componentId,
      参数2_componentType: props.componentType,
      参数3_config: configWithMetadata,
      参数3_config详细: JSON.stringify(configWithMetadata, null, 2),
      关键检查_metadata: modelValue.metadata,
      关键检查_forceUpdate: modelValue.metadata?.forceUpdate
    })

    console.log('🚀 [DataSourceConfigForm] 开始调用updateComponentExecutor...')

    const result = await componentExecutorManager.updateComponentExecutor(
      props.componentId,
      props.componentType,
      configWithMetadata // 🔥 修复：传递包含metadata的完整配置
    )

    console.log('📥 [DataSourceConfigForm] componentExecutorManager.updateComponentExecutor 返回结果:', {
      result,
      result详细: JSON.stringify(result, null, 2)
    })

    console.log('✅ [DataSourceConfigForm] updateComponentExecutor执行成功，返回结果:', result)
    console.log('✅ [DataSourceConfigForm] 结果类型:', typeof result)
    console.log('✅ [DataSourceConfigForm] 结果详情:', JSON.stringify(result, null, 2))

    if (result?.success) {
      console.log('✅ [DataSourceConfigForm] 执行器更新成功，数据已刷新')
    } else {
      console.warn('⚠️ [DataSourceConfigForm] 执行器更新失败:', result?.error)
    }
  } catch (error) {
    console.error('❌ [DataSourceConfigForm] 执行器更新异常:', error)
    console.error('❌ [DataSourceConfigForm] 错误详情:', error.message)
    console.error('❌ [DataSourceConfigForm] 错误堆栈:', error.stack)
  }
}

// 测试相关函数已移除，保持代码简洁
</script>

<template>
  <div class="data-source-config-form">
    <!-- 数据源选择 -->
    <div class="data-source-selector">
      <h4>数据源选择</h4>
      <select v-model="activeDataSourceKey" class="form-select">
        <option value="">请选择数据源</option>
        <option v-for="option in dataSourceOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <p class="current-selection">当前选择: {{ activeDataSourceKey || '未选择' }}</p>
    </div>

    <!-- 配置表单 -->
    <div v-if="activeDataSourceKey && activeDataSourceConfig" class="config-form-container">
      <!-- 原始数据配置 -->
      <div class="config-section">
        <h4>📊 原始数据</h4>
        <div class="form-group">
          <label for="rawData">Raw Data (JSON):</label>
          <textarea
            id="rawData"
            v-model="rawData"
            class="form-textarea"
            rows="8"
            placeholder="输入 JSON 格式的原始数据..."
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.data-source-config-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;

  .data-source-selector {
    .current-selection {
      margin-top: 8px;
      font-size: 14px;
      color: #666;
    }
  }

  .config-form-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .config-section {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
    background: #fafafa;

    h4 {
      margin: 0 0 16px 0;
      color: #333;
      font-size: 16px;
    }
  }

  .form-group {
    margin-bottom: 16px;

    label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
      color: #555;
    }
  }

  .form-select {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    background: white;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }
  }

  .form-textarea {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    background: white;
    resize: vertical;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }
  }

  .config-preview {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 12px;
    max-height: 300px;
    overflow-y: auto;

    pre {
      margin: 0;
      font-size: 12px;
      line-height: 1.4;
      color: #495057;
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    justify-content: flex-start;
  }

  .btn {
    padding: 10px 16px;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &.btn-success {
      background: #28a745;
      color: white;

      &:hover {
        background: #218838;
      }
    }

    &.btn-primary {
      background: #007bff;
      color: white;

      &:hover {
        background: #0056b3;
      }
    }
  }

  .debug-info {
    margin-top: 20px;
    border: 1px solid #dee2e6;
    border-radius: 6px;

    summary {
      padding: 12px;
      background: #f8f9fa;
      cursor: pointer;
      font-weight: 500;
      border-radius: 6px 6px 0 0;

      &:hover {
        background: #e9ecef;
      }
    }

    .debug-content {
      padding: 16px;
      border-top: 1px solid #dee2e6;

      h5 {
        margin: 0 0 8px 0;
        color: #495057;
        font-size: 14px;
      }

      pre {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 12px;
        margin: 0 0 16px 0;
        font-size: 12px;
        line-height: 1.4;
        overflow-x: auto;
        max-height: 200px;
        overflow-y: auto;
      }
    }
  }

  .form-body {
    padding: 10px;
    border: 1px solid #eee;
    border-radius: 4px;
  }

  .no-config-placeholder {
    text-align: center;
    color: #999;
    padding: 20px;
  }

  .w-full {
    width: 100%;
  }

  .debug-info {
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 16px;

    h3 {
      margin: 0 0 12px 0;
      color: #333;
    }

    p {
      margin: 8px 0;

      strong {
        color: #666;
      }
    }

    pre {
      background: #fff;
      border: 1px solid #eee;
      border-radius: 4px;
      padding: 8px;
      margin: 4px 0;
      font-size: 12px;
      overflow-x: auto;
    }
  }

  .action-buttons {
    display: flex;
    justify-content: center;
    padding: 16px;
    border-top: 1px solid #eee;
  }

  .randomize-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      background: #ccc;
      cursor: not-allowed;
      box-shadow: none;
    }
  }
}
</style>
