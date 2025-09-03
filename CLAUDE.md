# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。

## 项目概述

ThingsPanel 是一个基于 Vue 3、TypeScript 和 Naive UI 构建的轻量级、组件化开源物联网应用支撑平台。该项目专注于通过可重用的插件和组件来减少开发工作量并加速物联网项目建设。

## 核心命令

### 开发
- `pnpm dev` 或 `npm run dev` - 在端口 5002 启动开发服务器
- `pnpm dev:test` - 启动测试环境开发服务器
- `pnpm dev:prod` - 启动生产环境开发服务器
- `pnpm start` - 等同于 `pnpm dev`

### 构建和部署
- `pnpm build` - 生产环境构建并进行类型检查（需要 4GB 内存）
- `pnpm build:4096` - 生产环境构建并分配 8GB 内存
- `pnpm build:test` - 测试环境构建
- `pnpm build:vercel` - Vercel 部署构建（使用哈希路由）
- `pnpm preview` - 预览构建结果（端口 9725）

### 代码质量和开发工具
- `pnpm lint` - 运行 ESLint 并自动修复
- `pnpm typecheck` - 运行 TypeScript 类型检查（4GB 内存限制）
- `pnpm format` - 运行 Prettier 代码格式化
- `pnpm quality-check` - 运行完整的开发质量检查
- `pnpm pre-commit-check` - 提交前质量检查（包含 PanelV2 架构验证）
- `pnpm gen-route` - 生成基于文件的路由
- `pnpm cleanup` - 清理项目文件
- 预提交钩子自动运行 `pnpm typecheck && pnpm lint-staged`

### 包管理
- 使用 **pnpm** 作为包管理器，配置工作区
- `pnpm install` - 安装依赖
- 工作区包含内部包：`@sa/axios`、`@sa/hooks`、`@sa/materials`、`@sa/utils` 等

## 架构概述

### Monorepo 结构
项目使用 pnpm 工作区，内部包位于 `packages/`：
- `@sa/axios` - HTTP 客户端包装器
- `@sa/color-palette` - 颜色系统
- `@sa/hooks` - 共享 Vue 组合式函数
- `@sa/materials` - UI 组件库
- `@sa/utils` - 工具函数
- `@sa/scripts` - 构建和开发脚本
- `@sa/uno-preset` - UnoCSS 预设配置

### 核心前端架构

#### 技术栈
- **框架**：Vue 3 与组合式 API（`<script setup>` 语法）
- **语言**：TypeScript 严格模式
- **状态管理**：Pinia 存储
- **路由**：Vue Router 4 与 `@elegant-router/vue` 基于文件的路由
- **UI 库**：Naive UI 作为主要组件库
- **样式**：UnoCSS 实用优先 CSS 与 `@unocss/preset-uno`
- **图标**：通过 UnoCSS 预设的 Iconify（`i-...` 类）和 `@vicons/*` 组件
- **构建工具**：Vite 与自定义插件
- **国际化**：Vue I18n 支持英文和中文

#### 关键目录结构
```
src/
├── views/                     # 页面组件（基于文件的路由）
├── components/                # 共享组件
│   ├── visual-editor/           # 可视化编辑器核心系统
│   │   ├── renderers/             # 多渲染器架构支持
│   │   ├── components/            # 编辑器UI组件
│   │   ├── core/                  # 核心逻辑和配置
│   │   ├── settings/              # 设置和配置面板
│   │   └── widgets/               # 可视化组件库
│   ├── panel/                 # 原始面板实现
│   ├── common/grid/           # 网格布局系统
│   └── device-selectors/      # 设备选择器组件
├── layouts/                   # 布局组件
├── store/modules/             # Pinia 存储模块
├── service/api/               # API 服务函数
├── hooks/                     # Vue 组合式函数
├── card/                      # 仪表板卡片组件 (旧系统)
│   ├── builtin-card/            # 内置系统卡片
│   └── chart-card/              # 图表可视化卡片
├── card2.1/                   # 新一代卡片系统
│   ├── core/                    # 核心数据绑定和组件系统
│   ├── components/              # Card 2.1 组件实现
│   └── hooks/                   # 专用组合式函数
├── utils/                     # 工具函数
├── typings/                   # TypeScript 类型定义
└── locales/                   # i18n 翻译文件
```

## 开发指南

### 代码风格和约定
- **Vue 3**：专门使用组合式 API 与 `<script setup>` 语法
- **TypeScript**：启用严格模式，避免 `any` 类型，对仅类型导入使用 `import type`
- **命名**：组件使用 PascalCase，组合式函数/服务使用 camelCase
- **状态**：使用 Pinia 存储管理全局状态，在 `src/store/modules/` 中定义
- **API**：在 `src/service/api/` 中定义 API 函数，严格类型化请求/响应
- **国际化**：始终使用 `$t()` 或 `useI18n()` 处理面向用户的文本

### 🚨 强制性开发规范
- **UI 组件（强制）**：**必须优先使用 Naive UI 组件**，按需导入。禁止重复实现已有组件
- **样式系统（强制）**：如果无法使用 Naive UI，**必须集成主题系统**，使用 `useThemeStore()` 和 CSS 变量
- **国际化（强制）**：**所有用户可见文本必须使用国际化**，使用 `$t()` 或 `useI18n()`，翻译文件位于 `/src/locales/langs/`
- **中文注释（强制）**：**所有代码必须包含中文注释**，特别是类定义、复杂方法和关键业务逻辑
- **中文交流（优先）**：回复和说明尽可能使用中文，除非涉及技术术语需要英文准确性
- **样式优先级**：1️⃣ Naive UI 组件 → 2️⃣ UnoCSS 实用类 → 3️⃣ 主题集成的自定义 CSS
- **禁止硬编码**：严禁硬编码颜色值和文本，必须使用主题变量和国际化键值
- **主题适配**：所有组件必须在明暗主题下正常工作，开发时需测试主题切换

### 导入约定
```typescript
// 仅类型导入
import type { MyType } from './types'

// 工作区包
import { useRequest } from '@sa/hooks'
import { request } from '@sa/axios'

// 路径别名
import Component from '@/components/Component.vue'
import { helper } from '@/utils/helper'
```

### 组件结构模板
```vue
<script setup lang="ts">
/**
 * 设备状态展示组件
 * 用于显示设备的在线状态和基本信息
 */

// 1. 类型导入（优先使用 Naive UI 类型）
import type { ButtonProps } from 'naive-ui'
import { useThemeStore } from '@/store/modules/theme'
import { useI18n } from 'vue-i18n'

// 2. 组件接口定义
interface Props {
  data: MyData[] // 设备数据列表
  size?: ButtonProps['size'] // 按钮尺寸，复用 Naive UI 类型
}

// 3. Props 和 emits
const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})
const emit = defineEmits<{
  update: [value: string] // 数据更新事件
}>()

// 4. 国际化集成（强制）
const { t } = useI18n()

// 5. 主题系统集成（强制）
const themeStore = useThemeStore()

// 6. 组合式函数和响应式状态
const { loading, data } = useRequest(apiCall)
const state = reactive({ 
  // 组件内部状态管理
  isVisible: true,
  selectedIds: [] as string[]
})

// 7. 计算属性和监听器
const computedValue = computed(() => {
  // 根据数据计算显示状态
  return state.selectedIds.length
})

/**
 * 处理按钮点击事件
 * 触发数据更新并发送事件
 */
const handleClick = () => {
  // 处理点击逻辑
  emit('update', 'new-value')
}
</script>

<template>
  <!-- 强制优先使用 Naive UI 组件 -->
  <n-card 
    class="mb-4" 
    :theme-overrides="themeStore.naiveTheme"
  >
    <n-space vertical>
      <!-- 所有用户可见文本必须使用国际化 -->
      <n-button 
        :size="props.size"
        :loading="loading"
        type="primary"
        @click="handleClick"
      >
        {{ t('common.confirm') }}
      </n-button>
      
      <n-text>{{ t('device.status.online') }}</n-text>
      
      <!-- 如果必须自定义样式，使用主题变量 -->
      <div class="custom-element">
        {{ t('device.info.description') }}
      </div>
    </n-space>
  </n-card>
</template>

<style scoped>
/* 只有在 Naive UI 无法满足需求时才使用自定义样式 */
.custom-element {
  /* ✅ 正确：使用主题变量，禁止硬编码颜色 */
  color: var(--text-color);
  background-color: var(--card-color);
  border: 1px solid var(--border-color);
  padding: 12px;
  border-radius: var(--border-radius);
  
  /* ❌ 绝对禁止：硬编码颜色和文本 */
  /* color: #333333; */
  /* background-color: #ffffff; */
  /* content: "设备信息"; */
}

/* 响应主题变化 */
[data-theme="dark"] .custom-element {
  box-shadow: var(--box-shadow-dark);
}
</style>
```

### 状态管理模式
```typescript
// 在 src/store/modules/ 中定义存储
export const useMyStore = defineStore('my-store', () => {
  const state = reactive({
    data: [] as MyData[]
  })

  const getters = computed(() => state.data.length)

  const actions = {
    async fetchData() {
      const response = await myApi()
      state.data = response.data
    }
  }

  return { state, getters, ...actions }
})
```

### API 服务模式
```typescript
// 在 src/service/api/ 中
import { request } from '@sa/axios'

export interface MyApiRequest {
  id: string
}

export interface MyApiResponse {
  data: MyData[]
}

export function fetchMyData(params: MyApiRequest): Promise<MyApiResponse> {
  return request.get<MyApiResponse>('/api/my-data', { params })
}
```

## 路由系统

### 🚨 Views目录路由机制（重要！）

**基于文件的路由系统使用 `@elegant-router/vue`，必须严格遵循以下规则：**

#### 文件结构到路由映射规律
```
src/views 文件结构                    对应生成的路由
├── about/index.vue                →  /about
├── dashboard/
│   ├── panel/index.vue            →  /dashboard/panel  
│   └── workbench/index.vue        →  /dashboard/workbench
└── test/
    ├── data-binding-system-integration/
    │   └── index.vue              →  /test/data-binding-system-integration
    └── editor-integration/
        └── index.vue              →  /test/editor-integration
```

#### 🚨 关键规则（违反将导致路由无法访问）

1. **文件命名强制要求**：
   - ✅ 正确：`src/views/test/my-feature/index.vue`
   - ❌ 错误：`src/views/test/my-feature.vue`
   - ❌ 错误：`src/views/test/MyFeature.vue`

2. **路由生成机制**：
   - 文件结构会自动映射到 `src/router/elegant/routes.ts`
   - 路由名使用下划线连接：`test_data-binding-system-integration`
   - 组件引用格式：`view.test_data-binding-system-integration`

3. **国际化配置**（可选但推荐）：
   ```json
   // src/locales/langs/zh-cn/route.json
   {
     "route.test_data-binding-system-integration": "数据绑定系统集成",
     "route.test_editor-integration": "编辑器集成测试"
   }
   ```

#### 开发流程规范

**🚨 创建新测试页面前必须遵循的步骤：**

1. **研究现有结构**：`find src/views -name "*.vue" | head -20` 了解目录规律
2. **创建正确目录**：`mkdir -p src/views/test/my-feature`
3. **创建index.vue**：在目录内创建 `index.vue`（不是任意文件名）
4. **验证路由生成**：检查 `src/router/elegant/routes.ts` 是否自动生成路由
5. **添加国际化**：在 `src/locales/langs/zh-cn/route.json` 添加对应翻译
6. **测试访问**：通过 `http://localhost:5002/test/my-feature` 访问

#### 常见错误及解决方案

```bash
# ❌ 错误做法 - 直接创建vue文件
touch src/views/test/my-test-page.vue

# ✅ 正确做法 - 创建目录和index.vue
mkdir -p src/views/test/my-test-page
touch src/views/test/my-test-page/index.vue
```

#### 路由元数据和懒加载
- 路由元数据可以在组件注释中定义
- 所有路由组件自动懒加载：`component: () => import('@/views/path/index.vue')`
- 支持多级嵌套路由结构

## 构建配置

### 内存优化
- 构建过程需要大量内存（4-8GB）
- 大型依赖的手动代码分割
- 并行文件操作限制为 2 以提高内存效率

### 环境变量
- `VITE_SERVICE_ENV` - 环境（dev/test/prod）
- 开发服务器运行在端口 5002
- 预览服务器运行在端口 9725

## 测试和质量保证

### 质量检查系统
- `pnpm quality-check` - 运行完整的开发质量检查工具
- `pnpm pre-commit-check` - 提交前专用检查（包含架构合规性验证）
- **UI组件合规性检查** - 自动验证是否优先使用 Naive UI 组件
- **主题系统集成检查** - 验证组件是否正确集成 `useThemeStore()` 和主题变量
- **硬编码颜色检测** - 自动检测和报告硬编码颜色值（#RGB、rgb()等）
- **PanelV2 架构合规性检查** - 验证渲染器分离原则、主题系统集成等
- **CSS 语法检查** - 检测常见语法错误和样式规范违规
- **必要文件存在性检查** - 确保关键文档和配置文件完整

### 预提交钩子
- TypeScript 类型检查（`pnpm typecheck`）
- 对暂存文件运行 ESLint 并自动修复
- 提交消息验证
- 运行质量检查脚本验证代码符合项目标准

### ESLint 配置
- **扁平配置格式（ESLint v9+）** - 现代化配置结构
- Vue 3 推荐规则与组合式 API 特定规则
- TypeScript 推荐规则与严格类型检查
- Prettier 集成与统一代码格式化
- 项目特定需求的自定义规则（允许 console、处理图标导入等）

## Visual Editor 和 Card 2.1 架构

### Visual Editor 多渲染器系统
项目实现了一个先进的可视化编辑器系统，支持多种渲染器：
- **Canvas 渲染器**：自由布局的画布式编辑器
- **Gridstack 渲染器**：基于网格的响应式布局
- **GridLayoutPlus 渲染器**：增强版网格布局系统
- **自定义渲染器**：支持扩展新的渲染方式

#### 关键文件位置
- `/src/components/visual-editor/renderers/` - 渲染器实现
- `/src/components/visual-editor/core/` - 核心配置和管理
- `/src/components/visual-editor/components/` - UI组件

### Card 2.1 数据绑定系统
**完全重构的数据绑定系统**，解决了组件数据需求声明和响应式更新的核心问题：

#### 核心特性
- **组件数据需求声明**：组件可声明复杂数据结构（值、对象、数组、嵌套结构）
- **通用数据转换管道**：支持静态数据、API接口、WebSocket、脚本生成等多种数据源
- **响应式数据绑定**：多种触发器（定时器、WebSocket、事件、手动）实现实时更新
- **数据关系处理**：支持数据间的计算关系和派生关系
- **完整测试系统**：包含集成测试和可视化配置界面

#### 关键文件位置
- `/src/card2.1/core/data-binding/` - 数据绑定核心系统
- `/src/card2.1/core/data-binding/component-requirement-manager.ts` - 组件需求管理器
- `/src/card2.1/core/data-binding/data-transform-pipeline.ts` - 数据转换管道
- `/src/card2.1/core/data-binding/reactive-binding.ts` - 响应式绑定机制
- `/src/card2.1/components/comprehensive-data-test/` - 综合测试组件
- `/src/views/test/data-binding-system-integration/` - 端到端测试页面

#### 使用方式
1. **测试页面访问**：菜单 → 测试 → 数据绑定系统集成
2. **Visual Editor集成**：在编辑器中添加"综合数据测试"组件
3. **API集成测试**：`/src/card2.1/core/data-binding/integration-test.ts`

### 网格系统集成
- **GridStack.js**：支持拖拽、调整大小、响应式布局
- **Grid Layout Plus**：增强版网格布局，支持更多功能
- **自定义网格组件**：项目特定的网格布局实现

#### 使用位置
- `/src/components/common/grid/` - 网格系统组件
- `/src/components/visual-editor/renderers/gridstack/` - Gridstack 渲染器

## 🚨 已修复的关键问题

### 1. 响应式属性访问错误

**问题**：在 `useVisualEditorIntegration.ts` 中错误地直接访问计算属性
```typescript
// ❌ 错误
const components = componentTree.filteredComponents
if (!Array.isArray(components)) return []

// ✅ 正确
const components = componentTree.filteredComponents.value
if (!Array.isArray(components)) return []
```

**影响**：导致组件列表无法正确获取，左侧面板显示为空

### 2. Widget Library 响应式访问错误

**问题**：在 WidgetLibrary.vue 中重复添加 `.value`
```typescript
// ❌ 错误
return card2Integration.availableWidgets.value

// ✅ 正确  
return card2Integration.availableWidgets
```

**原因**：`availableWidgets` 本身就是 computed，在模板中会自动解构

### 3. 多实例状态不同步问题

**问题描述**：PanelEditor 和 WidgetLibrary 分别实例化 useVisualEditorIntegration，配置不一致：
- PanelEditor: `autoInit: true` (初始化成功)
- WidgetLibrary: `autoInit: false` (未初始化)

**修复方案**：
```typescript
// 统一配置为 autoInit: true
const card2Integration = useCard2Integration({ autoInit: true })
```

### 4. Card2.1 与 Visual Editor 数据结构适配问题

**症状**：组件显示正常但添加时报错 `Cannot read properties of undefined (reading 'canvas')`

**根本原因**：
1. Card2.1 `ComponentDefinition` 缺少 Visual Editor 所需的 `defaultLayout` 结构
2. `getComponentDefinition` 返回原始定义而不是转换后的结构

**完整修复**：
```typescript
// 1. 在 availableWidgets 计算属性中添加结构转换
const widget: Card2Widget = {
  // 基本信息...
  defaultLayout: {
    canvas: {
      width: definition.config?.style?.width || 300,
      height: definition.config?.style?.height || 200
    },
    gridstack: {
      w: Math.ceil((definition.config?.style?.width || 300) / 150),
      h: Math.ceil((definition.config?.style?.height || 200) / 150)
    }
  },
  defaultProperties: definition.config || {},
  metadata: {
    isCard2Component: true,
    card2ComponentId: definition.type,
    card2Definition: definition
  }
}

// 2. 修复 getComponentDefinition 返回转换后的结构
const getComponentDefinition = (type: string): Card2Widget | undefined => {
  return availableWidgets.value.find(widget => widget.type === type)
}
```

## 物联网领域特定功能

### 设备管理
- 带有协议插件的设备配置模板
- 设备分组和批量操作
- 实时遥测数据可视化
- 设备位置映射（百度、高德、腾讯地图）

### 仪表板和可视化
- 基于卡片的仪表板系统
- 实时数据图表（ECharts、AntV G2）
- 大屏可视化支持
- 移动响应式设计

### 自动化和规则
- 场景联动和自动化规则
- 告警通知系统
- 数据处理规则引擎
- WebSocket 实时更新

## 性能考虑

- 大型设备列表的虚拟滚动
- 路由组件的懒加载
- 内存高效的构建过程
- 使用 UnoCSS 实用类的响应式设计
- 大型数据集的图表虚拟化

## 调试和开发技巧

- 使用 Vue DevTools 进行组件检查
- Vite HMR 提供快速开发反馈
- TypeScript 严格模式及早捕获错误
- ESLint 提供实时代码质量反馈
- 使用 `console.log`（ESLint 配置中允许）进行调试

# PanelV2 多渲染器架构特定规范

## 🚨 强制性开发规范

### 📋 开发前必读检查清单
**每次开发任务开始前，必须完成 [DEVELOPMENT_CHECKLIST.md](./DEVELOPMENT_CHECKLIST.md) 中的所有检查项。**

### 🏗️ 架构约束 (严格执行)

#### 工具栏分离原则
- **禁止在渲染器组件中实现工具栏** - 渲染器只负责渲染逻辑
- **使用独立工具栏组件** - 工具栏功能由 `MainToolbar` 及其子工具栏实现
- **工具栏动态切换** - 根据当前渲染器类型动态显示对应工具栏

#### 主题系统集成 (强制)
- **必须使用 `useThemeStore`** - 所有组件必须支持主题切换  
- **禁止硬编码颜色** - 使用 CSS 变量和主题系统
- **主题变量命名规范** - 遵循 `--component-property-state` 格式

#### 渲染器开发规范
```
渲染器目录结构（强制）：
├── components/           # 内部组件（不包含工具栏）
├── composables/         # 业务逻辑 composables  
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
├── adapters/           # 数据适配器
└── [RendererName]Renderer.vue  # 主组件（纯渲染）
```

#### 图标使用规范
- **强制使用 @vicons/ionicons5** - 统一图标库
- **图标命名约定** - 必须使用 `Outline` 后缀 (如 `ArrowBackOutline`)
- **禁止使用不存在的图标** - 常见错误: `AlignHorizontalCenter` 不存在

### 🚨 质量保证机制

#### 代码提交前检查 (强制)
```bash
# 必须全部通过才允许提交
pnpm lint      # ESLint 检查无错误
pnpm typecheck # TypeScript 类型检查无错误
pnpm build     # 构建成功
```

#### 常见违规示例与修复
```css
/* ❌ 错误 - CSS 语法错误 */
.container { justify-between; }

/* ✅ 正确 */
.container { 
  display: flex;
  justify-content: space-between; 
}
```

```vue
<!-- ❌ 错误 - 渲染器中包含工具栏 -->
<template>
  <div class="renderer">
    <div class="toolbar">...</div> <!-- 违规 -->
    <div class="content">...</div>
  </div>
</template>

<!-- ✅ 正确 - 纯渲染器 -->
<template>
  <div class="renderer">
    <div class="content">...</div>
  </div>
</template>
```

### 🎯 开发流程约束

1. **开发前** - 完成 DEVELOPMENT_CHECKLIST.md 前置检查
2. **开发中** - 每次修改后运行 lint 和 typecheck  
3. **提交前** - 完成完整的质量检查清单
4. **代码审查** - 确保架构合规性和代码质量

### 📚 相关文档
- [DEVELOPMENT_CHECKLIST.md](./DEVELOPMENT_CHECKLIST.md) - 开发检查清单（必读）
- [渲染器开发规范](./src/components/panelv2/docs/RENDERER_DEVELOPMENT_GUIDE.md)
- [主题系统指南](./src/components/panelv2/theme/README.md)

---

**🚨 CRITICAL: 每次开发任务必须严格遵循上述 PanelV2 架构规范，违规代码不得提交。**

## 项目特定开发流程

### 测试系统访问
项目包含完整的测试和演示系统，**通过开发服务器菜单直接访问**：
- **Visual Editor 测试**：`菜单 → 测试 → 编辑器集成测试` - 编辑器功能集成测试
- **数据绑定系统测试**：`菜单 → 测试 → 数据绑定系统集成` - Card 2.1 完整数据绑定测试
- **组件API配置测试**：`/src/views/test/ComponentApiConfigTest.vue` - 组件配置系统测试
- **设备选择器测试**：`DeviceDispatchSelectorTest.vue` 和 `DeviceMetricsSelectorTest.vue` - 设备选择组件测试
- **数据源系统测试**：`菜单 → 测试 → 数据源系统` - 各种数据源功能测试

### 测试页面路由
- `/test` - 测试首页，包含所有测试功能导航
- `/test/editor-integration` - Visual Editor 集成测试
- `/test/data-binding-system-integration` - Card 2.1 数据绑定系统完整测试
- `/test/data-source-system` - 数据源系统测试

### 内存和性能优化
- **构建内存限制**：默认 4GB（`--max-old-space-size=4096`），可扩展至 8GB
- **并行操作限制**：构建时限制为 2 个并行文件操作以减少内存使用
- **代码分割**：手动配置大型依赖库分包（Vue、Naive UI、图表库等）
- **开发服务器**：使用轮询模式监听文件变化，支持 WSL2 环境

### 工作区包管理
项目使用 pnpm 工作区，包含多个内部包：
```
packages/
├── @sa/axios       # HTTP 客户端封装
├── @sa/hooks       # 共享组合式函数
├── @sa/materials   # UI 组件库
├── @sa/utils       # 工具函数库
├── @sa/scripts     # 构建和开发脚本
└── @sa/uno-preset  # UnoCSS 预设配置
```

### 特殊配置文件
- **Vite 配置**：`vite.config.ts` - 包含内存优化、代码分割和构建配置
- **路由配置**：使用 `@elegant-router/vue` 自动生成基于文件的路由
- **ESLint 配置**：`eslint.config.js` - Flat Config 格式，支持 Vue 3 + TypeScript
- **主题集成**：支持明暗主题切换，使用 CSS 变量系统
- **质量检查脚本**：`scripts/dev-quality-check.js` - PanelV2 架构合规性检查

### 构建优化配置
- **手动代码分割**：大型依赖库分包（Vue/Naive UI/图表库/工具库）
- **内存管理**：`maxParallelFileOps: 2` 限制并行文件操作
- **轮询模式**：开发服务器使用 `usePolling: true` 支持 WSL2 环境
- **SVG 组件化**：集成 `vite-svg-loader` 支持 SVG 组件导入

### 开发环境特性
- **开发服务器端口**：5002（可配置）
- **预览服务器端口**：9725
- **热重载**：支持 Vue SFC 和 TypeScript 热更新
- **SVG 支持**：集成 `vite-svg-loader` 支持 SVG 组件导入
- **图标系统**：支持 Iconify（UnoCSS）和 @vicons 组件两种方式

## 常见开发工作流程

### 新功能开发流程
1. **运行质量检查**: `pnpm quality-check` 确保开发环境就绪
2. **启动开发服务器**: `pnpm dev` 
3. **功能测试**: 使用 `/test` 路由下的测试页面验证功能
4. **代码检查**: 开发过程中运行 `pnpm lint` 和 `pnpm typecheck`
5. **提交前检查**: `pnpm pre-commit-check` 验证符合项目标准

### Visual Editor 开发指南
1. **架构理解**: 阅读 `/src/components/visual-editor/ARCHITECTURE_GUIDE.md` 了解完整架构
2. **渲染器开发**: 参考 `/src/components/visual-editor/docs/renderers/RENDERER_DEVELOPMENT_GUIDE.md`
3. **组件开发**: 使用 Card 2.1 数据绑定系统声明数据需求
4. **测试验证**: 使用 `/test/editor-integration` 页面测试编辑器集成

### 数据绑定开发指南
1. **理解系统**: 阅读 `/src/card2.1/DATA_BINDING_SYSTEM_SUMMARY.md`
2. **组件集成**: 使用组件需求声明系统定义数据结构
3. **功能测试**: 访问 `/test/data-binding-system-integration` 页面测试完整流程

### 调试和诊断
- **开发者工具**: 使用 Vue DevTools 进行组件检查和状态调试
- **网络检查**: 检查 API 调用和 WebSocket 连接状态
- **控制台日志**: 项目允许使用 `console.log`，ESLint 不会报错
- **主题切换测试**: 确保组件在明暗主题下都正常工作

## Naive UI 使用规范和主题系统

### Naive UI 优先原则
```vue
<!-- ✅ 正确：优先使用 Naive UI 组件 -->
<n-button type="primary" :loading="loading">
  {{ $t('common.submit') }}
</n-button>

<n-input 
  v-model:value="searchText"
  :placeholder="$t('common.search')"
  clearable
/>

<n-data-table 
  :columns="columns" 
  :data="tableData"
  :pagination="paginationProps"
/>

<!-- ❌ 错误：重复实现已有组件 -->
<!-- <button class="custom-button">Submit</button> -->
<!-- <input class="custom-input" /> -->
```

### 主题系统集成模式
```vue
<script setup lang="ts">
import { useThemeStore } from '@/store/modules/theme'

// 强制集成主题系统
const themeStore = useThemeStore()

// 使用主题变量进行条件渲染
const isDark = computed(() => themeStore.darkMode)
</script>

<template>
  <!-- Naive UI 组件自动适配主题 -->
  <n-card :bordered="false">
    <n-space vertical>
      <!-- 自定义组件必须集成主题 -->
      <div class="custom-content">
        内容区域
      </div>
    </n-space>
  </n-card>
</template>

<style scoped>
.custom-content {
  /* 使用 CSS 变量，自动适配主题 */
  color: var(--text-color);
  background-color: var(--body-color);
  border: 1px solid var(--border-color);
}

/* 响应主题变化 */
[data-theme="dark"] .custom-content {
  box-shadow: var(--box-shadow-dark);
}
</style>
```

### 常用 Naive UI 组件映射
- **按钮**: `<n-button>` 替代自定义按钮
- **输入框**: `<n-input>` / `<n-input-number>` / `<n-select>`
- **表单**: `<n-form>` + `<n-form-item>`
- **表格**: `<n-data-table>` 替代自定义表格
- **弹窗**: `<n-modal>` / `<n-drawer>` 替代自定义弹窗
- **通知**: `$message` / `$notification` 替代自定义提示
- **布局**: `<n-space>` / `<n-grid>` / `<n-layout>` 组合布局
- **加载**: `<n-spin>` / `<n-skeleton>` 处理加载状态

### 主题变量参考
```css
/* 常用主题变量 */
var(--primary-color)      /* 主色 */
var(--info-color)         /* 信息色 */
var(--success-color)      /* 成功色 */
var(--warning-color)      /* 警告色 */
var(--error-color)        /* 错误色 */

var(--text-color)         /* 主文本色 */
var(--text-color-2)       /* 次要文本色 */
var(--text-color-3)       /* 辅助文本色 */

var(--body-color)         /* 背景色 */
var(--card-color)         /* 卡片背景色 */
var(--modal-color)        /* 模态框背景色 */

var(--border-color)       /* 边框色 */
var(--divider-color)      /* 分割线色 */

var(--box-shadow)         /* 阴影 */
var(--border-radius)      /* 圆角 */
```
