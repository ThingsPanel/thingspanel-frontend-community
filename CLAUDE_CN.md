# CLAUDE_CN.md

本文件为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。

## 项目概述

ThingsPanel 是一个基于 Vue 3、TypeScript 和 Naive UI 构建的轻量级、组件化开源物联网应用支撑平台。该项目专注于通过可重用的插件和组件来减少开发工作量并加速物联网项目建设。

## 核心命令

### 开发
- `pnpm dev` 或 `npm run dev` - 在端口 5002 启动开发服务器
- `pnpm dev:test` - 启动测试环境开发服务器
- `pnpm dev:prod` - 启动生产环境开发服务器

### 构建和部署
- `pnpm build` - 生产环境构建并进行类型检查（需要 4GB 内存）
- `pnpm build:4096` - 生产环境构建并分配 8GB 内存
- `pnpm build:test` - 测试环境构建
- `pnpm typecheck` - 运行 TypeScript 类型检查（4GB 内存限制）

### 代码质量
- `pnpm lint` - 运行 ESLint 并自动修复
- `pnpm format` - 运行 Prettier 代码格式化
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
├── views/           # 页面组件（基于文件的路由）
├── components/      # 共享组件
│   ├── panelv2-clean/  # 新的清洁面板架构
│   ├── panelv2/        # 旧版面板系统
│   └── panel/          # 原始面板实现
├── layouts/         # 布局组件
├── store/modules/   # Pinia 存储模块
├── service/api/     # API 服务函数
├── hooks/           # Vue 组合式函数
├── card/            # 仪表板卡片组件
│   ├── builtin-card/   # 内置系统卡片
│   └── chart-card/     # 图表可视化卡片
├── utils/           # 工具函数
├── typings/         # TypeScript 类型定义
└── locales/         # i18n 翻译文件
```

### 面板系统架构

项目经历了多个面板系统架构的演进：

#### 1. PanelV2-Clean（最新架构）
- **位置**：`src/components/panelv2-clean/`
- **设计**：革命性的双层架构
  - **第一层**：纯基础设施层（UI 布局管理）
  - **第二层**：专业引擎层（专门化引擎）
- **关键组件**：
  - `PureLayoutManager.vue` - 纯 UI 布局管理器
  - `PureDataPipeline.ts` - 数据传输管道
  - `engines/` - 各种专门化引擎（节点、渲染、配置、工具等）
  - `renderers/` - 渲染引擎实现

#### 2. PanelV2（之前的架构）
- **位置**：`src/components/panelv2/`
- **特性**：基于画布的面板编辑器，带有检查器和侧边栏
- **组件**：画布、检查器、侧边栏、工具栏

#### 3. 旧版面板系统
- **位置**：`src/components/panel/`
- **用途**：原始面板管理系统

### 卡片系统
- **内置卡片**：系统指标、设备状态、告警（`src/card/builtin-card/`）
- **图表卡片**：可视化组件（`src/card/chart-card/`）
- **配置**：每个卡片都有用于设置的 `card-config.vue` 和用于渲染的 `component.vue`

## 开发指南

### 代码风格和约定
- **Vue 3**：专门使用组合式 API 与 `<script setup>` 语法
- **TypeScript**：启用严格模式，避免 `any` 类型，对仅类型导入使用 `import type`
- **命名**：组件使用 PascalCase，组合式函数/服务使用 camelCase
- **UI 组件**：使用 Naive UI 组件，按需导入
- **样式**：优先使用 UnoCSS 实用类而非自定义 CSS
- **状态**：使用 Pinia 存储管理全局状态，在 `src/store/modules/` 中定义
- **API**：在 `src/service/api/` 中定义 API 函数，严格类型化请求/响应
- **国际化**：始终使用 `$t()` 或 `useI18n()` 处理面向用户的文本

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

### 组件结构
```vue
<script setup lang="ts">
// 首先定义类型
interface Props {
  data: MyData[]
}

// Props 和 emits
const props = defineProps<Props>()
const emit = defineEmits<{
  update: [value: string]
}>()

// 组合式函数和响应式状态
const { loading, data } = useRequest(apiCall)
const state = reactive({ ... })

// 计算属性和监听器
const computed = computed(() => ...)
</script>

<template>
  <!-- 使用 Naive UI 组件和 UnoCSS 类 -->
  <n-card class="p-4 mb-4">
    <n-button @click="handleClick">{{ $t('common.confirm') }}</n-button>
  </n-card>
</template>
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

使用 `@elegant-router/vue` 与基于文件的路由：
- `src/views/` 中的页面组件自动生成路由
- 路由元数据可以在组件注释中定义
- 所有路由组件的懒加载：`component: () => import('@/views/MyPage.vue')`

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

### 预提交钩子
- TypeScript 类型检查（`pnpm typecheck`）
- 对暂存文件运行 ESLint 并自动修复
- 提交消息验证

### ESLint 配置
- 扁平配置格式（ESLint v9+）
- Vue 3 推荐规则
- TypeScript 推荐规则
- Prettier 集成
- 项目特定需求的自定义规则

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