<!--
  新统一架构测试页面
  🔥 测试新的统一Visual Editor架构的完整功能
-->
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { IntegrationExamples } from '@/store/modules/visual-editor/integration-example'
import { useMigrationHelper, performQuickMigration } from '@/store/modules/visual-editor/migration-helper'
import { useVisualEditor } from '@/store/modules/visual-editor/index'

// 组合式API
const { t } = useI18n()
const message = useMessage()
const editor = useVisualEditor()
const migrationHelper = useMigrationHelper()

// 响应式状态
const testResults = reactive({
  basic: null as any,
  card2: null as any,
  dataFlow: null as any,
  configuration: null as any,
  fullSystem: null as any,
  errorHandling: null as any,
  migration: null as any
})

const systemStatus = ref({
  initialized: false,
  nodeCount: 0,
  widgetCount: 0,
  card2ComponentCount: 0,
  hasUnsavedChanges: false
})

const isLoading = ref(false)
const selectedTest = ref<string>('')
const testLog = ref<string[]>([])

// 计算属性
const availableTests = computed(() => [
  { key: 'basic', name: '基本功能测试', description: '测试系统初始化、节点管理、配置管理等基本功能' },
  { key: 'card2', name: 'Card2.1集成测试', description: '测试Card2.1组件的完整集成流程' },
  { key: 'dataFlow', name: '数据流管理测试', description: '测试数据流管理器和副作用处理' },
  { key: 'configuration', name: '配置管理测试', description: '测试配置服务的高级功能' },
  { key: 'fullSystem', name: '完整系统测试', description: '模拟实际使用场景的完整测试' },
  { key: 'errorHandling', name: '错误处理测试', description: '测试错误处理和恢复机制' },
  { key: 'migration', name: '架构迁移测试', description: '测试从旧架构到新架构的迁移功能' }
])

const testStatus = computed(() => {
  const total = availableTests.value.length
  const completed = Object.values(testResults).filter(result => result !== null).length
  return { total, completed, percentage: Math.round((completed / total) * 100) }
})

// 生命周期
onMounted(async () => {
  await initializeSystem()
})

// ==================== 系统管理 ====================

/**
 * 初始化系统
 */
async function initializeSystem() {
  addLog('🔧 初始化新架构系统...')
  isLoading.value = true

  try {
    await editor.initialize()
    updateSystemStatus()
    addLog('✅ 系统初始化完成')
    message.success('新架构系统初始化成功')
  } catch (error) {
    addLog(`❌ 系统初始化失败: ${error}`)
    message.error('系统初始化失败')
  } finally {
    isLoading.value = false
  }
}

/**
 * 更新系统状态
 */
function updateSystemStatus() {
  const status = editor.getStatus()
  systemStatus.value = { ...status }
  addLog(`📊 系统状态更新: ${JSON.stringify(status)}`)
}

/**
 * 重置系统
 */
async function resetSystem() {
  addLog('🔄 重置系统...')
  isLoading.value = true

  try {
    editor.cleanup()

    // 清空测试结果
    Object.keys(testResults).forEach(key => {
      testResults[key as keyof typeof testResults] = null
    })

    // 清空日志
    testLog.value = []

    // 重新初始化
    await editor.initialize()
    updateSystemStatus()

    addLog('✅ 系统重置完成')
    message.success('系统重置成功')
  } catch (error) {
    addLog(`❌ 系统重置失败: ${error}`)
    message.error('系统重置失败')
  } finally {
    isLoading.value = false
  }
}

// ==================== 测试执行 ====================

/**
 * 执行单个测试
 */
async function runSingleTest(testKey: string) {
  addLog(`🎯 开始执行测试: ${testKey}`)
  isLoading.value = true

  try {
    let result: any = null

    switch (testKey) {
      case 'basic':
        result = await IntegrationExamples.basic()
        break
      case 'card2':
        result = await IntegrationExamples.card2()
        break
      case 'dataFlow':
        result = await IntegrationExamples.dataFlow()
        break
      case 'configuration':
        result = await IntegrationExamples.configuration()
        break
      case 'fullSystem':
        result = await IntegrationExamples.fullSystem()
        break
      case 'errorHandling':
        result = await IntegrationExamples.errorHandling()
        break
      case 'migration':
        result = await performQuickMigration()
        break
      default:
        throw new Error(`未知的测试: ${testKey}`)
    }

    testResults[testKey as keyof typeof testResults] = {
      success: true,
      result,
      timestamp: new Date(),
      duration: Date.now() - performance.now()
    }

    updateSystemStatus()
    addLog(`✅ 测试完成: ${testKey}`)
    message.success(`测试 ${testKey} 执行成功`)
  } catch (error) {
    testResults[testKey as keyof typeof testResults] = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      duration: Date.now() - performance.now()
    }

    addLog(`❌ 测试失败: ${testKey} - ${error}`)
    message.error(`测试 ${testKey} 执行失败`)
  } finally {
    isLoading.value = false
  }
}

/**
 * 执行所有测试
 */
async function runAllTests() {
  addLog('🚀 开始执行所有测试')
  isLoading.value = true

  try {
    await IntegrationExamples.runAll()

    // 更新所有测试结果
    for (const test of availableTests.value) {
      testResults[test.key as keyof typeof testResults] = {
        success: true,
        result: 'All tests completed successfully',
        timestamp: new Date(),
        duration: 0
      }
    }

    updateSystemStatus()
    addLog('🎉 所有测试执行完成')
    message.success('所有测试执行成功')
  } catch (error) {
    addLog(`💥 测试执行失败: ${error}`)
    message.error('测试执行失败')
  } finally {
    isLoading.value = false
  }
}

// ==================== 迁移测试 ====================

/**
 * 检查迁移需求
 */
function checkMigration() {
  const needsMigration = migrationHelper.checkMigrationNeeded()
  const status = migrationHelper.getMigrationStatus()

  addLog(`🔍 迁移检查结果: ${needsMigration ? '需要迁移' : '无需迁移'}, 状态: ${status}`)

  if (needsMigration) {
    message.warning('检测到旧版本数据，建议执行迁移')
  } else {
    message.info('当前无需迁移')
  }
}

/**
 * 执行架构迁移
 */
async function performMigration() {
  addLog('🚀 开始执行架构迁移')
  isLoading.value = true

  try {
    const result = await performQuickMigration()

    testResults.migration = {
      success: result.status === 'completed',
      result,
      timestamp: new Date(),
      duration: 0
    }

    addLog(`📊 迁移结果: ${result.message}`)

    if (result.status === 'completed') {
      message.success('架构迁移成功完成')
    } else if (result.status === 'not_needed') {
      message.info('无需迁移')
    } else {
      message.error(`迁移失败: ${result.message}`)
    }

    updateSystemStatus()
  } catch (error) {
    addLog(`❌ 迁移执行失败: ${error}`)
    message.error('迁移执行失败')
  } finally {
    isLoading.value = false
  }
}

// ==================== 工具函数 ====================

/**
 * 添加日志
 */
function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString()
  testLog.value.push(`[${timestamp}] ${message}`)
  console.log(`[UnifiedArchitectureTest] ${message}`)
}

/**
 * 清空日志
 */
function clearLog() {
  testLog.value = []
  addLog('📝 日志已清空')
}

/**
 * 导出测试报告
 */
function exportTestReport() {
  const report = {
    timestamp: new Date().toISOString(),
    systemStatus: systemStatus.value,
    testResults: testResults,
    testLog: testLog.value
  }

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `unified_architecture_test_report_${Date.now()}.json`
  a.click()

  URL.revokeObjectURL(url)
  message.success('测试报告导出成功')
}

/**
 * 获取结果状态图标
 */
function getResultIcon(result: any) {
  if (result === null) return '⏳'
  return result.success ? '✅' : '❌'
}

/**
 * 格式化时间
 */
function formatTime(date: Date) {
  return date.toLocaleTimeString()
}
</script>

<template>
  <div class="unified-architecture-test">
    <!-- 页面头部 -->
    <div class="test-header">
      <n-space align="center" justify="space-between">
        <div>
          <h1>🔥 新统一架构测试</h1>
          <p class="description">测试新的统一Visual Editor架构的完整功能，包括数据流管理、配置服务、Card2.1集成等</p>
        </div>

        <n-space>
          <n-button type="primary" :loading="isLoading" size="large" @click="runAllTests">🚀 执行所有测试</n-button>

          <n-button :loading="isLoading" size="large" @click="resetSystem">🔄 重置系统</n-button>

          <n-button size="large" @click="exportTestReport">📊 导出报告</n-button>
        </n-space>
      </n-space>
    </div>

    <!-- 系统状态面板 -->
    <n-card title="🖥️ 系统状态" class="system-status-card">
      <n-descriptions :column="3" bordered>
        <n-descriptions-item label="初始化状态">
          <n-tag :type="systemStatus.initialized ? 'success' : 'error'">
            {{ systemStatus.initialized ? '已初始化' : '未初始化' }}
          </n-tag>
        </n-descriptions-item>

        <n-descriptions-item label="节点数量">
          <n-statistic :value="systemStatus.nodeCount" />
        </n-descriptions-item>

        <n-descriptions-item label="组件数量">
          <n-statistic :value="systemStatus.widgetCount" />
        </n-descriptions-item>

        <n-descriptions-item label="Card2组件">
          <n-statistic :value="systemStatus.card2ComponentCount" />
        </n-descriptions-item>

        <n-descriptions-item label="未保存更改">
          <n-tag :type="systemStatus.hasUnsavedChanges ? 'warning' : 'default'">
            {{ systemStatus.hasUnsavedChanges ? '有' : '无' }}
          </n-tag>
        </n-descriptions-item>

        <n-descriptions-item label="测试进度">
          <n-progress
            :percentage="testStatus.percentage"
            :status="testStatus.percentage === 100 ? 'success' : 'info'"
          />
          <span class="progress-text">{{ testStatus.completed }} / {{ testStatus.total }}</span>
        </n-descriptions-item>
      </n-descriptions>
    </n-card>

    <!-- 测试面板 -->
    <n-card title="🧪 测试面板" class="test-panel-card">
      <n-tabs type="line" animated>
        <!-- 单个测试 -->
        <n-tab-pane name="single" tab="单个测试">
          <n-space vertical size="large">
            <n-select
              v-model:value="selectedTest"
              placeholder="选择要执行的测试"
              :options="
                availableTests.map(test => ({
                  label: test.name,
                  value: test.key,
                  disabled: isLoading
                }))
              "
            />

            <n-button
              type="primary"
              :disabled="!selectedTest || isLoading"
              :loading="isLoading"
              block
              @click="runSingleTest(selectedTest)"
            >
              🎯 执行选中测试
            </n-button>

            <n-list bordered>
              <n-list-item v-for="test in availableTests" :key="test.key">
                <template #prefix>
                  {{ getResultIcon(testResults[test.key as keyof typeof testResults]) }}
                </template>

                <n-thing>
                  <template #header>
                    <n-space align="center">
                      <span>{{ test.name }}</span>
                      <n-button size="small" :loading="isLoading" @click="runSingleTest(test.key)">运行</n-button>
                    </n-space>
                  </template>

                  <template #description>
                    {{ test.description }}
                  </template>

                  <div v-if="testResults[test.key as keyof typeof testResults]" class="test-result">
                    <n-space>
                      <n-tag :type="testResults[test.key as keyof typeof testResults].success ? 'success' : 'error'">
                        {{ testResults[test.key as keyof typeof testResults].success ? '成功' : '失败' }}
                      </n-tag>

                      <span class="timestamp">
                        {{ formatTime(testResults[test.key as keyof typeof testResults].timestamp) }}
                      </span>
                    </n-space>

                    <div v-if="!testResults[test.key as keyof typeof testResults].success" class="error-message">
                      {{ testResults[test.key as keyof typeof testResults].error }}
                    </div>
                  </div>
                </n-thing>
              </n-list-item>
            </n-list>
          </n-space>
        </n-tab-pane>

        <!-- 迁移测试 -->
        <n-tab-pane name="migration" tab="迁移测试">
          <n-space vertical size="large">
            <n-alert type="info" title="架构迁移说明">
              此功能用于测试从旧的分散架构迁移到新的统一架构。 系统会自动检测旧数据并进行安全迁移。
            </n-alert>

            <n-space>
              <n-button :loading="isLoading" @click="checkMigration">🔍 检查迁移需求</n-button>

              <n-button type="primary" :loading="isLoading" @click="performMigration">🚀 执行迁移</n-button>
            </n-space>

            <div v-if="testResults.migration" class="migration-result">
              <n-card :title="testResults.migration.success ? '✅ 迁移成功' : '❌ 迁移失败'">
                <n-descriptions bordered>
                  <n-descriptions-item label="状态">
                    {{ testResults.migration.result.status }}
                  </n-descriptions-item>

                  <n-descriptions-item label="消息">
                    {{ testResults.migration.result.message }}
                  </n-descriptions-item>

                  <n-descriptions-item label="执行时间">
                    {{ formatTime(testResults.migration.timestamp) }}
                  </n-descriptions-item>
                </n-descriptions>

                <div v-if="testResults.migration.result.details" class="migration-details">
                  <n-divider>迁移详情</n-divider>
                  <n-descriptions :column="2" bordered>
                    <n-descriptions-item label="迁移节点">
                      {{ testResults.migration.result.details.migratedNodes || 0 }}
                    </n-descriptions-item>

                    <n-descriptions-item label="迁移配置">
                      {{ testResults.migration.result.details.migratedConfigurations || 0 }}
                    </n-descriptions-item>

                    <n-descriptions-item label="迁移组件">
                      {{ testResults.migration.result.details.migratedWidgets || 0 }}
                    </n-descriptions-item>

                    <n-descriptions-item label="错误数量">
                      {{ testResults.migration.result.details.errors?.length || 0 }}
                    </n-descriptions-item>
                  </n-descriptions>
                </div>
              </n-card>
            </div>
          </n-space>
        </n-tab-pane>

        <!-- 测试日志 -->
        <n-tab-pane name="log" tab="测试日志">
          <n-space vertical>
            <n-space justify="space-between">
              <span>测试执行日志 ({{ testLog.length }} 条)</span>
              <n-button size="small" @click="clearLog">🗑️ 清空日志</n-button>
            </n-space>

            <n-code :code="testLog.join('\n')" language="log" style="height: 400px; overflow-y: auto" />
          </n-space>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<style scoped>
.unified-architecture-test {
  padding: 20px;
  min-height: 100vh;
  background-color: var(--body-color);
}

.test-header {
  margin-bottom: 20px;
}

.test-header h1 {
  margin: 0;
  color: var(--primary-color);
  font-size: 28px;
}

.description {
  margin: 8px 0 0 0;
  color: var(--text-color-2);
  font-size: 14px;
}

.system-status-card,
.test-panel-card {
  margin-bottom: 20px;
}

.progress-text {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-color-2);
}

.test-result {
  margin-top: 8px;
}

.timestamp {
  font-size: 12px;
  color: var(--text-color-3);
}

.error-message {
  margin-top: 4px;
  padding: 8px;
  background-color: var(--error-color-light);
  border-radius: 4px;
  font-size: 12px;
  color: var(--error-color);
}

.migration-result {
  margin-top: 16px;
}

.migration-details {
  margin-top: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .unified-architecture-test {
    padding: 12px;
  }

  .test-header h1 {
    font-size: 24px;
  }

  .description {
    font-size: 13px;
  }
}
</style>
