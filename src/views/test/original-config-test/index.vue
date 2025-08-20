<template>
  <div class="original-config-test">
    <n-card title="用户原始配置测试">
      <template #header-extra>
        <n-tag type="warning">验证类型一致性修复效果</n-tag>
      </template>

      <n-space vertical :size="16">
        <!-- 说明 -->
        <n-alert type="info">
          <template #header>测试目标</template>
          <div>
            基于用户原始的v2.0.0配置（devices + metrics）测试数据处理管道是否正常工作，
            验证表单配置与执行器的类型一致性修复是否有效。
          </div>
        </n-alert>

        <!-- 测试配置区域 -->
        <n-card size="small" title="测试配置">
          <n-space vertical :size="12">
            <n-button type="primary" @click="loadOriginalConfig">加载用户原始配置格式</n-button>
            <n-button type="info" :loading="executing" @click="executeTest">执行数据处理测试</n-button>
            <n-button @click="clearResults">清空结果</n-button>
          </n-space>
        </n-card>

        <!-- 配置显示 -->
        <n-card v-if="testConfig" size="small" title="当前测试配置">
          <pre style="font-size: 12px; color: var(--text-color-2)">{{ JSON.stringify(testConfig, null, 2) }}</pre>
        </n-card>

        <!-- 执行结果 -->
        <n-card v-if="results.length > 0" size="small" title="执行结果">
          <n-space vertical :size="8">
            <div v-for="(result, index) in results" :key="index">
              <n-alert :type="result.type">
                <template #header>{{ result.title }}</template>
                <div style="font-family: monospace; font-size: 12px">
                  {{ result.message }}
                </div>
              </n-alert>
            </div>
          </n-space>
        </n-card>

        <!-- 详细日志 -->
        <n-card v-if="detailedLogs.length > 0" size="small" title="详细执行日志">
          <div
            style="
              font-family: monospace;
              font-size: 11px;
              background: var(--card-color);
              padding: 12px;
              border-radius: 4px;
              max-height: 300px;
              overflow-y: auto;
            "
          >
            <div v-for="(log, index) in detailedLogs" :key="index" style="margin-bottom: 4px">
              <span :style="{ color: getLogColor(log.level) }">{{ log.timestamp }}</span>
              <span :style="{ color: getLogColor(log.level), fontWeight: 'bold' }">[{{ log.level }}]</span>
              <span>{{ log.message }}</span>
            </div>
          </div>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 用户原始配置测试页面
 * 验证类型一致性修复后的效果
 */
import { ref, reactive } from 'vue'
import { createMultiDataSourceExecutor } from '@/core/data-source-system/core/MultiDataSourceExecutor'
import type { MultiDataSourceConfig } from '@/core/data-source-system/types/execution'

// 响应式状态
const testConfig = ref<MultiDataSourceConfig | null>(null)
const executing = ref(false)
const results = ref<Array<{ type: string; title: string; message: string }>>([])
const detailedLogs = ref<Array<{ timestamp: string; level: string; message: string }>>([])

/**
 * 加载用户原始配置格式
 * 基于用户提供的v2.0.0配置结构
 */
const loadOriginalConfig = () => {
  // 模拟用户原始配置，但使用可控的测试数据
  testConfig.value = {
    version: '2.0.0',
    exportTime: new Date().toISOString(),
    dataSources: {
      devices: {
        name: '设备数据',
        fieldsToMap: [{ sourceProperty: 'list', targetProperty: 'devices', description: '设备列表' }],
        configuration: {
          rawDataList: [
            {
              id: 'device-data',
              name: '设备HTTP数据',
              type: 'http' as const,
              config: {
                httpConfig: {
                  method: 'GET' as const,
                  url: 'https://jsonplaceholder.typicode.com/users',
                  headers: [],
                  params: [],
                  bodyType: 'none' as const,
                  bodyContent: '',
                  timeout: 5000
                },
                filterPath: '$.data.list[0]', // 模拟用户的过滤路径格式
                processScript: 'return data.map(item => ({ id: item.id, name: item.name, status: "online" }));'
              }
            }
          ],
          finalProcessingType: 'merge-object' as const
        }
      },
      metrics: {
        name: '指标数据',
        fieldsToMap: [{ sourceProperty: 'metrics', targetProperty: 'metrics', description: '系统指标' }],
        configuration: {
          rawDataList: [
            {
              id: 'metrics-data',
              name: '指标HTTP数据',
              type: 'http' as const,
              config: {
                httpConfig: {
                  method: 'GET' as const,
                  url: 'https://jsonplaceholder.typicode.com/posts',
                  headers: [],
                  params: [],
                  bodyType: 'none' as const,
                  bodyContent: '',
                  timeout: 5000
                },
                filterPath: '$.data.list[0]', // 同样的路径格式问题
                processScript: 'return { count: data.length, items: data.slice(0, 3) };'
              }
            }
          ],
          finalProcessingType: 'merge-object' as const
        }
      }
    }
  }

  addLog('info', '✅ 用户原始配置格式已加载')
  addLog('info', `📊 配置包含 ${Object.keys(testConfig.value.dataSources).length} 个数据源`)
  Object.keys(testConfig.value.dataSources).forEach(key => {
    addLog('info', `  - ${key}: ${testConfig.value!.dataSources[key].name}`)
  })
}

/**
 * 执行数据处理测试
 */
const executeTest = async () => {
  if (!testConfig.value) {
    addResult('error', '错误', '请先加载测试配置')
    return
  }

  executing.value = true
  addLog('info', '🚀 开始执行数据处理测试...')

  try {
    // 创建多数据源执行器
    const executor = createMultiDataSourceExecutor()

    addLog('info', '📋 加载配置到执行器...')
    executor.loadConfig(testConfig.value)

    addLog('info', '⚡ 开始并行执行所有数据源...')
    const state = await executor.executeAll()

    // 分析执行结果
    addLog('success', '✅ 数据源执行完成')
    addLog('info', `📊 成功: ${state.overallStats.successfulDataSources}/${state.overallStats.totalDataSources}`)
    addLog('info', `⏱️ 总耗时: ${state.overallStats.totalDuration}ms`)

    // 检查每个数据源的结果
    Object.entries(state.finalResults).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        addResult('error', `数据源 ${key}`, '返回空结果')
        addLog('error', `❌ ${key}: 返回空结果`)
      } else if (typeof value === 'object' && 'success' in value && 'data' in value) {
        addResult('error', `数据源 ${key}`, '返回脚本执行元数据对象（未修复）')
        addLog('error', `❌ ${key}: 仍返回脚本执行元数据，类型修复无效`)
      } else {
        addResult('success', `数据源 ${key}`, `成功返回处理后数据 (${typeof value})`)
        addLog('success', `✅ ${key}: 成功返回 ${typeof value} 类型数据`)

        if (typeof value === 'object') {
          addLog('info', `   数据结构: ${Object.keys(value).join(', ')}`)
        }
      }
    })

    // 验证最终结果格式
    const finalResults = state.finalResults
    if (finalResults.devices && finalResults.metrics) {
      addResult('success', '最终结果验证', '成功获取devices和metrics数据')
    } else {
      addResult('warning', '最终结果验证', `部分数据缺失: ${Object.keys(finalResults).join(', ')}`)
    }

    executor.destroy()
    addLog('info', '🗑️ 执行器已清理')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addResult('error', '执行失败', errorMessage)
    addLog('error', `❌ 执行错误: ${errorMessage}`)
  } finally {
    executing.value = false
  }
}

/**
 * 清空结果
 */
const clearResults = () => {
  results.value = []
  detailedLogs.value = []
  addLog('info', '🧹 结果已清空')
}

/**
 * 添加结果
 */
const addResult = (type: string, title: string, message: string) => {
  results.value.push({ type, title, message })
}

/**
 * 添加日志
 */
const addLog = (level: string, message: string) => {
  detailedLogs.value.push({
    timestamp: new Date().toLocaleTimeString(),
    level: level.toUpperCase(),
    message
  })
}

/**
 * 获取日志颜色
 */
const getLogColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'success':
      return 'var(--success-color)'
    case 'error':
      return 'var(--error-color)'
    case 'warning':
      return 'var(--warning-color)'
    case 'info':
      return 'var(--info-color)'
    default:
      return 'var(--text-color)'
  }
}
</script>

<style scoped>
.original-config-test {
  padding: 16px;
  max-width: 1000px;
  margin: 0 auto;
}
</style>
