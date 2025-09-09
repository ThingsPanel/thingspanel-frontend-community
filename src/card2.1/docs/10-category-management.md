# 分类管理系统 - 组件分类与文件夹映射

Card 2.1的分类管理系统确保组件能够正确分类显示在Visual Editor的组件库中。本章详细介绍分类规则和管理方法。

## 🎯 系统概述

### 分类映射机制
```
文件夹结构 → 分类映射配置 → 组件库显示分类 → 用户界面展示
```

### 分类层级
- **主分类**：对应文件夹名称（如 `test`、`dashboard`、`device`）
- **显示分类**：用户界面显示的中文名称（如 `测试`、`仪表盘`、`设备`）
- **子分类**：可选的二级分类（如 `数据展示`、`状态监控`）

## 📂 文件夹结构规范

### 标准文件夹结构
```
src/card2.1/components/
├── dashboard/          # 仪表盘类组件
│   ├── overview/
│   ├── metrics/
│   └── kpi-card/
├── device/             # 设备类组件
│   ├── status/
│   ├── control/
│   └── location/
├── data/               # 数据类组件
│   ├── chart/
│   ├── table/
│   └── statistics/
├── alarm/              # 告警类组件
│   ├── notification/
│   ├── history/
│   └── rules/
├── control/            # 控制类组件
│   ├── switch/
│   ├── slider/
│   └── button/
├── info/               # 信息类组件
│   ├── text/
│   ├── image/
│   └── weather/
├── statistics/         # 统计类组件
│   ├── counter/
│   ├── progress/
│   └── gauge/
├── location/           # 位置类组件
│   ├── map/
│   ├── gps/
│   └── track/
├── media/              # 音视频类组件
│   ├── video/
│   ├── audio/
│   └── stream/
└── test/               # 测试类组件（开发用）
    ├── simple-display/
    ├── dual-data-display/
    └── triple-data-display/
```

## 🗂️ 分类映射配置

### category-mapping.ts 文件

```typescript
/**
 * 组件分类映射配置
 * 定义文件夹名称与显示分类的对应关系
 */

export interface CategoryMapping {
  folderName: string       // 文件夹名称（英文）
  displayName: string      // 显示名称（中文）
  icon?: string           // 分类图标（可选）
  order?: number          // 显示顺序
  description?: string    // 分类描述
}

/**
 * 主分类映射表
 */
export const MAIN_CATEGORY_MAPPING: CategoryMapping[] = [
  {
    folderName: 'dashboard',
    displayName: '仪表盘',
    icon: 'i-mdi:view-dashboard',
    order: 1,
    description: '仪表盘和概览类组件'
  },
  {
    folderName: 'info',
    displayName: '信息',
    icon: 'i-mdi:information',
    order: 2,
    description: '信息展示和内容显示组件'
  },
  {
    folderName: 'control',
    displayName: '控制',
    icon: 'i-mdi:console',
    order: 3,
    description: '设备控制和操作组件'
  },
  {
    folderName: 'device',
    displayName: '设备',
    icon: 'i-mdi:devices',
    order: 4,
    description: '设备管理和状态监控组件'
  },
  {
    folderName: 'data',
    displayName: '数据',
    icon: 'i-mdi:database',
    order: 5,
    description: '数据展示和分析组件'
  },
  {
    folderName: 'statistics',
    displayName: '统计',
    icon: 'i-mdi:chart-bar',
    order: 6,
    description: '统计分析和指标展示组件'
  },
  {
    folderName: 'location',
    displayName: '位置',
    icon: 'i-mdi:map-marker',
    order: 7,
    description: '地理位置和地图相关组件'
  },
  {
    folderName: 'media',
    displayName: '音视频',
    icon: 'i-mdi:play-circle',
    order: 8,
    description: '多媒体播放和流媒体组件'
  },
  {
    folderName: 'alarm',
    displayName: '告警',
    icon: 'i-mdi:alert',
    order: 9,
    description: '告警通知和报警管理组件'
  },
  {
    folderName: 'test',
    displayName: '测试',
    icon: 'i-mdi:test-tube',
    order: 99,
    description: '开发测试和演示组件（仅开发环境显示）'
  }
]

/**
 * 根据文件夹名称获取显示分类
 */
export function getFolderDisplayName(folderName: string): string {
  const mapping = MAIN_CATEGORY_MAPPING.find(item => item.folderName === folderName)
  return mapping?.displayName || folderName
}

/**
 * 根据显示分类获取文件夹名称
 */
export function getDisplayNameFolder(displayName: string): string {
  const mapping = MAIN_CATEGORY_MAPPING.find(item => item.displayName === displayName)
  return mapping?.folderName || displayName
}

/**
 * 获取分类图标
 */
export function getCategoryIcon(folderName: string): string {
  const mapping = MAIN_CATEGORY_MAPPING.find(item => item.folderName === folderName)
  return mapping?.icon || 'i-mdi:folder'
}

/**
 * 获取所有分类列表（按顺序排序）
 */
export function getAllCategories(): CategoryMapping[] {
  return MAIN_CATEGORY_MAPPING
    .filter(item => {
      // 在生产环境下过滤掉测试分类
      if (import.meta.env.PROD && item.folderName === 'test') {
        return false
      }
      return true
    })
    .sort((a, b) => (a.order || 99) - (b.order || 99))
}
```

### 子分类配置

```typescript
/**
 * 子分类配置接口
 */
export interface SubCategoryMapping {
  parentFolder: string    // 父文件夹名称
  subCategories: {
    name: string         // 子分类名称
    description: string  // 子分类描述
    components: string[] // 包含的组件类型
  }[]
}

/**
 * 子分类映射配置
 */
export const SUB_CATEGORY_MAPPING: SubCategoryMapping[] = [
  {
    parentFolder: 'data',
    subCategories: [
      {
        name: '图表显示',
        description: '各类数据图表和可视化组件',
        components: ['line-chart', 'bar-chart', 'pie-chart', 'gauge-chart']
      },
      {
        name: '表格列表',
        description: '数据表格和列表展示组件',
        components: ['data-table', 'list-view', 'tree-table']
      },
      {
        name: '数据指标',
        description: '关键指标和KPI展示组件',
        components: ['metric-card', 'kpi-panel', 'indicator']
      }
    ]
  },
  {
    parentFolder: 'device',
    subCategories: [
      {
        name: '状态监控',
        description: '设备状态和运行监控组件',
        components: ['device-status', 'connection-monitor', 'health-check']
      },
      {
        name: '设备控制',
        description: '设备操作和控制组件',
        components: ['device-switch', 'device-slider', 'device-button']
      },
      {
        name: '设备信息',
        description: '设备基本信息展示组件',
        components: ['device-info', 'device-list', 'device-tree']
      }
    ]
  }
]
```

## 🔄 自动分类检测

### 自动分类检测逻辑

```typescript
/**
 * 自动分类检测器
 */
export class AutoCategoryDetector {
  /**
   * 从组件路径自动检测分类
   */
  static detectCategoryFromPath(componentPath: string): {
    mainCategory: string
    subCategory?: string
    displayCategory: string
  } {
    // 提取路径中的文件夹信息
    const pathParts = componentPath.split('/')
    const componentsIndex = pathParts.indexOf('components')
    
    if (componentsIndex === -1) {
      throw new Error(`Invalid component path: ${componentPath}`)
    }
    
    // 主分类文件夹
    const mainCategoryFolder = pathParts[componentsIndex + 1]
    if (!mainCategoryFolder) {
      throw new Error(`Cannot detect main category from path: ${componentPath}`)
    }
    
    // 检查是否为有效的主分类
    const categoryMapping = MAIN_CATEGORY_MAPPING.find(
      item => item.folderName === mainCategoryFolder
    )
    
    if (!categoryMapping) {
      console.warn(`Unknown main category folder: ${mainCategoryFolder}`)
    }
    
    return {
      mainCategory: mainCategoryFolder,
      displayCategory: categoryMapping?.displayName || mainCategoryFolder
    }
  }
  
  /**
   * 从组件定义自动检测子分类
   */
  static detectSubCategoryFromDefinition(
    definition: any,
    mainCategory: string
  ): string | undefined {
    // 如果定义中明确指定了子分类
    if (definition.subCategory) {
      return definition.subCategory
    }
    
    // 根据组件特性自动推断子分类
    const features = definition.features || {}
    const componentType = definition.type || ''
    
    // 基于组件类型推断
    if (componentType.includes('chart')) {
      return '图表显示'
    } else if (componentType.includes('table') || componentType.includes('list')) {
      return '表格列表'
    } else if (componentType.includes('status') || componentType.includes('monitor')) {
      return '状态监控'
    } else if (componentType.includes('control') || componentType.includes('switch')) {
      return '设备控制'
    }
    
    // 基于功能特性推断
    if (features.realtime) {
      return '实时监控'
    } else if (features.dataBinding) {
      return '数据展示'
    } else if (features.interactive) {
      return '交互控制'
    }
    
    return undefined
  }
  
  /**
   * 验证分类配置
   */
  static validateCategoryConfig(
    mainCategory: string,
    subCategory?: string
  ): boolean {
    // 检查主分类
    const mainCategoryExists = MAIN_CATEGORY_MAPPING.some(
      item => item.folderName === mainCategory
    )
    
    if (!mainCategoryExists) {
      console.error(`Invalid main category: ${mainCategory}`)
      return false
    }
    
    // 检查子分类（如果提供）
    if (subCategory) {
      const parentMapping = SUB_CATEGORY_MAPPING.find(
        item => item.parentFolder === mainCategory
      )
      
      if (parentMapping) {
        const subCategoryExists = parentMapping.subCategories.some(
          sub => sub.name === subCategory
        )
        
        if (!subCategoryExists) {
          console.warn(`Invalid sub category "${subCategory}" for main category "${mainCategory}"`)
          return false
        }
      }
    }
    
    return true
  }
}
```

## 🏗️ 组件分类集成

### 在组件定义中指定分类

```typescript
// definition.ts
export const myComponentDefinition = {
  type: 'device-status-monitor',
  name: '设备状态监控',
  
  // ============ 分类配置 ============
  // 主分类（必须与文件夹名称匹配）
  mainCategory: 'device',
  
  // 子分类（可选，用于进一步细分）
  subCategory: '状态监控',
  
  // 显示分类（可选，用于自定义显示）
  category: '设备管理',
  
  // 其他配置...
}
```

### 分类验证Hook

```typescript
/**
 * 分类验证Hook
 */
export function useCategoryValidation() {
  const validateComponentCategory = (
    definition: any,
    filePath: string
  ): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } => {
    const errors: string[] = []
    const warnings: string[] = []
    
    try {
      // 从文件路径检测分类
      const detectedCategory = AutoCategoryDetector.detectCategoryFromPath(filePath)
      
      // 检查定义中的分类是否与文件路径匹配
      if (definition.mainCategory && definition.mainCategory !== detectedCategory.mainCategory) {
        errors.push(
          `主分类不匹配：定义中为 "${definition.mainCategory}"，但文件路径显示为 "${detectedCategory.mainCategory}"`
        )
      }
      
      // 验证分类配置
      const categoryValid = AutoCategoryDetector.validateCategoryConfig(
        definition.mainCategory || detectedCategory.mainCategory,
        definition.subCategory
      )
      
      if (!categoryValid) {
        errors.push('分类配置验证失败')
      }
      
      // 检查是否缺少主分类
      if (!definition.mainCategory) {
        warnings.push(
          `建议在组件定义中明确指定 mainCategory: "${detectedCategory.mainCategory}"`
        )
      }
      
    } catch (error) {
      errors.push(`分类检测失败: ${error.message}`)
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  return {
    validateComponentCategory
  }
}
```

## 📊 分类管理界面

### 分类选择器组件

```vue
<template>
  <div class="category-selector">
    <n-form-item label="主分类">
      <n-select
        v-model:value="selectedMainCategory"
        :options="mainCategoryOptions"
        placeholder="选择主分类"
        @update:value="handleMainCategoryChange"
      />
    </n-form-item>
    
    <n-form-item label="子分类" v-if="subCategoryOptions.length > 0">
      <n-select
        v-model:value="selectedSubCategory"
        :options="subCategoryOptions"
        placeholder="选择子分类（可选）"
        clearable
      />
    </n-form-item>
    
    <div class="category-preview" v-if="selectedMainCategory">
      <n-alert type="info" :show-icon="false">
        <template #header>
          <n-icon :component="categoryIcon" />
          {{ displayCategoryName }}
        </template>
        {{ categoryDescription }}
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  MAIN_CATEGORY_MAPPING, 
  SUB_CATEGORY_MAPPING,
  getFolderDisplayName,
  getCategoryIcon 
} from '../category-mapping'

interface Props {
  modelValue?: {
    mainCategory: string
    subCategory?: string
  }
}

interface Emits {
  (e: 'update:modelValue', value: { mainCategory: string; subCategory?: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedMainCategory = ref(props.modelValue?.mainCategory || '')
const selectedSubCategory = ref(props.modelValue?.subCategory || '')

// 主分类选项
const mainCategoryOptions = computed(() => {
  return MAIN_CATEGORY_MAPPING.map(item => ({
    label: item.displayName,
    value: item.folderName,
    disabled: false
  }))
})

// 子分类选项
const subCategoryOptions = computed(() => {
  if (!selectedMainCategory.value) return []
  
  const parentMapping = SUB_CATEGORY_MAPPING.find(
    item => item.parentFolder === selectedMainCategory.value
  )
  
  return parentMapping?.subCategories.map(sub => ({
    label: sub.name,
    value: sub.name,
    disabled: false
  })) || []
})

// 显示分类名称
const displayCategoryName = computed(() => {
  if (!selectedMainCategory.value) return ''
  
  const mainName = getFolderDisplayName(selectedMainCategory.value)
  if (selectedSubCategory.value) {
    return `${mainName} / ${selectedSubCategory.value}`
  }
  return mainName
})

// 分类图标
const categoryIcon = computed(() => {
  return getCategoryIcon(selectedMainCategory.value)
})

// 分类描述
const categoryDescription = computed(() => {
  const mapping = MAIN_CATEGORY_MAPPING.find(
    item => item.folderName === selectedMainCategory.value
  )
  return mapping?.description || ''
})

// 主分类变化处理
const handleMainCategoryChange = () => {
  // 清除子分类选择
  selectedSubCategory.value = ''
  updateModelValue()
}

// 更新模型值
const updateModelValue = () => {
  emit('update:modelValue', {
    mainCategory: selectedMainCategory.value,
    subCategory: selectedSubCategory.value || undefined
  })
}

// 监听子分类变化
watch(selectedSubCategory, updateModelValue)

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedMainCategory.value = newValue.mainCategory || ''
    selectedSubCategory.value = newValue.subCategory || ''
  }
}, { immediate: true })
</script>

<style scoped>
.category-selector {
  space-y: 16px;
}

.category-preview {
  margin-top: 12px;
}

.category-preview .n-alert {
  --n-icon-color: var(--primary-color);
}
</style>
```

## 🔍 分类调试工具

### 分类配置检查器

```typescript
/**
 * 分类配置检查器
 */
export class CategoryConfigChecker {
  /**
   * 检查所有组件的分类配置
   */
  static async checkAllComponentCategories(): Promise<{
    validComponents: string[]
    invalidComponents: Array<{
      path: string
      errors: string[]
      warnings: string[]
    }>
  }> {
    const validComponents: string[] = []
    const invalidComponents: Array<{
      path: string
      errors: string[]
      warnings: string[]
    }> = []
    
    // 获取所有组件文件
    const componentFiles = import.meta.glob('/src/card2.1/components/*/*/definition.ts')
    
    for (const [path, moduleLoader] of Object.entries(componentFiles)) {
      try {
        const module = await moduleLoader()
        const definition = (module as any).default
        
        if (definition) {
          const validation = this.validateSingleComponent(definition, path)
          
          if (validation.isValid) {
            validComponents.push(path)
          } else {
            invalidComponents.push({
              path,
              errors: validation.errors,
              warnings: validation.warnings
            })
          }
        }
      } catch (error) {
        invalidComponents.push({
          path,
          errors: [`加载组件失败: ${error.message}`],
          warnings: []
        })
      }
    }
    
    return { validComponents, invalidComponents }
  }
  
  /**
   * 验证单个组件
   */
  static validateSingleComponent(definition: any, filePath: string): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const { validateComponentCategory } = useCategoryValidation()
    return validateComponentCategory(definition, filePath)
  }
  
  /**
   * 生成分类配置报告
   */
  static async generateCategoryReport(): Promise<string> {
    const { validComponents, invalidComponents } = await this.checkAllComponentCategories()
    
    let report = `# Card2.1 组件分类配置报告\n\n`
    report += `生成时间: ${new Date().toLocaleString()}\n\n`
    
    report += `## 📊 统计信息\n\n`
    report += `- 有效组件: ${validComponents.length}\n`
    report += `- 问题组件: ${invalidComponents.length}\n`
    report += `- 总计组件: ${validComponents.length + invalidComponents.length}\n\n`
    
    if (invalidComponents.length > 0) {
      report += `## ❌ 问题组件列表\n\n`
      
      invalidComponents.forEach(component => {
        report += `### ${component.path}\n\n`
        
        if (component.errors.length > 0) {
          report += `**错误:**\n`
          component.errors.forEach(error => {
            report += `- ${error}\n`
          })
        }
        
        if (component.warnings.length > 0) {
          report += `**警告:**\n`
          component.warnings.forEach(warning => {
            report += `- ${warning}\n`
          })
        }
        
        report += `\n`
      })
    }
    
    report += `## ✅ 有效组件列表\n\n`
    validComponents.forEach(component => {
      report += `- ${component}\n`
    })
    
    return report
  }
}
```

## ✅ 分类系统最佳实践

### 1. 文件夹组织原则
- **语义化命名**：文件夹名称应清晰表达组件用途
- **层级合理**：避免过深的文件夹嵌套
- **分类明确**：每个组件只属于一个主分类
- **扩展性**：预留未来新分类的空间

### 2. 分类配置管理
- **配置集中**：所有分类配置统一管理
- **映射明确**：文件夹与显示名称一一对应
- **国际化支持**：支持多语言分类名称
- **版本控制**：分类变更要有版本记录

### 3. 组件开发规范
- **分类声明**：在定义中明确声明分类信息
- **路径匹配**：确保文件路径与分类配置匹配
- **验证检查**：开发时运行分类配置检查
- **文档更新**：新增分类时同步更新文档

## 🚨 常见问题解决

### 问题1: 组件显示在错误分类中
**可能原因**: 文件夹名称与分类映射不匹配
**解决方法**: 检查文件路径和category-mapping.ts配置

### 问题2: 新分类不显示
**可能原因**: 分类映射配置未更新
**解决方法**: 在MAIN_CATEGORY_MAPPING中添加新分类配置

### 问题3: 子分类显示异常
**可能原因**: 子分类配置错误或缺失
**解决方法**: 检查SUB_CATEGORY_MAPPING配置

### 问题4: 分类图标不显示
**可能原因**: 图标名称错误或图标库未正确加载
**解决方法**: 验证图标名称和图标库配置

## 🔗 相关文档

- [自动注册系统](./09-auto-registry.md)
- [组件定义详解](./04-component-definition.md)
- [调试工具](./15-debugging-tools.md)
- [API参考](./18-api-reference.md)

---

**合理的分类管理让组件库井然有序！** 📁