<!--
🚀 属性系统优化演示
展示新的自动化属性注册、路径管理、配置合并和性能监控功能
-->
<template>
  <div class="optimization-demo">
    <n-card title="🚀 属性系统优化演示" :bordered="false">
      <n-space vertical size="large">
        <!-- 功能开关 -->
        <n-card size="small" title="演示控制">
          <n-space>
            <n-switch v-model:value="showPerformanceMonitor" size="small">
              <template #checked>显示性能监控</template>
              <template #unchecked>隐藏性能监控</template>
            </n-switch>

            <n-switch v-model:value="showPropertyVisualizer" size="small">
              <template #checked>显示属性可视化</template>
              <template #unchecked>隐藏属性可视化</template>
            </n-switch>
          </n-space>
        </n-card>

        <!-- 演示操作 -->
        <n-card size="small" title="演示操作">
          <n-space>
            <n-button type="primary" @click="demonstrateAutoRegistration">演示自动属性注册</n-button>

            <n-button type="info" @click="demonstratePathParsing">演示路径解析优化</n-button>

            <n-button type="success" @click="demonstrateConfigMerging">演示配置合并策略</n-button>

            <n-button type="warning" @click="clearPerformanceData">清理性能数据</n-button>
          </n-space>
        </n-card>

        <!-- 演示结果 -->
        <n-card v-if="demoResults.length > 0" size="small" title="演示结果">
          <n-timeline>
            <n-timeline-item
              v-for="result in demoResults"
              :key="result.id"
              :type="result.type"
              :title="result.title"
              :content="result.content"
              :time="result.time"
            />
          </n-timeline>
        </n-card>

        <!-- 性能监控面板 -->
        <performance-monitor v-if="showPerformanceMonitor" />

        <!-- 属性绑定可视化器 -->
        <property-binding-visualizer v-if="showPropertyVisualizer" />
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 🚀 属性系统优化演示组件
 * 展示所有新优化功能的使用方法
 */

import { ref } from 'vue'
import { NCard, NSpace, NSwitch, NButton, NTimeline, NTimelineItem } from 'naive-ui'

// 导入优化后的核心功能
import { propertyExposureRegistry, enhancedAutoRegister } from '@/card2.1/core/property-exposure'
import { PropertyPath } from '@/card2.1/core/property-path-manager'
import { ConfigMerge } from '@/card2.1/core/config-merge-manager'
import { performanceOptimizer } from '@/card2.1/core/performance-optimizer'

// 导入新组件
import PerformanceMonitor from '@/card2.1/components/dashboard/performance-monitor/PerformanceMonitor.vue'
import PropertyBindingVisualizer from '@/card2.1/components/dashboard/property-binding-visualizer/PropertyBindingVisualizer.vue'

// 响应式状态
const showPerformanceMonitor = ref(true)
const showPropertyVisualizer = ref(true)
const demoResults = ref<
  Array<{
    id: number
    type: 'success' | 'info' | 'warning' | 'error'
    title: string
    content: string
    time: string
  }>
>([])

let resultId = 1

/**
 * 添加演示结果
 */
const addDemoResult = (type: 'success' | 'info' | 'warning' | 'error', title: string, content: string) => {
  demoResults.value.unshift({
    id: resultId++,
    type,
    title,
    content,
    time: new Date().toLocaleTimeString()
  })

  // 限制结果数量
  if (demoResults.value.length > 10) {
    demoResults.value = demoResults.value.slice(0, 10)
  }
}

/**
 * 演示自动属性注册
 */
const demonstrateAutoRegistration = () => {
  console.log('🎯 开始演示自动属性注册...')

  // 模拟组件定义
  const mockComponentDefinition = {
    type: 'demo-widget',
    name: '演示组件',
    config: {
      title: '默认标题',
      themeColor: '#1890ff',
      fontSize: 14,
      isVisible: true,
      data: {
        value: 100,
        unit: 'px'
      }
    }
  }

  // 模拟设置配置
  const mockSettingConfig = {
    componentType: 'demo-widget',
    settings: [
      {
        field: 'customSetting',
        label: '自定义设置',
        type: 'input',
        defaultValue: 'test'
      }
    ]
  }

  try {
    // 使用增强的自动注册
    enhancedAutoRegister(mockComponentDefinition.type, mockComponentDefinition, mockSettingConfig)

    // 获取注册结果
    const exposure = propertyExposureRegistry.getComponentExposure('demo-widget')
    const propertiesCount = exposure?.listenableProperties.length || 0

    addDemoResult('success', '自动属性注册成功', `成功注册了 ${propertiesCount} 个属性，包括自动检测和手动配置的属性`)

    console.log('✅ 自动属性注册演示完成', {
      componentType: mockComponentDefinition.type,
      propertiesCount,
      properties: exposure?.listenableProperties.map(p => p.name)
    })
  } catch (error) {
    addDemoResult('error', '自动属性注册失败', String(error))
    console.error('❌ 自动属性注册演示失败:', error)
  }
}

/**
 * 演示路径解析优化
 */
const demonstratePathParsing = () => {
  console.log('🎯 开始演示路径解析优化...')

  const testPaths = [
    'component-123.title',
    'widget-456.data.value',
    'panel-789.customize.themeColor',
    'invalid-path',
    'comp.nested.deep.property'
  ]

  let successCount = 0
  let cacheHits = 0

  try {
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

    addDemoResult(
      'info',
      '路径解析优化演示',
      `解析了 ${testPaths.length} 个路径，成功 ${successCount} 个，缓存命中 ${cacheHits} 次，耗时 ${parseTime.toFixed(2)}ms`
    )

    console.log('✅ 路径解析优化演示完成', {
      totalPaths: testPaths.length,
      successCount,
      cacheHits,
      parseTime: parseTime.toFixed(2) + 'ms'
    })
  } catch (error) {
    addDemoResult('error', '路径解析演示失败', String(error))
    console.error('❌ 路径解析演示失败:', error)
  }
}

/**
 * 演示配置合并策略
 */
const demonstrateConfigMerging = () => {
  console.log('🎯 开始演示配置合并策略...')

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

    addDemoResult(
      'success',
      '配置合并策略演示',
      `合并了 ${Object.keys(configSources).length} 个配置源，` +
        `变更字段 ${mergeResult.stats?.changedFields || 0} 个，` +
        `耗时 ${mergeTime.toFixed(2)}ms`
    )

    console.log('✅ 配置合并策略演示完成', {
      sources: Object.keys(configSources),
      mergedConfig: mergeResult.merged,
      stats: mergeResult.stats,
      changes: mergeResult.changes?.length || 0,
      sourceMap: mergeResult.sourceMap
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
    addDemoResult('error', '配置合并演示失败', String(error))
    console.error('❌ 配置合并演示失败:', error)
  }
}

/**
 * 清理性能数据
 */
const clearPerformanceData = () => {
  performanceOptimizer.clearPerformanceData()
  addDemoResult('warning', '性能数据已清理', '所有缓存和性能指标已重置')
}

// 初始化演示
addDemoResult('info', '优化系统演示已启动', '点击上方按钮开始体验各项优化功能')
</script>

<style scoped>
.optimization-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
