<!--
  新配置管理系统测试页面
  验证ConfigurationStateManager和ConfigurationIntegrationBridge的工作效果
-->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { runNewConfigSystemTests } from '@/core/data-architecture/test-new-config-system'
import { configurationStateManager } from '@/components/visual-editor/configuration/ConfigurationStateManager'
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'

// 国际化
const { t } = useI18n()

// 测试状态
const testStatus = reactive({
  running: false,
  completed: false,
  results: [] as string[]
})

// 系统状态
const systemStatus = reactive({
  stateManagerLoaded: false,
  bridgeLoaded: false,
  bridgeInitialized: false
})

/**
 * 运行完整测试套件
 */
const runFullTests = async () => {
  testStatus.running = true
  testStatus.completed = false
  testStatus.results = []

  try {
    console.log('🚀 开始新配置管理系统测试...')

    // 重定向console.log到UI
    const originalLog = console.log
    console.log = (...args: any[]) => {
      testStatus.results.push(args.join(' '))
      originalLog.apply(console, args)
    }

    await runNewConfigSystemTests()

    // 恢复console.log
    console.log = originalLog

    testStatus.completed = true
    testStatus.results.push('✅ 所有测试完成！')
  } catch (error) {
    console.error('❌ 测试失败:', error)
    testStatus.results.push(`❌ 测试失败: ${error}`)
  } finally {
    testStatus.running = false
  }
}

/**
 * 测试基本的配置操作
 */
const testBasicOperations = async () => {
  testStatus.results = []
  testStatus.results.push('🧪 开始基本操作测试...')

  const testComponentId = 'ui-test-component'

  try {
    // 初始化配置
    configurationStateManager.initializeConfiguration(testComponentId)
    testStatus.results.push('✅ 配置初始化成功')

    // 获取配置
    const config = configurationStateManager.getConfiguration(testComponentId)
    testStatus.results.push(`✅ 获取配置成功: ${config ? 'YES' : 'NO'}`)

    // 获取版本信息
    const version = configurationStateManager.getConfigurationVersion(testComponentId)
    testStatus.results.push(`✅ 版本信息: v${version?.version} (${version?.contentHash})`)

    // 更新配置
    const updateResult = configurationStateManager.updateConfigurationSection(
      testComponentId,
      'dataSource',
      {
        componentId: testComponentId,
        dataSources: [
          {
            sourceId: 'test-source',
            dataItems: [
              {
                item: { type: 'json', config: { jsonString: '{"ui": "test"}' } },
                processing: { filterPath: '$' }
              }
            ],
            mergeStrategy: { type: 'object' }
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      'user'
    )
    testStatus.results.push(`✅ 配置更新结果: ${updateResult}`)

    // 重复更新相同内容（应该被去重）
    const duplicateResult = configurationStateManager.updateConfigurationSection(
      testComponentId,
      'dataSource',
      {
        componentId: testComponentId,
        dataSources: [
          {
            sourceId: 'test-source',
            dataItems: [
              {
                item: { type: 'json', config: { jsonString: '{"ui": "test"}' } },
                processing: { filterPath: '$' }
              }
            ],
            mergeStrategy: { type: 'object' }
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      'user'
    )
    testStatus.results.push(`✅ 重复更新去重结果: ${duplicateResult} (应该为false)`)

    testStatus.results.push('🎉 基本操作测试完成！')
  } catch (error) {
    testStatus.results.push(`❌ 基本操作测试失败: ${error}`)
  }
}

/**
 * 检查系统状态
 */
const checkSystemStatus = () => {
  systemStatus.stateManagerLoaded = !!configurationStateManager
  systemStatus.bridgeLoaded = !!configurationIntegrationBridge

  // 检查桥接器是否已初始化
  configurationIntegrationBridge
    .initialize()
    .then(() => {
      systemStatus.bridgeInitialized = true
    })
    .catch(error => {
      console.error('桥接器初始化失败:', error)
      systemStatus.bridgeInitialized = false
    })
}

/**
 * 清空测试结果
 */
const clearResults = () => {
  testStatus.results = []
  testStatus.completed = false
}

// 组件挂载时检查系统状态
onMounted(() => {
  checkSystemStatus()
})
</script>

<template>
  <div class="new-config-system-test">
    <!-- 页面标题 -->
    <n-page-header title="新配置管理系统测试" subtitle="验证ConfigurationStateManager和ConfigurationIntegrationBridge">
      <template #extra>
        <n-space>
          <n-tag :type="systemStatus.stateManagerLoaded ? 'success' : 'error'">
            状态管理器: {{ systemStatus.stateManagerLoaded ? '已加载' : '未加载' }}
          </n-tag>
          <n-tag :type="systemStatus.bridgeLoaded ? 'success' : 'error'">
            集成桥接器: {{ systemStatus.bridgeLoaded ? '已加载' : '未加载' }}
          </n-tag>
          <n-tag :type="systemStatus.bridgeInitialized ? 'success' : 'warning'">
            桥接器状态: {{ systemStatus.bridgeInitialized ? '已初始化' : '未初始化' }}
          </n-tag>
        </n-space>
      </template>
    </n-page-header>

    <n-space vertical :size="24">
      <!-- 系统概述 -->
      <n-card title="🚀 新配置管理系统概述">
        <n-space vertical>
          <n-text>新配置管理系统彻底解决了原本添加第二个数据项时的无限循环问题，主要特性：</n-text>
          <n-ul>
            <n-li>
              <strong>内容哈希去重</strong>
              - 相同内容不会重复处理，即使对象引用不同
            </n-li>
            <n-li>
              <strong>循环检测机制</strong>
              - 防止同一组件同时进行多个配置更新
            </n-li>
            <n-li>
              <strong>配置版本控制</strong>
              - 每个配置都有版本号和时间戳
            </n-li>
            <n-li>
              <strong>防抖处理</strong>
              - 避免频繁的配置更新事件
            </n-li>
            <n-li>
              <strong>向后兼容</strong>
              - 通过集成桥接器保持与现有代码的兼容性
            </n-li>
          </n-ul>
        </n-space>
      </n-card>

      <!-- 测试控制面板 -->
      <n-card title="🧪 测试控制面板">
        <n-space :size="16">
          <n-button
            type="primary"
            :loading="testStatus.running"
            :disabled="!systemStatus.stateManagerLoaded"
            @click="runFullTests"
          >
            <template #icon>
              <span>🚀</span>
            </template>
            运行完整测试套件
          </n-button>

          <n-button type="info" :disabled="!systemStatus.stateManagerLoaded" @click="testBasicOperations">
            <template #icon>
              <span>🔧</span>
            </template>
            测试基本操作
          </n-button>

          <n-button secondary @click="clearResults">
            <template #icon>
              <span>🧹</span>
            </template>
            清空结果
          </n-button>

          <n-button secondary @click="checkSystemStatus">
            <template #icon>
              <span>🔄</span>
            </template>
            刷新状态
          </n-button>
        </n-space>
      </n-card>

      <!-- 测试结果显示 -->
      <n-card title="📋 测试结果">
        <template #header-extra>
          <n-tag v-if="testStatus.completed" type="success">测试完成</n-tag>
          <n-tag v-else-if="testStatus.running" type="warning">测试进行中...</n-tag>
          <n-tag v-else type="info">等待测试</n-tag>
        </template>

        <div class="test-results">
          <n-empty v-if="testStatus.results.length === 0" description="暂无测试结果" size="small">
            <template #icon>
              <span style="font-size: 32px">📝</span>
            </template>
          </n-empty>

          <n-scrollbar v-else style="max-height: 500px">
            <n-space vertical :size="8">
              <div
                v-for="(result, index) in testStatus.results"
                :key="index"
                class="test-result-item"
                :class="{
                  success: result.includes('✅'),
                  error: result.includes('❌'),
                  info: result.includes('🔍') || result.includes('📝'),
                  warning: result.includes('⚠️')
                }"
              >
                <n-text
                  :type="
                    result.includes('❌')
                      ? 'error'
                      : result.includes('✅')
                        ? 'success'
                        : result.includes('⚠️')
                          ? 'warning'
                          : 'default'
                  "
                  style="font-family: monospace; font-size: 12px; white-space: pre-wrap"
                >
                  {{ result }}
                </n-text>
              </div>
            </n-space>
          </n-scrollbar>
        </div>
      </n-card>

      <!-- 使用说明 -->
      <n-card title="📖 使用说明">
        <n-space vertical>
          <n-text>
            <strong>测试步骤：</strong>
          </n-text>
          <n-ol>
            <n-li>确认系统状态都是绿色（已加载/已初始化）</n-li>
            <n-li>点击"运行完整测试套件"进行全面测试</n-li>
            <n-li>观察测试结果，确认没有无限循环或错误</n-li>
            <n-li>也可以运行"测试基本操作"进行简单验证</n-li>
          </n-ol>

          <n-alert type="info" style="margin-top: 16px">
            <template #icon><span>💡</span></template>
            <strong>控制台调试：</strong>
            你也可以在浏览器控制台运行
            <n-text code>window.testNewConfigSystem()</n-text>
            来执行测试
          </n-alert>
        </n-space>
      </n-card>
    </n-space>
  </div>
</template>

<style scoped>
.new-config-system-test {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-results {
  min-height: 100px;
}

.test-result-item {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--card-color);
}

.test-result-item.success {
  border-color: var(--success-color);
  background: var(--success-color-suppl);
}

.test-result-item.error {
  border-color: var(--error-color);
  background: var(--error-color-suppl);
}

.test-result-item.warning {
  border-color: var(--warning-color);
  background: var(--warning-color-suppl);
}

.test-result-item.info {
  border-color: var(--info-color);
  background: var(--info-color-suppl);
}

/* 深色主题适配 */
[data-theme='dark'] .test-result-item {
  border-color: var(--border-color);
  background: var(--body-color);
}
</style>
