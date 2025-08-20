<template>
  <div class="data-source-processor">
    <n-card title="数据源处理器">
      <template #header-extra>
        <n-tag type="info" size="small">独立数据处理组件</n-tag>
      </template>

      <n-space vertical :size="16">
        <!-- 导入配置区域 -->
        <n-card size="small" title="1. 导入配置">
          <n-space vertical :size="12">
            <n-form-item label="配置JSON">
              <n-input
                v-model:value="configJson"
                type="textarea"
                :rows="8"
                placeholder="请粘贴从数据源配置表单导出的JSON配置..."
                style="font-family: monospace; font-size: 12px"
              />
            </n-form-item>

            <n-space>
              <n-button type="primary" :disabled="!configJson.trim()" @click="loadConfig">加载配置</n-button>
              <n-button @click="clearConfig">清空</n-button>
            </n-space>

            <div v-if="loadedConfig">
              <n-alert type="success">
                <template #header>配置加载成功</template>
                <div v-if="isMultiDataSource">
                  <div>多数据源配置 (v{{ (loadedConfig as MultiDataSourceConfig).version }})</div>
                  <div>
                    数据源数量: {{ Object.keys((loadedConfig as MultiDataSourceConfig).dataSources).length }} 个
                  </div>
                  <div>数据源: {{ Object.keys((loadedConfig as MultiDataSourceConfig).dataSources).join(', ') }}</div>
                </div>
                <div v-else>
                  <div>单数据源配置</div>
                  <div>数据源: {{ (loadedConfig as DataSourceConfig).dataSourceKey }}</div>
                  <div>
                    原始数据项: {{ (loadedConfig as DataSourceConfig).configuration.rawDataList?.length || 0 }} 个
                  </div>
                  <div>处理类型: {{ (loadedConfig as DataSourceConfig).configuration.finalProcessingType }}</div>
                </div>
              </n-alert>
            </div>
          </n-space>
        </n-card>

        <!-- 数据处理区域 -->
        <n-card v-if="loadedConfig" size="small" title="2. 数据处理">
          <n-space vertical :size="12">
            <!-- 原始数据展示 -->
            <div>
              <n-text strong>原始数据项 ({{ rawDataItems.length }} 个):</n-text>
              <n-space vertical :size="8" style="margin-top: 8px">
                <n-card
                  v-for="(item, index) in rawDataItems"
                  :key="item.id"
                  size="small"
                  :bordered="true"
                  style="background: var(--code-color)"
                >
                  <template #header>
                    <n-space align="center">
                      <n-tag :type="item.success ? 'success' : 'error'" size="small">
                        {{ item.success ? '成功' : '失败' }}
                      </n-tag>
                      <span style="font-size: 12px">{{ item.name || item.id }}</span>
                      <span v-if="item.timestamp" style="font-size: 10px; color: var(--text-color-3)">
                        {{ new Date(item.timestamp).toLocaleTimeString() }}
                      </span>
                    </n-space>
                  </template>

                  <div v-if="item.success">
                    <pre style="margin: 0; font-size: 10px; max-height: 120px; overflow-y: auto">{{
                      JSON.stringify(item.data, null, 2)
                    }}</pre>
                  </div>
                  <div v-else style="color: var(--error-color); font-size: 12px">错误: {{ item.error }}</div>
                </n-card>
              </n-space>
            </div>

            <!-- 处理控制 -->
            <n-space>
              <n-button type="primary" :loading="processing" @click="processData">
                <template #icon>
                  <n-icon>
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2L12 6M12 18L12 22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12L6 12M18 12L22 12M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </n-icon>
                </template>
                执行数据处理
              </n-button>
              <n-text depth="2" style="font-size: 12px">处理方式: {{ processingTypeText }}</n-text>
            </n-space>
          </n-space>
        </n-card>

        <!-- 处理结果区域 -->
        <n-card v-if="processedData" size="small" title="3. 处理结果">
          <div>
            <n-space justify="space-between" align="center" style="margin-bottom: 8px">
              <n-text strong>最终数据:</n-text>
              <n-space>
                <n-button size="small" @click="copyResult">复制结果</n-button>
                <n-button size="small" type="info" @click="showResultModal = true">详细查看</n-button>
              </n-space>
            </n-space>

            <n-card size="small" style="background: var(--code-color)">
              <pre style="margin: 0; font-size: 11px; max-height: 200px; overflow-y: auto">{{
                JSON.stringify(processedData, null, 2)
              }}</pre>
            </n-card>
          </div>
        </n-card>

        <!-- 错误信息 -->
        <n-alert v-if="errorMessage" type="error">
          <template #header>处理错误</template>
          {{ errorMessage }}
        </n-alert>
      </n-space>
    </n-card>

    <!-- 结果详情弹窗 -->
    <n-modal v-model:show="showResultModal" preset="dialog" title="处理结果详情" style="width: 800px">
      <n-code :code="JSON.stringify(processedData, null, 2)" language="json" />
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据源处理器组件
 * 独立组件，用于导入配置并处理数据，测试整个数据处理链路
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { createDataSourceExecutor } from '../core/DataSourceExecutor'
import { createMultiDataSourceExecutor, createExecutorByConfig } from '../core/MultiDataSourceExecutor'
import type {
  DataSourceConfig,
  ExecutionState,
  MultiDataSourceConfig,
  MultiDataSourceExecutionState,
  IDataSourceExecutor,
  IMultiDataSourceExecutor
} from '../types/execution'

// 执行器实例（可能是单数据源或多数据源执行器）
let executor: IDataSourceExecutor | IMultiDataSourceExecutor | null = null

// 响应式状态
const configJson = ref('')
const loadedConfig = ref<DataSourceConfig | MultiDataSourceConfig | null>(null)
const executionState = ref<ExecutionState | MultiDataSourceExecutionState | null>(null)
const processing = ref(false)
const errorMessage = ref('')
const showResultModal = ref(false)
const isMultiDataSource = ref(false)

// 计算属性
const rawDataItems = computed(() => {
  if (isMultiDataSource.value) {
    // 多数据源：合并所有数据源的原始数据结果
    const multiState = executionState.value as MultiDataSourceExecutionState
    const allRawData: any[] = []

    Object.entries(multiState?.dataSourceStates || {}).forEach(([dataSourceKey, state]) => {
      state.rawDataResults.forEach(result => {
        allRawData.push({
          ...result,
          dataSourceKey, // 添加数据源标识
          name: `[${dataSourceKey}] ${result.name}`
        })
      })
    })

    return allRawData
  } else {
    // 单数据源
    const singleState = executionState.value as ExecutionState
    return singleState?.rawDataResults || []
  }
})

const processingTypeText = computed(() => {
  if (isMultiDataSource.value) {
    return '多数据源处理'
  } else {
    const singleConfig = loadedConfig.value as DataSourceConfig
    const type = singleConfig?.configuration?.finalProcessingType
    switch (type) {
      case 'merge-object':
        return '对象合并'
      case 'concat-array':
        return '数组连接'
      case 'custom-script':
        return '自定义脚本'
      case 'select-specific':
        return '选择特定项'
      default:
        return '未知'
    }
  }
})

const processedData = computed(() => {
  if (isMultiDataSource.value) {
    // 多数据源：返回合并后的结果对象
    const multiState = executionState.value as MultiDataSourceExecutionState
    return multiState?.finalResults || {}
  } else {
    // 单数据源：返回最终结果
    const singleState = executionState.value as ExecutionState
    return singleState?.finalResult
  }
})

/**
 * 加载配置
 */
const loadConfig = () => {
  try {
    const rawConfig = JSON.parse(configJson.value)

    // 🔥 使用通用执行器创建函数自动识别配置格式
    if (rawConfig.version === '2.0.0' && rawConfig.dataSources) {
      // v2.0.0 多数据源格式
      isMultiDataSource.value = true
      executor = createMultiDataSourceExecutor()
      executor.loadConfig(rawConfig as MultiDataSourceConfig)
      loadedConfig.value = rawConfig as MultiDataSourceConfig

      console.log('📥 [Processor] 检测到v2.0.0多数据源配置格式:', {
        dataSourceCount: Object.keys(rawConfig.dataSources).length,
        dataSourceKeys: Object.keys(rawConfig.dataSources)
      })
    } else if (rawConfig.dataSourceKey && rawConfig.configuration) {
      // 旧的单数据源格式
      isMultiDataSource.value = false
      executor = createDataSourceExecutor()
      executor.loadConfig(rawConfig as DataSourceConfig)
      loadedConfig.value = rawConfig as DataSourceConfig

      console.log('📥 [Processor] 检测到旧单数据源配置格式')
    } else {
      throw new Error(
        '配置格式不正确，缺少必要字段。支持的格式：\n1. v2.0.0格式（包含version和dataSources字段）\n2. 旧格式（包含dataSourceKey和configuration字段）'
      )
    }

    executionState.value = null
    errorMessage.value = ''

    console.log('📥 [Processor] 配置加载成功')
    window.$message?.success(`配置加载成功 (${isMultiDataSource.value ? '多数据源' : '单数据源'})`)
  } catch (error) {
    errorMessage.value = `配置解析失败: ${error instanceof Error ? error.message : String(error)}`
    console.error('❌ [Processor] 配置加载失败:', error)
  }
}

/**
 * 清空配置
 */
const clearConfig = () => {
  configJson.value = ''
  loadedConfig.value = null
  executionState.value = null
  errorMessage.value = ''
  isMultiDataSource.value = false

  // 销毁当前执行器
  if (executor) {
    executor.destroy()
    executor = null
  }
}

/**
 * 处理数据 - 使用执行器
 */
const processData = async () => {
  if (!loadedConfig.value || !executor) {
    errorMessage.value = '请先加载配置'
    return
  }

  processing.value = true
  errorMessage.value = ''

  try {
    console.log('🔄 [Processor] 开始使用执行器处理数据', {
      isMultiDataSource: isMultiDataSource.value
    })

    // 使用执行器执行所有数据源
    const state = await executor.executeAll()
    executionState.value = state

    if (isMultiDataSource.value) {
      const multiState = state as MultiDataSourceExecutionState
      console.log('✅ [Processor] 多数据源处理成功:', {
        finalResults: multiState.finalResults,
        successfulDataSources: multiState.overallStats.successfulDataSources,
        failedDataSources: multiState.overallStats.failedDataSources
      })
      window.$message?.success(
        `多数据源处理完成 (成功: ${multiState.overallStats.successfulDataSources}, 失败: ${multiState.overallStats.failedDataSources})`
      )
    } else {
      const singleState = state as ExecutionState
      console.log('✅ [Processor] 单数据源处理成功:', singleState.finalResult)
      window.$message?.success('数据处理完成')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    errorMessage.value = `数据处理失败: ${message}`
    console.error('❌ [Processor] 数据处理失败:', error)
  } finally {
    processing.value = false
  }
}

/**
 * 复制结果到剪贴板
 */
const copyResult = async () => {
  if (!processedData.value) return

  try {
    const text = JSON.stringify(processedData.value, null, 2)
    await navigator.clipboard.writeText(text)
    window.$message?.success('结果已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    window.$message?.error('复制失败')
  }
}

// 生命周期钩子
onUnmounted(() => {
  if (executor) {
    executor.destroy()
  }
})
</script>

<style scoped>
.data-source-processor {
  max-width: 1000px;
  margin: 0 auto;
  padding: 16px;
}

/* 代码区域样式 */
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
