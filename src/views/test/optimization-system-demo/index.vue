<!--
🚀 属性系统优化演示页面
完整展示自动化属性注册、统一路径管理、智能配置合并和性能监控功能
-->
<template>
  <div class="optimization-demo-page">
    <n-space vertical size="large">
      <!-- 页面标题 -->
      <n-card>
        <template #header>
          <n-space align="center">
            <n-icon size="24" color="#52c41a">
              <rocket-icon />
            </n-icon>
            <n-text strong style="font-size: 20px">
              {{ $t('optimization.title') }}
            </n-text>
            <n-tag type="success" size="small">v2.1 Enhanced</n-tag>
          </n-space>
        </template>

        <n-text depth="2">
          {{ $t('optimization.description') }}
        </n-text>
      </n-card>

      <!-- 功能演示区域 -->
      <n-grid :cols="2" :x-gap="16" :y-gap="16">
        <!-- 自动化属性注册演示 -->
        <n-grid-item>
          <n-card title="🎯 自动化属性注册" size="small">
            <n-space vertical size="small">
              <n-button type="primary" :loading="isDemo1Running" @click="demonstrateAutoRegistration">
                演示自动属性注册
              </n-button>
              <n-text depth="3" style="font-size: 12px">智能检测组件配置并自动注册可监听属性</n-text>

              <!-- 演示结果 -->
              <n-alert v-if="demo1Result" type="success" size="small" :show-icon="false">
                {{ demo1Result }}
              </n-alert>
            </n-space>
          </n-card>
        </n-grid-item>

        <!-- 统一路径管理演示 -->
        <n-grid-item>
          <n-card title="🔗 统一路径管理" size="small">
            <n-space vertical size="small">
              <n-button type="info" :loading="isDemo2Running" @click="demonstratePathManagement">
                演示路径解析优化
              </n-button>
              <n-text depth="3" style="font-size: 12px">标准化属性路径格式和缓存机制</n-text>

              <!-- 演示结果 -->
              <n-alert v-if="demo2Result" type="info" size="small" :show-icon="false">
                {{ demo2Result }}
              </n-alert>
            </n-space>
          </n-card>
        </n-grid-item>

        <!-- 智能配置合并演示 -->
        <n-grid-item>
          <n-card title="⚙️ 智能配置合并" size="small">
            <n-space vertical size="small">
              <n-button type="success" :loading="isDemo3Running" @click="demonstrateConfigMerging">
                演示配置合并策略
              </n-button>
              <n-text depth="3" style="font-size: 12px">多源配置优先级合并和变更追踪</n-text>

              <!-- 演示结果 -->
              <n-alert v-if="demo3Result" type="success" size="small" :show-icon="false">
                {{ demo3Result }}
              </n-alert>
            </n-space>
          </n-card>
        </n-grid-item>

        <!-- 性能监控演示 -->
        <n-grid-item>
          <n-card title="📊 性能监控" size="small">
            <n-space vertical size="small">
              <n-button type="warning" :loading="isDemo4Running" @click="demonstratePerformanceMonitoring">
                演示性能监控
              </n-button>
              <n-text depth="3" style="font-size: 12px">实时性能指标和缓存优化</n-text>

              <!-- 演示结果 -->
              <n-alert v-if="demo4Result" type="warning" size="small" :show-icon="false">
                {{ demo4Result }}
              </n-alert>
            </n-space>
          </n-card>
        </n-grid-item>
      </n-grid>

      <!-- 实时性能面板 -->
      <performance-monitor />

      <!-- 属性绑定可视化器 -->
      <property-binding-visualizer />

      <!-- 演示日志 -->
      <n-card v-if="demoLogs.length > 0" title="📝 演示日志">
        <n-timeline>
          <n-timeline-item
            v-for="log in recentLogs"
            :key="log.id"
            :type="log.type"
            :title="log.title"
            :content="log.content"
            :time="log.time"
          />
        </n-timeline>

        <n-space justify="end" style="margin-top: 12px">
          <n-button size="small" @click="clearLogs">清空日志</n-button>
        </n-space>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * 🚀 属性系统优化演示页面
 * 展示所有新功能的完整使用方法和效果
 */

import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NSpace,
  NCard,
  NGrid,
  NGridItem,
  NIcon,
  NText,
  NTag,
  NButton,
  NAlert,
  NTimeline,
  NTimelineItem
} from 'naive-ui'
import { RocketOutline as RocketIcon } from '@vicons/ionicons5'

// 导入优化后的核心功能
import { propertyExposureRegistry, enhancedAutoRegister } from '@/card2.1/core/property-exposure'
import { PropertyPath, PropertyPathManager } from '@/card2.1/core/property-path-manager'
import { ConfigMerge, ConfigMergeManager } from '@/card2.1/core/config-merge-manager'
import { performanceOptimizer } from '@/card2.1/core/performance-optimizer'

// 导入新组件
import PerformanceMonitor from '@/card2.1/components/dashboard/performance-monitor/PerformanceMonitor.vue'
import PropertyBindingVisualizer from '@/card2.1/components/dashboard/property-binding-visualizer/PropertyBindingVisualizer.vue'

const { t } = useI18n()

// 演示状态
const isDemo1Running = ref(false)
const isDemo2Running = ref(false)
const isDemo3Running = ref(false)
const isDemo4Running = ref(false)

const demo1Result = ref('')
const demo2Result = ref('')
const demo3Result = ref('')
const demo4Result = ref('')

// 演示日志
const demoLogs = ref<
  Array<{
    id: number
    type: 'success' | 'info' | 'warning' | 'error'
    title: string
    content: string
    time: string
  }>
>([])

let logId = 1

const recentLogs = computed(() => {
  return demoLogs.value.slice(-10) // 只显示最近10条
})

/**
 * 添加演示日志
 */
const addDemoLog = (type: 'success' | 'info' | 'warning' | 'error', title: string, content: string) => {
  demoLogs.value.unshift({
    id: logId++,
    type,
    title,
    content,
    time: new Date().toLocaleTimeString()
  })
}

/**
 * 演示自动化属性注册
 */
const demonstrateAutoRegistration = async () => {
  isDemo1Running.value = true
  demo1Result.value = ''

  console.log('🎯 开始演示自动化属性注册...')

  try {
    // 模拟组件定义
    const mockComponentDefinition = {
      type: 'demo-widget-enhanced',
      name: '增强演示组件',
      config: {
        title: '默认标题',
        themeColor: '#1890ff',
        fontSize: 14,
        isVisible: true,
        data: {
          value: 100,
          unit: 'px'
        },
        customSettings: {
          enableAnimation: true,
          animationDuration: 300
        }
      }
    }

    // 模拟设置配置
    const mockSettingConfig = {
      componentType: 'demo-widget-enhanced',
      settings: [
        {
          field: 'customProperty',
          label: '自定义属性',
          type: 'input',
          defaultValue: 'enhanced-value'
        }
      ]
    }

    // 使用增强的自动注册
    enhancedAutoRegister(mockComponentDefinition.type, mockComponentDefinition, mockSettingConfig)

    // 获取注册结果
    const exposure = propertyExposureRegistry.getComponentExposure('demo-widget-enhanced')
    const propertiesCount = exposure?.listenableProperties.length || 0

    demo1Result.value = `成功注册了 ${propertiesCount} 个属性，包括自动检测和手动配置的属性`

    addDemoLog(
      'success',
      '自动属性注册演示完成',
      `组件类型：${mockComponentDefinition.type}，属性数量：${propertiesCount}`
    )

    console.log('✅ 自动属性注册演示完成', {
      componentType: mockComponentDefinition.type,
      propertiesCount,
      properties: exposure?.listenableProperties.map(p => p.name)
    })
  } catch (error) {
    demo1Result.value = `演示失败：${error}`
    addDemoLog('error', '自动属性注册失败', String(error))
    console.error('❌ 自动属性注册演示失败:', error)
  } finally {
    isDemo2Running.value = false
    setTimeout(() => {
      isDemo1Running.value = false
    }, 500)
  }
}

/**
 * 演示统一路径管理
 */
const demonstratePathManagement = async () => {
  isDemo2Running.value = true
  demo2Result.value = ''

  console.log('🎯 开始演示统一路径管理...')

  try {
    const testPaths = [
      'component-123.title',
      'widget-456.data.value',
      'panel-789.customSettings.enableAnimation',
      'invalid-path',
      'comp.nested.deep.property'
    ]

    let successCount = 0
    let cacheHits = 0

    // 第一轮解析（无缓存）
    const startTime = performance.now()

    for (const path of testPaths) {
      const result = PropertyPath.parse(path)
      if (result.isValid) {
        successCount++
        console.log(`✅ 路径解析成功: ${path}`, result.pathInfo)
      } else {
        console.log(`❌ 路径解析失败: ${path}`, result.error)
      }
    }

    // 第二轮解析（缓存命中）
    for (const path of testPaths) {
      const result = PropertyPath.parse(path)
      if (result.isValid) {
        cacheHits++
      }
    }

    const endTime = performance.now()
    const parseTime = endTime - startTime

    demo2Result.value = `解析了 ${testPaths.length} 个路径，成功 ${successCount} 个，缓存命中 ${cacheHits} 次，耗时 ${parseTime.toFixed(2)}ms`

    addDemoLog('info', '路径管理演示完成', `总路径：${testPaths.length}，成功：${successCount}，缓存命中：${cacheHits}`)

    console.log('✅ 统一路径管理演示完成', {
      totalPaths: testPaths.length,
      successCount,
      cacheHits,
      parseTime: parseTime.toFixed(2) + 'ms'
    })
  } catch (error) {
    demo2Result.value = `演示失败：${error}`
    addDemoLog('error', '路径管理演示失败', String(error))
    console.error('❌ 路径管理演示失败:', error)
  } finally {
    setTimeout(() => {
      isDemo2Running.value = false
    }, 500)
  }
}

/**
 * 演示智能配置合并
 */
const demonstrateConfigMerging = async () => {
  isDemo3Running.value = true
  demo3Result.value = ''

  console.log('🎯 开始演示智能配置合并...')

  try {
    // 准备多个配置源
    const configSources = {
      default: {
        title: '默认标题',
        color: '#000000',
        size: 14
      },
      user: {
        title: '用户标题',
        color: '#1890ff',
        padding: 10
      },
      interaction: {
        color: '#52c41a',
        isHighlighted: true
      },
      dataSource: {
        title: '数据绑定标题',
        dynamicValue: 123
      }
    }

    // 执行配置合并
    const startTime = performance.now()
    const mergeResult = ConfigMerge.merge(configSources, {
      priorityOrder: ['default', 'user', 'dataSource', 'interaction'],
      enableDeepMerge: true,
      preserveSource: true,
      enableChangeTracking: true
    })
    const endTime = performance.now()

    const mergeTime = endTime - startTime

    demo3Result.value = `合并了 ${Object.keys(configSources).length} 个配置源，变更字段 ${mergeResult.stats?.changedFields || 0} 个，耗时 ${mergeTime.toFixed(2)}ms`

    addDemoLog(
      'success',
      '配置合并演示完成',
      `源数量：${Object.keys(configSources).length}，变更：${mergeResult.stats?.changedFields || 0}，耗时：${mergeTime.toFixed(2)}ms`
    )

    console.log('✅ 智能配置合并演示完成', {
      sources: Object.keys(configSources),
      mergedConfig: mergeResult.merged,
      stats: mergeResult.stats,
      changes: mergeResult.changes?.length || 0
    })

    // 演示智能更新
    const updateResult = ConfigMerge.smartUpdate(
      mergeResult.merged,
      { color: '#f5222d', newProperty: 'test' },
      'runtime',
      mergeResult.sourceMap
    )

    console.log('✅ 智能配置更新演示', {
      updates: updateResult.changes?.length || 0,
      finalConfig: updateResult.merged
    })
  } catch (error) {
    demo3Result.value = `演示失败：${error}`
    addDemoLog('error', '配置合并演示失败', String(error))
    console.error('❌ 配置合并演示失败:', error)
  } finally {
    setTimeout(() => {
      isDemo3Running.value = false
    }, 500)
  }
}

/**
 * 演示性能监控
 */
const demonstratePerformanceMonitoring = async () => {
  isDemo4Running.value = true
  demo4Result.value = ''

  console.log('🎯 开始演示性能监控...')

  try {
    // 模拟一些性能操作
    performanceOptimizer.recordMetric('propertyParsingTime', Math.random() * 50)
    performanceOptimizer.recordMetric('configMergeTime', Math.random() * 30)
    performanceOptimizer.recordMetric('componentRenderTime', Math.random() * 100)

    // 模拟缓存操作
    performanceOptimizer.cacheConfigMergeResult('test-key-1', { result: 'cached-data-1' })
    performanceOptimizer.cacheConfigMergeResult('test-key-2', { result: 'cached-data-2' })
    performanceOptimizer.cachePropertyParseResult('test-path', { parsed: true })

    // 获取性能报告
    const report = performanceOptimizer.getPerformanceReport()

    const totalOperations =
      (report.metrics.operationStats?.propertyLookups || 0) +
      (report.metrics.operationStats?.configMerges || 0) +
      (report.metrics.operationStats?.pathParses || 0)

    demo4Result.value = `记录了性能指标，总操作数：${totalOperations}，缓存项：${Object.values(report.cacheStats).reduce((a, b) => a + b, 0)}，警报数：${report.alerts.length}`

    addDemoLog(
      'warning',
      '性能监控演示完成',
      `操作数：${totalOperations}，缓存使用：${Object.values(report.cacheStats).reduce((a, b) => a + b, 0)}`
    )

    console.log('✅ 性能监控演示完成', {
      metrics: report.metrics,
      cacheStats: report.cacheStats,
      alertsCount: report.alerts.length
    })
  } catch (error) {
    demo4Result.value = `演示失败：${error}`
    addDemoLog('error', '性能监控演示失败', String(error))
    console.error('❌ 性能监控演示失败:', error)
  } finally {
    setTimeout(() => {
      isDemo4Running.value = false
    }, 500)
  }
}

/**
 * 清空演示日志
 */
const clearLogs = () => {
  demoLogs.value = []
  demo1Result.value = ''
  demo2Result.value = ''
  demo3Result.value = ''
  demo4Result.value = ''
}

// 初始化演示
addDemoLog('info', '优化系统演示页面已启动', '点击上方按钮开始体验各项优化功能')
</script>

<style scoped>
.optimization-demo-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .optimization-demo-page :deep(.n-grid) {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 768px) {
  .optimization-demo-page {
    padding: 16px;
  }
}
</style>
