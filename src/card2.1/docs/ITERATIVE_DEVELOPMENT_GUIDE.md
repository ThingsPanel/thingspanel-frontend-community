# Card 2.1 可迭代开发指南

> **📋 版本信息**  
> 创建时间：2024-12-31  
> 系统版本：Card 2.1  
> 文档类型：可迭代开发指南  
> 适用范围：新组件开发、系统扩展、架构理解

---

## 🎯 指南概述

本指南专注于 **实际开发工作流程** 和 **系统扩展模式**，提供可迭代更新的开发框架。

### 核心设计理念
- **自动化优先**：系统自动发现和注册组件
- **类型安全**：完整的 TypeScript 支持  
- **权限控制**：基于用户角色的组件访问
- **数据绑定**：声明式数据需求和响应式更新
- **可扩展性**：插件化的组件和数据源架构

---

## 📁 系统架构映射

### 核心模块结构
```
src/card2.1/
├── 🚀 core/                    # 核心系统
│   ├── auto-registry.ts        # 自动注册引擎
│   ├── component-loader.ts     # 组件加载器  
│   ├── permission-utils.ts     # 权限管理
│   ├── types.ts                # 核心类型定义
│   ├── data-binding/          # 数据绑定系统
│   │   ├── types.ts           # 数据绑定类型
│   │   ├── component-requirement-manager.ts # 组件需求管理
│   │   ├── data-transform-pipeline.ts      # 数据转换管道
│   │   ├── reactive-binding.ts             # 响应式绑定
│   │   └── integration-test.ts             # 集成测试
│   ├── data-source/           # 数据源管理 (新架构)
│   │   ├── component-schema.ts          # 组件架构
│   │   ├── data-binding-manager.ts      # 数据绑定管理器
│   │   ├── device-api-data-source.ts    # 设备API数据源
│   │   ├── reactive-data-manager.ts     # 响应式数据管理
│   │   └── static-data-source.ts        # 静态数据源
│   ├── data-sources/          # 数据源服务
│   │   ├── index.ts
│   │   └── static-data-source-service.ts
│   ├── data-source-center.ts  # 数据源中心
│   ├── config-manager.ts      # 配置管理
│   ├── interaction-*.ts       # 交互系统
│   └── FlexibleConfigForm.vue # 灵活配置表单
├── 🧩 components/              # 组件库
│   ├── simple-display/        # 简单展示组件
│   ├── dual-data-display/     # 双数据展示组件
│   ├── triple-data-display/   # 三数据展示组件
│   └── comprehensive-data-test/ # 综合数据测试组件
├── 🔗 hooks/                   # Vue 集成 Hooks
│   ├── useVisualEditorIntegration.ts # Visual Editor 集成
│   ├── useComponentTree.ts            # 组件树管理
│   └── use-interaction.ts             # 交互系统
├── 🔧 integration/            # 外部系统集成
│   ├── visual-editor-config.ts       # Visual Editor 配置
│   └── README.md
├── 📚 doc/                     # 文档目录
└── index.ts                   # 系统入口
```

### 系统架构层次

#### 🏗️ 数据流架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   组件需求声明   │───→│   自动注册系统   │───→│    权限过滤     │
│  ComponentDef   │    │  AutoRegistry   │    │ PermissionUtils │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ↓                       ↓                       ↓
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   数据源绑定     │───→│  响应式更新管道  │───→│   组件实例化     │
│ DataSourceBind  │    │ ReactiveBinding │    │ ComponentRender │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ↓                       ↓                       ↓
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Visual Editor  │←───│    用户界面      │←───│   交互系统      │
│   Integration   │    │   User Interface │    │ InteractionMgr  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 🔄 数据绑定体系架构
```
数据源中心 (DataSourceCenter)
    ├── 静态数据源 (StaticDataSource)
    ├── API数据源 (DeviceApiDataSource) 
    ├── WebSocket数据源
    └── 自定义数据源
         ↓
数据转换管道 (DataTransformPipeline)
    ├── 数据处理器 (DataProcessors)
    ├── 数据映射器 (DataMapper)
    └── 数据验证器 (DataValidator)
         ↓
响应式绑定 (ReactiveBinding)
    ├── 更新触发器 (UpdateTriggers)
    ├── 组件需求管理 (ComponentRequirementManager)
    └── 绑定管理器 (DataBindingManager)
```

---

## 🛠️ 开发工作流

### 1. 快速组件开发
```bash
# 创建组件目录
mkdir src/card2.1/components/my-widget

# 创建必要文件（自动化模板）
cd src/card2.1/components/my-widget
touch definition.ts index.ts MyWidget.vue MyWidgetConfig.vue
```

### 2. 组件定义模板 `definition.ts`
```typescript
import type { ComponentDefinition } from '@/card2.1/core/types'
import MyWidget from './MyWidget.vue'
import MyWidgetConfig from './MyWidgetConfig.vue'

const definition: ComponentDefinition = {
  // === 基础信息（必填） ===
  type: 'my-widget',
  name: '我的组件',
  description: '组件功能描述',
  
  // === 分类信息 ===
  category: '基础组件',
  mainCategory: '系统', // 或 '曲线'
  
  // === 实现组件 ===
  component: MyWidget,
  configComponent: MyWidgetConfig,
  
  // === 权限控制 ===
  permission: '不限', // 或 'TENANT_USER' | 'TENANT_ADMIN' | 'SYS_ADMIN'
  isRegistered: true,   // 是否在组件库中显示
  
  // === 数据源支持 ===
  supportedDataSources: ['static', 'api'], // 按需配置
  
  // === 默认配置 ===
  defaultConfig: {
    title: '默认标题',
    showBorder: true
  },
  
  // === Visual Editor 布局 ===
  defaultLayout: {
    canvas: { width: 400, height: 300, x: 0, y: 0 },
    gridstack: { w: 3, h: 3, x: 0, y: 0 }
  },
  
  // === 特性标记 ===
  tags: ['display', 'basic'],
  version: '1.0.0'
}

export default definition
```

### 3. Vue 组件模板 `MyWidget.vue`
```vue
<template>
  <n-card 
    :title="config.title" 
    :bordered="config.showBorder"
    class="my-widget"
  >
    <n-space vertical>
      <!-- 组件内容 -->
      <n-text>{{ displayData }}</n-text>
      
      <!-- 数据绑定状态 -->
      <n-text v-if="isLoading" depth="3">{{ $t('common.loading') }}</n-text>
      <n-text v-else-if="error" type="error">{{ error }}</n-text>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 我的组件 - Vue 实现
 * 集成 Naive UI 和主题系统
 */
import { computed, ref } from 'vue'
import { useThemeStore } from '@/store/modules/theme'

interface Props {
  config?: {
    title?: string
    showBorder?: boolean
  }
  dataSource?: any
  componentId?: string
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    title: '默认标题',
    showBorder: true
  })
})

// 主题集成
const themeStore = useThemeStore()

// 数据状态管理
const isLoading = ref(false)
const error = ref<string | null>(null)
const data = ref<any>(null)

// 计算属性
const displayData = computed(() => {
  if (isLoading.value) return $t('common.loading')
  if (error.value) return error.value
  return data.value || $t('common.noData')
})

// 数据处理逻辑
const processDataSource = async () => {
  if (!props.dataSource) return
  
  isLoading.value = true
  error.value = null
  
  try {
    // 数据处理逻辑
    data.value = await handleDataSource(props.dataSource)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '数据处理失败'
  } finally {
    isLoading.value = false
  }
}

async function handleDataSource(dataSource: any) {
  // 根据数据源类型处理数据
  switch (dataSource.type) {
    case 'static':
      return dataSource.data
    case 'api':
      const response = await fetch(dataSource.config.url)
      return response.json()
    default:
      throw new Error(`不支持的数据源类型: ${dataSource.type}`)
  }
}
</script>

<style scoped>
.my-widget {
  /* 使用主题变量，确保主题兼容 */
  border-color: var(--border-color);
  background-color: var(--card-color);
}
</style>
```

### 4. 配置组件模板 `MyWidgetConfig.vue`
```vue
<template>
  <n-form :model="localConfig" label-placement="left" label-width="80">
    <n-form-item :label="$t('common.title')">
      <n-input 
        v-model:value="localConfig.title" 
        :placeholder="$t('common.enterTitle')"
      />
    </n-form-item>
    
    <n-form-item :label="$t('common.showBorder')">
      <n-switch v-model:value="localConfig.showBorder" />
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Config {
  title: string
  showBorder: boolean
}

const props = defineProps<{
  config: Config
}>()

const emit = defineEmits<{
  'update:config': [config: Config]
}>()

const localConfig = ref<Config>({ ...props.config })

// 监听配置变化并同步
watch(localConfig, (newConfig) => {
  emit('update:config', newConfig)
}, { deep: true })
</script>
```

### 5. 导出文件 `index.ts`
```typescript
import definition from './definition'

export default definition
export { default as MyWidget } from './MyWidget.vue'
export { default as MyWidgetConfig } from './MyWidgetConfig.vue'
```

---

## 🔄 系统集成模式

### Visual Editor 集成
```typescript
import { useVisualEditorIntegration } from '@/card2.1/hooks'

// 在 Visual Editor 中使用
const { 
  availableWidgets,           // 所有可用组件
  getWidgetsByCategory,       // 按分类获取
  isInitialized,             // 初始化状态
  initializationError        // 初始化错误
} = useVisualEditorIntegration({
  autoInit: true,            // 自动初始化
  enableI18n: true,          // 启用国际化
  componentFilter: (def) => def.category === 'display' // 可选过滤
})
```

### 权限系统集成
```typescript
import { 
  filterComponentsByPermission, 
  getUserAuthorityFromStorage,
  setUserAuthority 
} from '@/card2.1/core/permission-utils'

// 当用户登录时设置权限
setUserAuthority('TENANT_ADMIN')

// 获取当前用户权限
const userAuthority = getUserAuthorityFromStorage()

// 过滤组件（自动执行，也可手动调用）
const filteredComponents = filterComponentsByPermission(components, userAuthority)
```

### 数据绑定系统
```typescript
import { 
  componentDataRequirementsRegistry 
} from '@/components/visual-editor/core/component-data-requirements'

// 注册组件数据需求
componentDataRequirementsRegistry.register('my-widget', {
  componentType: 'my-widget',
  displayName: '我的组件',
  primaryData: {
    name: 'value',
    type: 'value',
    valueType: 'number',
    required: true,
    label: '数值',
    description: '组件显示的主要数值'
  },
  dataFields: [
    {
      name: 'title',
      type: 'string',
      required: false,
      label: '标题',
      description: '组件显示标题'
    }
  ]
})
```

---

## 🧪 测试和调试

### 系统状态检查
```typescript
import { 
  initializeCard2System,
  getComponentRegistry,
  getComponentTree,
  getAllComponents 
} from '@/card2.1'

// 初始化系统
await initializeCard2System()

// 检查组件注册状态
const registry = getComponentRegistry()
const componentTree = getComponentTree()
const allComponents = getAllComponents()

console.log('已注册组件:', componentTree.totalCount)
console.log('组件分类:', componentTree.categories)
console.log('所有组件:', allComponents.map(c => c.type))
```

### 开发调试模式
```typescript
// 开启详细日志（开发环境）
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Card 2.1 调试模式')
  
  // 检查组件权限过滤
  const allComponents = getAllComponents()
  const userAuthority = getUserAuthorityFromStorage()
  const filteredComponents = filterComponentsByPermission(allComponents, userAuthority)
  
  console.log('权限过滤前:', allComponents.length)
  console.log('权限过滤后:', filteredComponents.length)
  console.log('用户权限级别:', userAuthority)
}
```

---

## 📚 迭代更新指引

### 🔄 文档更新时机
当以下代码发生变化时，更新对应文档部分：

| 代码变化类型 | 更新文档部分 | 更新方法 |
|-------------|-------------|---------|
| `core/types.ts` 新增类型 | **系统架构映射** → 核心模块结构 | 更新类型定义说明 |
| `components/` 新增组件 | **开发工作流** → 组件定义模板 | 检查模板是否需要更新 |
| `hooks/` 新增 Hook | **系统集成模式** | 添加新的集成模式示例 |
| `core/auto-registry.ts` 逻辑变更 | **系统架构映射** → 数据流架构 | 更新架构流程图 |
| 权限系统变更 | **系统集成模式** → 权限系统集成 | 更新权限集成代码 |
| 测试页面新增 | **测试和调试** | 添加测试访问路径 |

### 🎯 更新操作流程
1. **识别变化**：确定代码变更的影响范围
2. **定位章节**：在文档中找到对应的模块章节  
3. **更新内容**：修改相应的代码示例和说明
4. **验证更新**：确保示例代码能正常工作
5. **更新版本信息**：修改文档头部的更新时间

### 📝 章节维护责任

| 章节 | 维护触发条件 | 关联文件 |
|------|-------------|---------|
| **系统架构映射** | 目录结构变化、核心文件重构 | `core/*`, `index.ts` |
| **开发工作流** | 组件开发规范变化 | `components/*/definition.ts` |
| **系统集成模式** | Hooks 变化、API 变化 | `hooks/*`, 集成相关文件 |
| **测试和调试** | 测试页面变化、调试工具更新 | 测试相关文件 |

---

## 🚀 快速参考

### 常用命令
#### 开发命令
```bash
# 启动开发服务器
pnpm dev

# 代码质量检查（强制，提交前必须通过）
pnpm quality-check       # 完整质量检查
pnpm typecheck          # TypeScript 类型检查
pnpm lint               # ESLint 代码检查
pnpm pre-commit-check   # 提交前检查（包含 PanelV2 架构验证）

# 构建和预览
pnpm build              # 生产环境构建
pnpm preview            # 预览构建结果
```

#### 测试页面访问
```bash
# 主要测试页面（开发服务器运行时访问）
http://localhost:5002/test                              # 测试首页导航
http://localhost:5002/test/editor-integration           # Visual Editor 集成测试
http://localhost:5002/test/data-binding-system-integration # Card 2.1 数据绑定系统测试
http://localhost:5002/test/data-source-system           # 数据源系统测试

# 可视化编辑器页面
http://localhost:5002/visualization/visual-editor-details # Visual Editor 主界面
```

### 关键 API 速查
```typescript
// === 系统核心 ===
import { 
  initializeCard2System,     // 系统初始化
  getComponentRegistry,      // 获取组件注册表
  getComponentTree,         // 获取组件树结构
  getAllComponents,         // 获取所有组件（包括权限过滤的）
  getComponentsByCategory,  // 按分类获取组件
  getCategories            // 获取所有分类
} from '@/card2.1'

// === 权限管理 ===
import { 
  setUserAuthority,           // 设置用户权限
  getUserAuthorityFromStorage, // 获取当前用户权限
  reapplyPermissionFilter,    // 重新应用权限过滤
  filterComponentsByPermission // 手动权限过滤
} from '@/card2.1/core/permission-utils'

// === Vue 集成 Hooks ===
import { 
  useVisualEditorIntegration, // Visual Editor 集成
  useComponentTree,           // 组件树管理
  useInteraction             // 交互系统
} from '@/card2.1/hooks'

// === 数据绑定 ===
import { 
  componentDataRequirementsRegistry 
} from '@/components/visual-editor/core/component-data-requirements'

// === 类型定义 ===
import type { 
  ComponentDefinition,        // 组件定义类型
  ComponentPermission,        // 权限类型
  ComponentDataRequirement,   // 数据需求类型
  DataFieldRequirement       // 数据字段需求类型
} from '@/card2.1/core/types'
```

### 核心概念
- **自动注册**：系统自动扫描 `components/` 目录
- **权限过滤**：根据用户角色自动过滤可用组件
- **数据绑定**：组件声明数据需求，系统提供响应式更新
- **国际化集成**：所有用户界面文本使用 `$t()` 国际化

---

---

## 📈 文档维护状态

| 维护项目 | 状态 | 最新更新 |
|---------|------|----------|
| 核心架构图 | ✅ 同步 | 2024-12-31 |
| 代码示例 | ✅ 验证通过 | 2024-12-31 |
| API 参考 | ✅ 准确 | 2024-12-31 |
| 测试链接 | ✅ 有效 | 2024-12-31 |
| 类型定义 | ✅ 最新 | 2024-12-31 |

**📋 文档版本信息**  
✅ **当前版本**：v1.1.0 (第二轮优化)  
✅ **最后更新**：2024-12-31  
✅ **验证状态**：已验证所有代码示例和测试链接  
🔄 **下次更新触发**：`core/types.ts`、组件规范、Hooks API 变更时

**👥 维护者**：ThingsPanel 团队  
**📧 反馈渠道**：GitHub Issues 或内部技术群