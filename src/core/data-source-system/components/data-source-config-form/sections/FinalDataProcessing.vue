<template>
  <div class="final-data-processing">
    <n-text strong>数据源最终处s理:</n-text>
    <n-space vertical :size="12" style="margin-top: 8px">
      <!-- 处理方式选择 -->
      <div>
        <n-text depth="2" style="font-size: 12px; margin-bottom: 4px; display: block">
          选择如何将多个原始数据项合并为最终数据:
        </n-text>
        <n-radio-group
          :value="dataValue?.finalProcessingType || 'custom-script'"
          style="width: 100%"
          @update:value="handleProcessingTypeChange"
        >
          <n-space vertical :size="6">
            <n-radio value="merge-object" style="width: 100%">
              <n-space align="center" :size="8">
                <span style="font-weight: 500">对象合并</span>
                <n-text depth="3" style="font-size: 11px">将多个对象合并成一个大对象 (Object.assign)</n-text>
              </n-space>
            </n-radio>
            <n-radio value="concat-array" style="width: 100%">
              <n-space align="center" :size="8">
                <span style="font-weight: 500">数组连接</span>
                <n-text depth="3" style="font-size: 11px">将多个数组连接成一个数组 (Array.concat)</n-text>
              </n-space>
            </n-radio>
            <n-radio value="custom-script" style="width: 100%">
              <n-space align="center" :size="8">
                <span style="font-weight: 500">自定义脚本</span>
                <n-text depth="3" style="font-size: 11px">用JavaScript脚本自定义处理逻辑</n-text>
              </n-space>
            </n-radio>
            <n-radio value="select-specific" style="width: 100%">
              <n-space align="center" :size="8">
                <span style="font-weight: 500">选择特定数据项</span>
                <n-text depth="3" style="font-size: 11px">从多个数据项中选择一个作为最终数据</n-text>
              </n-space>
            </n-radio>
          </n-space>
        </n-radio-group>
      </div>

      <!-- 自定义脚本编辑区域 -->
      <div v-if="(dataValue?.finalProcessingType || 'custom-script') === 'custom-script'" class="custom-script-area">
        <n-card size="small" :bordered="false" style="background: var(--hover-color)">
          <template #header>
            <n-space align="center" justify="space-between">
              <n-text depth="2" style="font-size: 12px">最终处理脚本</n-text>
              <n-space :size="4">
                <n-button size="tiny" tertiary @click="emit('formatFinalScript')">
                  <template #icon>
                    <n-icon size="12">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9.5 15.5L4.5 10.5L9.5 5.5L8.09 4.09L1.5 10.68L8.09 17.27L9.5 15.5Z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M14.5 8.5L19.5 13.5L14.5 18.5L15.91 19.91L22.5 13.32L15.91 6.73L14.5 8.5Z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </n-icon>
                  </template>
                  格式化
                </n-button>
                <n-button size="tiny" tertiary @click="emit('validateFinalScript')">
                  <template #icon>
                    <n-icon size="12">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
                          stroke="currentColor"
                          stroke-width="2"
                          fill="none"
                        ></path>
                      </svg>
                    </n-icon>
                  </template>
                  验证
                </n-button>
              </n-space>
            </n-space>
          </template>

          <!-- 脚本编辑器 -->
          <div class="script-editor-container">
            <n-input
              :value="dataValue?.finalProcessingScript || 'return processedDataList'"
              type="textarea"
              :rows="8"
              placeholder="// 编写最终处理脚本&#10;// 参数: processedDataList - 已处理的原始数据项列表&#10;// 返回: 合并后的最终数据&#10;return processedDataList"
              style="font-family: 'Courier New', monospace; font-size: 12px"
              @update:value="handleScriptChange"
            />

            <!-- 脚本说明 -->
            <div style="margin-top: 8px; padding: 8px; background: var(--info-color-pressed); border-radius: 4px">
              <n-text depth="2" style="font-size: 11px; line-height: 1.4">
                <strong>脚本说明:</strong>
                <br />
                •
                <code>processedDataList</code>
                : 所有原始数据项经过过滤和脚本处理后的结果数组
                <br />
                • 示例:
                <code>Object.assign({}, ...processedDataList)</code>
                合并对象
                <br />
                • 示例:
                <code>processedDataList.flat()</code>
                连接数组
                <br />
                • 示例:
                <code>processedDataList[0]</code>
                使用第一个数据项
              </n-text>
            </div>
          </div>
        </n-card>
      </div>

      <!-- 执行结果显示区域 -->
      <div>
        <n-card size="small" :bordered="false" style="background: var(--card-color)">
          <template #header>
            <n-space align="center" justify="space-between">
              <n-text depth="2" style="font-size: 12px">执行结果</n-text>
              <!-- 🔥 修复：禁用手动执行按钮，避免与统一执行流程冲突 -->
              <n-button size="tiny" disabled :loading="isExecuting">
                手动执行 (已禁用)
              </n-button>
            </n-space>
          </template>

          <!-- 执行状态 -->
          <div v-if="isExecuting">
            <n-alert type="info" :show-icon="false">
              <template #icon><span>⏳</span></template>
              正在执行数据处理...
            </n-alert>
          </div>

          <!-- 执行错误 -->
          <div v-else-if="executionError">
            <n-alert type="error" :show-icon="false">
              <template #icon><span>❌</span></template>
              {{ executionError }}
            </n-alert>
          </div>

          <!-- 执行结果 -->
          <div v-else-if="executionResult !== null">
            <n-alert type="success" :show-icon="false" style="margin-bottom: 8px;">
              <template #icon><span>✅</span></template>
              执行成功，结果类型: {{ typeof executionResult }}
            </n-alert>
            <n-input
              type="textarea"
              :value="formatExecutionResult(executionResult)"
              :rows="6"
              readonly
              placeholder="执行结果将显示在这里"
              style="font-family: 'Courier New', monospace; font-size: 12px"
            />
          </div>

          <!-- 空状态 -->
          <div v-else>
            <n-alert type="default" :show-icon="false">
              <template #icon><span>📋</span></template>
              配置变化时将自动执行处理
            </n-alert>
          </div>
        </n-card>
      </div>
    </n-space>
  </div>
</template>

<script setup>
/**
 * 数据源最终处理组件 - 集成执行器和结果显示
 */
import { defineProps, defineEmits, ref, computed, watch } from 'vue'
import { NText, NSpace, NRadioGroup, NRadio, NCard, NButton, NIcon, NInput, NAlert } from 'naive-ui'
import { createDataSourceExecutor } from '../../../core/DataSourceExecutor'
// 🔄 重构：移除直接的组件执行器管理器导入，改用事件通信

// 组件props
const props = defineProps({
  dataSourceKey: {
    type: String,
    required: true
  },
  dataValue: {
    type: Object,
    required: true
  }
})

// 组件emits
const emit = defineEmits([
  'update:finalProcessingType',
  'update:finalProcessingScript',
  'formatFinalScript',
  'validateFinalScript',
  'execution-result' // 🔄 新增：数据执行结果事件
])

// 创建执行器实例
const executor = createDataSourceExecutor()

// 执行状态
const isExecuting = ref(false)
const executionResult = ref(null)
const executionError = ref('')

// 计算属性 - 构建执行器需要的配置
const executorConfig = computed(() => {
  return {
    dataSourceKey: props.dataSourceKey,
    configuration: {
      rawDataList: props.dataValue?.rawDataList || [], // 原始数据列表（目前为空）
      finalProcessingType: props.dataValue?.finalProcessingType || 'custom-script',
      finalProcessingScript: props.dataValue?.finalProcessingScript || 'return processedDataList',
      selectedDataItemIndex: 0
    }
  }
})

/**
 * 执行最终数据处理 - 使用新的数据架构
 */
const executeProcessing = async () => {
  console.log('🚀 [FinalDataProcessing] executeProcessing 被调用')
  
  if (isExecuting.value) {
    console.log('⏸️ [FinalDataProcessing] 已在执行中，跳过')
    return
  }
  
  isExecuting.value = true
  executionError.value = ''
  
  try {
    console.log('🔧 [FinalDataProcessing] 开始执行，配置:', executorConfig.value)
    
    // 🆕 检查是否有实际的rawDataList，如果没有就生成测试数据
    let actualRawDataList = props.dataValue?.rawDataList || []
    if (actualRawDataList.length === 0) {
      console.log('🧪 [FinalDataProcessing] rawDataList为空，生成测试数据')
      // 🔥 生成符合DataSourceExecutor期望格式的测试数据
      const testJsonData = {
        sensor: props.dataSourceKey,
        temperature: Math.round(20 + Math.random() * 20),
        humidity: Math.round(40 + Math.random() * 40),
        pressure: Math.round(1000 + Math.random() * 50),
        status: 'normal',
        timestamp: new Date().toISOString(),
        testMode: true,
        generatedBy: 'FinalDataProcessing'
      }
      
      actualRawDataList = [{
        id: `${props.dataSourceKey}_test_json`,
        name: `${props.dataSourceKey}_测试JSON数据`,
        type: 'json',
        data: testJsonData, // 🔥 DataSourceExecutor期望data字段，不是config.jsonContent
        config: {
          // 保留原有config结构以兼容其他地方的使用
          jsonContent: JSON.stringify(testJsonData, null, 2)
        },
        enabled: true
      }]
      console.log('✅ [FinalDataProcessing] 测试数据生成完成:', actualRawDataList)
    }
    
    // 🆕 更新配置，使用实际的rawDataList
    const updatedConfig = {
      ...executorConfig.value,
      configuration: {
        ...executorConfig.value.configuration,
        rawDataList: actualRawDataList
      }
    }
    
    console.log('🔧 [FinalDataProcessing] 使用更新后的配置:', updatedConfig)
    
    // 加载配置到执行器
    executor.loadConfig(updatedConfig)
    
    // 🔥 执行完整流程：先获取原始数据，再执行最终处理
    console.log('🚀 [FinalDataProcessing] 执行完整数据流程')
    const executorResult = await executor.executeAll()
    
    // 获取最终结果
    const result = executor.getFinalResult()
    
    executionResult.value = result
    console.log('✅ [FinalDataProcessing] 执行完成，结果:', result)
    console.log('✅ [FinalDataProcessing] 结果类型:', typeof result)
    console.log('✅ [FinalDataProcessing] 执行器状态:', executorResult)
    
    // 🔥 关键修复：将执行结果通过事件系统传递给组件
    try {
      console.log('🔄 [FinalDataProcessing] 准备通过事件发出执行结果')
      
      // 🆕 使用新的数据架构配置格式
      const dataSourceConfigWithResult = {
        rawDataList: actualRawDataList,
        finalProcessingType: props.dataValue?.finalProcessingType || 'custom-script',
        finalProcessingScript: props.dataValue?.finalProcessingScript || 'return processedDataList',
        finalResult: result,
        executedAt: new Date().toISOString(),
        testMode: actualRawDataList[0]?.config?.testMode || false,
        metadata: {
          source: 'final-data-processing',
          updatedAt: Date.now(),
          dataSourceKey: props.dataSourceKey
        }
      }
      
      // 🔄 重构：发出执行结果事件，由父组件处理数据更新
      emit('execution-result', {
        dataSourceKey: props.dataSourceKey,
        componentType: 'data-display',
        result: result,
        config: dataSourceConfigWithResult,
        action: 'final-processing-completed'
      })
      
      console.log('✅ [FinalDataProcessing] 执行结果已通过事件发出')
    } catch (updateError) {
      console.warn('⚠️ [FinalDataProcessing] 组件数据更新失败:', updateError)
    }
  } catch (error) {
    executionError.value = error.message || '执行失败'
    executionResult.value = null
    console.error('❌ [FinalDataProcessing] 执行失败:', error)
  } finally {
    isExecuting.value = false
  }
}

/**
 * 处理处理类型变化
 */
const handleProcessingTypeChange = (value) => {
  emit('update:finalProcessingType', value)
  // 🔥 修复：移除自动执行，避免与ConfigurationPanel的执行冲突
  // executeProcessing() // 移除自动执行
}

/**
 * 处理脚本变化  
 */
const handleScriptChange = (value) => {
  emit('update:finalProcessingScript', value)
  // 🔥 修复：移除自动执行，避免与ConfigurationPanel的执行冲突
  // executeProcessing() // 移除自动执行
}

/**
 * 格式化执行结果用于显示
 */
const formatExecutionResult = (result) => {
  if (result === null || result === undefined) {
    return 'null'
  }
  
  if (typeof result === 'string') {
    return result
  }
  
  try {
    return JSON.stringify(result, null, 2)
  } catch (error) {
    return String(result)
  }
}

// 🔥 修复：禁用自动监听执行，避免与ConfigurationPanel冲突
// 只保留手动执行按钮的功能，统一由ConfigurationPanel控制执行时机
/*
watch(() => executorConfig.value, (newConfig) => {
  console.log('🔥 [FinalDataProcessing] 配置变化检测:', newConfig)
  
  // 检查配置是否有效，避免无效执行
  if (!newConfig?.configuration?.rawDataList || newConfig.configuration.rawDataList.length === 0) {
    console.log('⏸️ [FinalDataProcessing] 配置无效或无原始数据，跳过执行')
    return
  }
  
  // 检查是否有启用的原始数据项
  const hasEnabledData = newConfig.configuration.rawDataList.some(item => item.enabled !== false)
  if (!hasEnabledData) {
    console.log('⏸️ [FinalDataProcessing] 无启用的原始数据项，跳过执行')
    return
  }
  
  console.log('🚀 [FinalDataProcessing] 配置有效，触发执行:', newConfig)
  executeProcessing()
}, { deep: true, immediate: false })
*/
</script>

<style scoped>
.final-data-processing {
  /* 样式可以根据需要添加 */
}
.custom-script-area {
  margin-top: 8px;
}
.script-editor-container {
  /* 样式可以根据需要添加 */
}
</style>
