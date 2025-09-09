# 自动注册系统 - 组件发现与注册机制

Card 2.1的自动注册系统负责扫描、发现和注册组件，让开发者无需手动维护组件列表。

## 🎯 系统概述

### 工作原理
```
文件扫描 → 动态导入 → 定义解析 → 分类处理 → 组件注册 → 系统可用
```

### 核心文件
- **auto-registry.ts**: 自动注册核心逻辑
- **component-registry.ts**: 组件注册表管理
- **category-mapping.ts**: 分类映射配置

## 📁 文件结构约定

### 标准目录结构
```
src/card2.1/components/
├── 分类名1/
│   ├── 组件A/
│   │   ├── index.vue          # Vue组件实现
│   │   ├── setting.vue        # 配置面板
│   │   ├── settingConfig.ts   # 配置定义
│   │   ├── definition.ts      # 组件定义
│   │   └── index.ts          # 导出文件
│   └── 组件B/
└── 分类名2/
    └── 组件C/
```

### 文件命名规范

| 文件 | 命名规则 | 说明 |
|------|----------|------|
| 分类文件夹 | kebab-case | 如：`data-display`、`user-input` |
| 组件文件夹 | kebab-case | 如：`temperature-card`、`status-monitor` |
| Vue文件 | index.vue, setting.vue | 固定命名 |
| TS文件 | camelCase.ts | 如：settingConfig.ts, definition.ts |

## 🔧 自动扫描机制

### 1. 文件扫描逻辑

```typescript
// auto-registry.ts 核心扫描代码
const scanComponents = async () => {
  // 使用 Vite 的 import.meta.glob 扫描组件
  const componentModules = import.meta.glob(
    '/src/card2.1/components/**/definition.ts',
    { eager: false }
  )

  const componentPromises = Object.entries(componentModules).map(
    async ([path, importFn]) => {
      try {
        // 解析文件路径
        const pathSegments = path.split('/')
        const componentName = pathSegments[pathSegments.length - 2]
        const categoryName = pathSegments[pathSegments.length - 3]

        // 动态导入组件定义
        const module = await importFn()
        const definition = module.default

        if (!definition || !definition.type) {
          console.warn(`组件定义无效: ${path}`)
          return null
        }

        // 增强定义信息
        return enhanceComponentDefinition(definition, categoryName, path)
      } catch (error) {
        console.error(`加载组件失败: ${path}`, error)
        return null
      }
    }
  )

  const components = (await Promise.all(componentPromises))
    .filter(Boolean)

  return components
}
```

### 2. 路径解析和分类

```typescript
// 路径解析函数
const parseComponentPath = (filePath: string) => {
  // 解析路径: /src/card2.1/components/test/simple-display/definition.ts
  const pathParts = filePath.split('/')
  const definitionIndex = pathParts.indexOf('definition.ts')
  
  return {
    componentName: pathParts[definitionIndex - 1],  // simple-display
    categoryFolder: pathParts[definitionIndex - 2], // test
    fullPath: filePath
  }
}

// 分类名称映射
const getCategoryDisplayName = (folderName: string): string => {
  const categoryMapping = {
    'test': '测试',
    'data-display': '数据展示', 
    'user-input': '用户输入',
    'charts': '图表',
    'layout': '布局',
    'media': '媒体',
    'system': '系统'
  }
  
  return categoryMapping[folderName] || folderName
}
```

## 🏷️ 分类系统详解

### 1. 分类映射配置

```typescript
// category-mapping.ts
export const FOLDER_CATEGORY_MAPPING = {
  // 数据相关
  'data-display': {
    displayName: '数据展示',
    description: '用于展示各种数据的组件',
    icon: 'data-display-icon',
    order: 1
  },
  'charts': {
    displayName: '图表',
    description: '各种图表和可视化组件',
    icon: 'chart-icon',
    order: 2
  },
  
  // 交互相关
  'user-input': {
    displayName: '用户输入',
    description: '表单和输入控件组件',
    icon: 'input-icon',
    order: 3
  },
  'controls': {
    displayName: '控制器',
    description: '设备控制和操作组件',
    icon: 'control-icon',
    order: 4
  },
  
  // 布局相关
  'layout': {
    displayName: '布局',
    description: '页面布局和容器组件',
    icon: 'layout-icon',
    order: 5
  },
  'containers': {
    displayName: '容器',
    description: '内容容器和面板组件',
    icon: 'container-icon',
    order: 6
  },
  
  // 媒体相关
  'media': {
    displayName: '媒体',
    description: '图片、视频等媒体组件',
    icon: 'media-icon',
    order: 7
  },
  
  // 系统相关
  'system': {
    displayName: '系统',
    description: '系统级功能组件',
    icon: 'system-icon',
    order: 8
  },
  'test': {
    displayName: '测试',
    description: '测试和演示组件',
    icon: 'test-icon',
    order: 99
  }
}

export const getCategoryDisplayName = (folderName: string): string => {
  return FOLDER_CATEGORY_MAPPING[folderName]?.displayName || folderName
}

export const getCategoryInfo = (folderName: string) => {
  return FOLDER_CATEGORY_MAPPING[folderName] || {
    displayName: folderName,
    description: `${folderName}分类组件`,
    icon: 'default-icon',
    order: 50
  }
}
```

### 2. 分类覆盖机制

```typescript
// 在扫描时应用分类覆盖
const enhanceComponentDefinition = (
  definition: ComponentDefinition,
  categoryName: string,
  filePath: string
) => {
  // 获取分类显示名称
  const categoryDisplayName = getCategoryDisplayName(categoryName)
  
  // 创建增强的定义，覆盖原有分类信息
  const enhancedDefinition = {
    ...definition,
    // 🔑 关键：使用文件夹路径确定的分类名称
    category: categoryDisplayName,
    mainCategory: categoryName,      // 保留原始文件夹名作为主分类
    folderPath: categoryName,        // 记录文件夹路径用于调试
    
    // 保留组件原有的subCategory（如果有）
    subCategory: definition.subCategory || undefined
  }
  
  return enhancedDefinition
}
```

## 🔄 组件注册流程

### 1. 注册管理器

```typescript
// component-registry.ts 简化版
export class ComponentRegistry {
  private components = new Map<string, ComponentDefinition>()
  private categories = new Map<string, ComponentCategory>()

  /**
   * 注册单个组件
   */
  register(definition: ComponentDefinition): void {
    // 验证组件定义
    if (!this.validateDefinition(definition)) {
      throw new Error(`组件定义无效: ${definition.type}`)
    }

    // 注册组件
    this.components.set(definition.type, definition)

    // 更新分类信息
    this.updateCategory(definition)

    console.log(`✅ 组件注册成功: ${definition.name} (${definition.type})`)
  }

  /**
   * 批量注册组件
   */
  registerAll(definitions: ComponentDefinition[]): void {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    }

    definitions.forEach(definition => {
      try {
        this.register(definition)
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          component: definition.type,
          error: error.message
        })
      }
    })

    console.log(`📊 批量注册完成: 成功 ${results.success}, 失败 ${results.failed}`)
    if (results.errors.length > 0) {
      console.warn('注册失败的组件:', results.errors)
    }
  }

  /**
   * 更新分类信息
   */
  private updateCategory(definition: ComponentDefinition): void {
    const categoryKey = definition.mainCategory || definition.category
    
    if (!this.categories.has(categoryKey)) {
      this.categories.set(categoryKey, {
        name: categoryKey,
        displayName: definition.category,
        components: [],
        count: 0
      })
    }

    const category = this.categories.get(categoryKey)
    if (!category.components.find(c => c.type === definition.type)) {
      category.components.push(definition)
      category.count++
    }
  }
}
```

### 2. 自动初始化

```typescript
// 系统启动时自动初始化
export const initializeCard2System = async () => {
  console.log('🚀 初始化 Card 2.1 系统...')

  try {
    // 1. 扫描组件
    const scannedComponents = await scanComponents()
    console.log(`📁 扫描到 ${scannedComponents.length} 个组件`)

    // 2. 注册到系统
    const registry = ComponentRegistry.getInstance()
    registry.registerAll(scannedComponents)

    // 3. 注册属性暴露
    scannedComponents.forEach(component => {
      if (component.settingConfig) {
        registerFromSettingConfig({
          componentType: component.type,
          settingConfig: component.settingConfig
        })
      }
    })

    // 4. 初始化交互系统
    initializeInteractionSystem()

    console.log('✅ Card 2.1 系统初始化完成')
    
    return {
      totalComponents: scannedComponents.length,
      categories: Array.from(registry.getCategories().keys()),
      success: true
    }
  } catch (error) {
    console.error('❌ Card 2.1 系统初始化失败:', error)
    throw error
  }
}
```

## 🎯 组件树生成

### 1. 树形结构构建

```typescript
export const getComponentTree = (): ComponentTree => {
  const registry = ComponentRegistry.getInstance()
  const allComponents = registry.getAll()
  const categories = new Map<string, ComponentCategory>()

  // 按分类分组组件
  allComponents.forEach(component => {
    const categoryKey = component.mainCategory || 'other'
    
    if (!categories.has(categoryKey)) {
      categories.set(categoryKey, {
        name: categoryKey,
        displayName: component.category || categoryKey,
        components: [],
        count: 0,
        order: getCategoryInfo(categoryKey).order || 50
      })
    }

    categories.get(categoryKey).components.push(component)
  })

  // 计算每个分类的组件数量
  categories.forEach(category => {
    category.count = category.components.length
  })

  // 转换为数组并排序
  const sortedCategories = Array.from(categories.values())
    .sort((a, b) => a.order - b.order)

  return {
    categories: sortedCategories,
    components: allComponents,
    totalCount: allComponents.length
  }
}
```

### 2. 组件筛选和查询

```typescript
export const getComponentsByCategory = (
  mainCategory?: string,
  subCategory?: string
): ComponentDefinition[] => {
  const registry = ComponentRegistry.getInstance()
  let components = registry.getAll()

  // 按主分类筛选
  if (mainCategory) {
    components = components.filter(comp => 
      comp.mainCategory === mainCategory || comp.category === mainCategory
    )
  }

  // 按子分类筛选
  if (subCategory) {
    components = components.filter(comp => 
      comp.subCategory === subCategory
    )
  }

  return components
}

export const searchComponents = (query: string): ComponentDefinition[] => {
  const registry = ComponentRegistry.getInstance()
  const allComponents = registry.getAll()
  const lowerQuery = query.toLowerCase()

  return allComponents.filter(component => 
    component.name.toLowerCase().includes(lowerQuery) ||
    component.description?.toLowerCase().includes(lowerQuery) ||
    component.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    component.type.toLowerCase().includes(lowerQuery)
  )
}
```

## 🐛 调试和监控

### 1. 注册状态监控

```typescript
// 开发环境下的详细日志
export const getRegistryStatus = () => {
  const registry = ComponentRegistry.getInstance()
  const components = registry.getAll()
  const categories = registry.getCategories()

  return {
    // 组件统计
    totalComponents: components.length,
    componentsByType: components.reduce((acc, comp) => {
      acc[comp.type] = {
        name: comp.name,
        category: comp.category,
        mainCategory: comp.mainCategory,
        hasDataSources: !!comp.dataSources?.length,
        hasSettings: !!comp.settingConfig?.length,
        hasInteraction: !!comp.interaction
      }
      return acc
    }, {}),

    // 分类统计
    totalCategories: categories.size,
    categoriesSummary: Array.from(categories.entries()).map(([key, category]) => ({
      key,
      displayName: category.displayName,
      componentCount: category.count,
      components: category.components.map(c => c.type)
    })),

    // 问题检测
    issues: detectRegistryIssues(components)
  }
}

// 检测常见问题
const detectRegistryIssues = (components: ComponentDefinition[]) => {
  const issues = []

  // 检查重复的组件类型
  const types = components.map(c => c.type)
  const duplicates = types.filter((type, index) => types.indexOf(type) !== index)
  if (duplicates.length > 0) {
    issues.push({
      type: 'duplicate_types',
      message: `发现重复的组件类型: ${duplicates.join(', ')}`
    })
  }

  // 检查缺失的必要字段
  components.forEach(comp => {
    if (!comp.defaultLayout) {
      issues.push({
        type: 'missing_layout',
        component: comp.type,
        message: `组件 ${comp.type} 缺少 defaultLayout 配置`
      })
    }

    if (comp.dataSources && comp.dataSources.length > 1 && !comp.dataSources.every(ds => ds.key)) {
      issues.push({
        type: 'invalid_datasources',
        component: comp.type,
        message: `组件 ${comp.type} 的数据源配置无效`
      })
    }
  })

  return issues
}
```

### 2. 开发者工具集成

```typescript
// 在浏览器控制台中可用的调试工具
if (process.env.NODE_ENV === 'development') {
  window.__CARD2_DEBUG__ = {
    // 查看注册状态
    getStatus: getRegistryStatus,
    
    // 重新扫描组件
    rescan: initializeCard2System,
    
    // 查看特定组件
    getComponent: (type: string) => {
      const registry = ComponentRegistry.getInstance()
      return registry.get(type)
    },
    
    // 列出所有组件
    listComponents: () => {
      const registry = ComponentRegistry.getInstance()
      return registry.getAll().map(c => ({
        type: c.type,
        name: c.name,
        category: c.category
      }))
    }
  }
}
```

## ✅ 最佳实践

### 1. 目录组织
- 按功能分类组织文件夹
- 使用语义化的分类名称
- 保持分类层次简单（不超过2层）

### 2. 组件命名
- 组件类型使用kebab-case
- 文件夹名称与组件类型保持一致
- 避免使用过于通用的名称

### 3. 错误处理
- 处理组件加载失败的情况
- 提供有意义的错误信息
- 支持部分失败的容错机制

## 🚨 常见问题

### 问题1: 组件未出现在组件库
**可能原因**: 文件结构不符合规范或definition.ts有错误
**解决**: 检查文件路径和组件定义语法

### 问题2: 分类显示错误
**可能原因**: category-mapping.ts配置缺失或文件夹名称不匹配
**解决**: 更新分类映射配置

### 问题3: 组件加载失败
**可能原因**: 导入路径错误或依赖缺失
**解决**: 检查import语句和依赖安装

## 🔗 相关文档

- [组件定义详解](./04-component-definition.md)
- [分类管理](./10-category-management.md)
- [调试工具](./15-debugging-tools.md)

---

**自动注册让组件开发更高效！** 🚀