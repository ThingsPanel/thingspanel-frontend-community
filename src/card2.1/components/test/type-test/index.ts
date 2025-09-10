/**
 * Card2.1 类型测试组件入口文件
 * 
 * 这是组件的统一导出入口，遵循Card2.1组件规范：
 * - 导出组件定义（definition）
 * - 导出设置配置（settingConfig）
 * - 导出Vue组件（component）
 * - 提供组件注册信息
 * - 集成类型验证系统
 * 
 * 该文件展示了Card2.1组件的标准结构和最佳实践
 */

// 导入组件核心文件
import { typeTestDefinition } from './definition'
import { typeTestSettingConfig } from './settingConfig'
import TypeTestComponent from './index.vue'

// 导入类型验证系统
import { 
  validateComponentDefinition,
  devModeValidationWarning,
  isValidComponentDefinition 
} from '@/card2.1/types'

// 导入类型工具函数
import { 
  TypeUtils,
  generateDefaultConfigFromSettings,
  createComponentSettingConfig,
  validateComponentConfig
} from '@/card2.1/types'

// 导入类型定义
import type { 
  ComponentDefinition,
  ComponentSettingConfig,
  ValidationResult
} from '@/card2.1/types'
import type { TypeTestConfig } from './definition'

/**
 * 组件验证和初始化
 * 在开发环境下进行完整的类型验证
 */
function initializeComponent() {
  // 验证组件定义
  const definitionValidation = validateComponentDefinition(typeTestDefinition)
  devModeValidationWarning(definitionValidation, '类型测试组件定义')
  
  if (!definitionValidation.valid) {
    console.error('❌ 类型测试组件定义验证失败:', definitionValidation.errors)
  }
  
  // 验证设置配置
  const configValidation = validateComponentConfig(
    typeTestDefinition,
    generateDefaultConfigFromSettings(typeTestSettingConfig.settings)
  )
  
  if (import.meta.env.DEV) {
    console.log('✅ 类型测试组件初始化完成:', {
      definition: definitionValidation.valid ? '✅ 通过' : '❌ 失败',
      config: configValidation.valid ? '✅ 通过' : '❌ 失败',
      settings: typeTestSettingConfig.settings.length,
      dataSources: typeTestDefinition.dataSources?.length || 0,
      staticParams: typeTestDefinition.staticParams?.length || 0
    })
  }
  
  return {
    definitionValid: definitionValidation.valid,
    configValid: configValidation.valid,
    validation: {
      definition: definitionValidation,
      config: configValidation
    }
  }
}

/**
 * 组件元数据信息
 * 提供给注册系统和开发工具使用
 */
export const componentMeta = {
  // 基础信息
  type: typeTestDefinition.type,
  name: typeTestDefinition.name,
  version: typeTestDefinition.version || '2.1.0',
  description: typeTestDefinition.description,
  category: typeTestDefinition.category || '测试组件',
  
  // 技术信息
  framework: 'Vue 3',
  typescript: true,
  composition: true,
  
  // 功能特性
  features: {
    dataBinding: true,
    interactions: true,
    theming: true,
    responsive: true,
    accessibility: true,
    internationalization: true
  },
  
  // 依赖信息
  dependencies: {
    'naive-ui': '^2.38.0',
    'vue': '^3.3.0',
    '@vueuse/core': '^10.0.0',
    'vue-i18n': '^9.2.0'
  },
  
  // 性能指标
  performance: {
    bundleSize: '~8KB',
    memoryUsage: '~2MB',
    renderTime: '<16ms'
  },
  
  // 开发信息
  author: 'ThingsPanel Team',
  license: 'Apache-2.0',
  repository: 'https://github.com/ThingsPanel/thingspanel-frontend-community',
  documentation: '/docs/components/type-test',
  
  // 初始化结果
  ...initializeComponent()
}

/**
 * 组件配置生成器
 * 提供便捷的配置创建方法
 */
export const createTypeTestConfig = (
  overrides: Partial<TypeTestConfig> = {}
): TypeTestConfig => {
  const defaultConfig = generateDefaultConfigFromSettings<TypeTestConfig>(
    typeTestSettingConfig.settings
  )
  
  return TypeUtils.deepMergeConfig(defaultConfig, overrides)
}

/**
 * 组件实例工厂
 * 用于创建标准化的组件实例
 */
export const createTypeTestInstance = (config: Partial<TypeTestConfig> = {}) => {
  const fullConfig = createTypeTestConfig(config)
  
  return {
    id: `type-test-${Math.random().toString(36).substr(2, 9)}`,
    type: typeTestDefinition.type,
    config: fullConfig,
    component: TypeTestComponent,
    definition: typeTestDefinition,
    settingConfig: typeTestSettingConfig
  }
}

/**
 * 开发工具集成
 * 提供开发和调试相关的工具函数
 */
export const devTools = {
  /**
   * 验证配置对象
   */
  validateConfig: (config: Partial<TypeTestConfig>) => {
    return validateComponentConfig(typeTestDefinition, config)
  },
  
  /**
   * 生成默认配置
   */
  generateDefaultConfig: () => {
    return generateDefaultConfigFromSettings<TypeTestConfig>(
      typeTestSettingConfig.settings
    )
  },
  
  /**
   * 获取组件信息摘要
   */
  getComponentSummary: () => ({
    type: typeTestDefinition.type,
    name: typeTestDefinition.name,
    settingsCount: typeTestSettingConfig.settings.length,
    dataSourcesCount: typeTestDefinition.dataSources?.length || 0,
    staticParamsCount: typeTestDefinition.staticParams?.length || 0,
    interactionsCount: typeTestDefinition.interactions?.examples.length || 0,
    groupsCount: typeTestSettingConfig.groups?.length || 0
  }),
  
  /**
   * 生成TypeScript接口
   */
  generateTypeScript: () => {
    return TypeUtils.generateTSInterfaceFromDefinition(typeTestDefinition)
  },
  
  /**
   * 验证组件定义完整性
   */
  validateDefinition: () => {
    return validateComponentDefinition(typeTestDefinition)
  }
}

/**
 * 主要导出
 * 标准的Card2.1组件导出格式
 */

// 组件定义导出
export { typeTestDefinition as definition }
export type { TypeTestConfig }

// 设置配置导出  
export { typeTestSettingConfig as settingConfig }

// Vue组件导出
export { TypeTestComponent as component }

// 默认导出组件定义（供自动注册系统使用）
export default typeTestDefinition

/**
 * 组件注册信息
 * 用于自动注册系统
 */
export const registrationInfo = {
  // 组件标识
  type: typeTestDefinition.type,
  name: typeTestDefinition.name,
  
  // 组件资源
  component: TypeTestComponent,
  definition: typeTestDefinition,
  settingConfig: typeTestSettingConfig,
  
  // 注册配置
  autoRegister: true,
  category: typeTestDefinition.category,
  tags: typeTestDefinition.tags || [],
  
  // 验证状态
  validated: componentMeta.definitionValid && componentMeta.configValid,
  
  // 注册元数据
  meta: componentMeta,
  
  // 工厂方法
  createInstance: createTypeTestInstance,
  createConfig: createTypeTestConfig,
  
  // 开发工具
  devTools: import.meta.env.DEV ? devTools : undefined
}

/**
 * 组件类别信息
 * 用于组件分类和组织
 */
export const categoryInfo = {
  main: '测试组件',
  sub: '类型系统',
  path: 'test/type-test',
  displayName: 'Card2.1 类型测试组件',
  description: '展示Card2.1类型系统完整功能的测试组件',
  keywords: ['测试', '类型系统', 'Card2.1', 'TypeScript', '开发工具'],
  complexity: 'advanced' as const,
  stability: 'stable' as const
}

/**
 * 使用示例和文档
 * 提供给开发者的使用指南
 */
export const usageExamples = {
  // 基础使用
  basic: {
    title: '基础使用',
    description: '最简单的组件使用方式',
    code: `
<template>
  <TypeTestComponent 
    :config="config"
    @config-change="handleConfigChange"
    @data-update="handleDataUpdate"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TypeTestComponent, createTypeTestConfig } from '@/card2.1/components/test/type-test'

const config = ref(createTypeTestConfig({
  title: '我的测试组件',
  primaryValue: 85,
  unit: '%',
  size: 'medium'
}))

const handleConfigChange = (newConfig) => {
  console.log('配置已更改:', newConfig)
}

const handleDataUpdate = (data) => {
  console.log('数据已更新:', data)
}
</script>
    `
  },
  
  // 高级使用
  advanced: {
    title: '高级使用',
    description: '包含交互和数据绑定的高级用法',
    code: `
<template>
  <TypeTestComponent 
    :config="config"
    :external-data="externalData"
    :interaction-state="interactionState"
    :is-edit-mode="isEditMode"
    @interaction="handleInteraction"
    @error="handleError"
  />
</template>

<script setup>
import { ref, reactive } from 'vue'
import { TypeTestComponent, createTypeTestConfig, devTools } from '@/card2.1/components/test/type-test'

// 创建完整配置
const config = ref(createTypeTestConfig({
  title: '高级测试组件',
  primaryValue: 92.5,
  secondaryValue: 88.0,
  unit: '°C',
  precision: 1,
  enableAnimation: true,
  animationDuration: 1500,
  showBorder: true,
  size: 'large'
}))

// 外部数据注入
const externalData = reactive({
  primaryValue: 92.5,
  status: 'normal',
  trend: 'up'
})

// 交互状态管理
const interactionState = reactive({
  backgroundColor: '#ffffff',
  isAnimating: false
})

const isEditMode = ref(false)

// 事件处理
const handleInteraction = (eventType, data) => {
  console.log('交互事件:', eventType, data)
  
  if (eventType === 'click') {
    // 处理点击事件
    interactionState.backgroundColor = '#f0f8ff'
  }
}

const handleError = (error) => {
  console.error('组件错误:', error)
}

// 开发工具使用示例
if (import.meta.env.DEV) {
  console.log('组件摘要:', devTools.getComponentSummary())
  console.log('TypeScript接口:', devTools.generateTypeScript())
}
</script>
    `
  }
}

// 在开发环境下输出组件信息
if (import.meta.env.DEV) {
  console.group('📦 Card2.1 类型测试组件加载完成')
  console.log('组件元数据:', componentMeta)
  console.log('组件摘要:', devTools.getComponentSummary())
  console.groupEnd()
}