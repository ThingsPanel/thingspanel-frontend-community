# 开发检查清单 - ThingsPanel Frontend

> 🚨 **强制执行** - 每次开发任务必须完成此检查清单

本文档确保代码质量、架构一致性和项目规范的严格执行。

## 📋 开发前检查清单 (PRE-DEVELOPMENT)

### ✅ 架构理解确认
- [ ] **重新阅读 CLAUDE.md** - 理解项目整体架构和技术规范
- [ ] **查阅 PanelV2 架构文档** - 确认组件分离原则和渲染器架构
- [ ] **理解主题系统** - 确认如何集成 `useThemeStore` 和主题变量
- [ ] **确认国际化使用** - 所有用户可见文本使用 `$t()` 或 `useI18n()`

### ✅ 技术规范确认
- [ ] **工具栏分离原则** - 渲染器不得包含内置工具栏，使用分离的工具栏组件
- [ ] **主题系统集成** - 所有组件必须支持主题切换，使用主题变量
- [ ] **图标使用规范** - 必须使用 `@vicons/ionicons5`，图标名称需要 `Outline` 后缀
- [ ] **UI 组件库** - 必须使用 Naive UI 组件，不自行实现基础 UI 组件

### ✅ 环境检查
```bash
# 运行以下命令确保无错误
pnpm lint      # ESLint 检查
pnpm typecheck # TypeScript 类型检查
```
- [ ] **ESLint 检查通过** - 无语法错误和规范警告
- [ ] **TypeScript 检查通过** - 无类型错误，避免使用 `any`
- [ ] **依赖版本确认** - 使用项目已有的依赖版本

## 🔧 开发中检查清单 (DURING DEVELOPMENT)

### ✅ 每次文件修改后
- [ ] **即时语法检查** - 确保 CSS 属性完整正确（如 `justify-content: space-between`）
- [ ] **TypeScript 类型严格** - 定义明确的接口和类型，避免 `any`
- [ ] **组件命名规范** - PascalCase 组件名，camelCase 函数名
- [ ] **样式主题兼容** - 所有样式支持主题切换，使用 CSS 变量

### ✅ 每次功能实现后
- [ ] **架构一致性** - 功能实现符合既定的分层架构
- [ ] **避免重复实现** - 检查是否有现有组件或功能可以复用
- [ ] **性能影响评估** - 大量数据或复杂操作的性能考虑
- [ ] **错误处理完整** - 异常情况的处理和用户友好的错误提示

### ✅ 组件开发规范
```vue
<!-- ✅ 正确的 Vue 组件结构 -->
<script setup lang="ts">
// 1. 导入（类型导入使用 import type）
import type { ComponentProps } from './types'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'

// 2. 类型定义
interface Props {
  data: MyData[]
}

// 3. Props 和 Emits
const props = defineProps<Props>()
const emit = defineEmits<{
  update: [value: string]
}>()

// 4. 组合式函数
const { t } = useI18n()
const themeStore = useThemeStore()

// 5. 响应式状态
const state = ref('')
const computed = computed(() => themeStore.darkMode)
</script>

<template>
  <!-- 使用 Naive UI 组件和主题变量 -->
  <n-card :style="themeVars">
    <n-button @click="handleClick">{{ $t('common.confirm') }}</n-button>
  </n-card>
</template>
```

## 🔍 提交前检查清单 (PRE-COMMIT)

### ✅ 代码质量最终检查
```bash
# 必须全部通过
pnpm lint && pnpm typecheck
```
- [ ] **完整构建测试** - 运行 `pnpm build` 确保构建成功
- [ ] **手动功能测试** - 测试核心功能在不同场景下正常工作
- [ ] **浏览器控制台检查** - 无错误和警告信息
- [ ] **主题切换测试** - 在浅色/深色主题下样式正常

### ✅ 架构合规性最终确认
- [ ] **工具栏分离检查** - 渲染器组件不包含工具栏实现
- [ ] **主题系统集成** - 所有新组件正确使用主题变量
- [ ] **图标使用正确** - 所有图标来自 `@vicons/ionicons5` 且名称正确
- [ ] **国际化完整** - 所有用户可见文本已国际化

### ✅ 文件结构规范
```
渲染器目录必须遵循：
├── components/           # 内部组件（不包含工具栏）
├── composables/         # 业务逻辑 composables
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
├── adapters/           # 数据适配器
└── [RendererName]Renderer.vue  # 主组件（纯渲染）
```
- [ ] **目录结构符合规范** - 按照上述结构组织文件
- [ ] **职责分离明确** - 每个文件/目录职责单一明确
- [ ] **命名一致性** - 文件和目录命名遵循项目约定

## ❌ 严格禁止的行为

### 🚫 架构违规行为
- ❌ **在渲染器中实现工具栏** - 违反工具栏分离原则
- ❌ **重复实现现有功能** - 未检查现有组件就重新实现
- ❌ **忽略主题系统** - 硬编码颜色值，不支持主题切换
- ❌ **绕过类型检查** - 使用 `any` 类型或 `@ts-ignore`

### 🚫 代码质量问题
- ❌ **CSS 语法错误** - 如 `justify-between` 应为 `justify-content: space-between`
- ❌ **未使用 ESLint** - 提交包含 lint 错误的代码
- ❌ **图标使用错误** - 使用不存在的图标名称或错误的图标库
- ❌ **缺少国际化** - 硬编码中文文本而不使用翻译函数

## 🛠️ 常见错误修复指南

### CSS 样式错误
```css
/* ❌ 错误 */
.container {
  justify-between;
  align-items: center;
}

/* ✅ 正确 */
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

### 主题系统集成
```vue
<!-- ❌ 错误 - 硬编码颜色 -->
<template>
  <div style="background: #ffffff; color: #000000;">
    内容
  </div>
</template>

<!-- ✅ 正确 - 使用主题变量 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/store/modules/theme'

const themeStore = useThemeStore()
const themeVars = computed(() => ({
  '--bg-color': themeStore.darkMode ? '#1f2937' : '#ffffff',
  '--text-color': themeStore.darkMode ? '#f9fafb' : '#111827'
}))
</script>

<template>
  <div :style="themeVars" class="themed-container">
    内容
  </div>
</template>

<style scoped>
.themed-container {
  background: var(--bg-color);
  color: var(--text-color);
}
</style>
```

### 图标使用规范
```vue
<!-- ❌ 错误 - 图标名称不存在 -->
<script setup lang="ts">
import { AlignHorizontalCenter } from '@vicons/ionicons5' // 不存在
</script>

<!-- ✅ 正确 - 使用正确的图标名称 -->
<script setup lang="ts">
import { ArrowBackOutline, RemoveOutline } from '@vicons/ionicons5'
</script>
```

### 工具栏分离原则
```vue
<!-- ❌ 错误 - 渲染器中包含工具栏 -->
<template>
  <div class="renderer">
    <div class="toolbar">
      <n-button>保存</n-button>
      <n-button>重置</n-button>
    </div>
    <div class="content">
      <!-- 渲染内容 -->
    </div>
  </div>
</template>

<!-- ✅ 正确 - 纯渲染器实现 -->
<template>
  <div class="renderer">
    <!-- 只包含渲染逻辑，工具栏由独立组件实现 -->
    <div class="content">
      <!-- 渲染内容 -->
    </div>
  </div>
</template>
```

## 📊 质量评估标准

### 代码质量评分
- **A级 (90-100分)**: 完全符合所有规范，代码优雅，性能优异
- **B级 (80-89分)**: 基本符合规范，有少量可改进点
- **C级 (70-79分)**: 存在规范违规或质量问题，需要修复
- **D级 (0-69分)**: 严重违反规范，必须重写

### 必达标准
每次提交必须达到 **B级以上** 才允许合并，A级为理想标准。

## 🔄 持续改进机制

### 每日自检
- [ ] 回顾当天修改的代码是否符合规范
- [ ] 检查是否引入了技术债务
- [ ] 确认功能实现的性能影响

### 定期审查
- [ ] 每周回顾架构合规性
- [ ] 每月评估代码质量趋势
- [ ] 根据问题更新检查清单

---

**🎯 目标**: 通过严格执行此检查清单，确保代码质量持续改进，架构一致性得到保障，避免返工和技术债务。

**📝 记录**: 每次开发任务完成后，记录遇到的问题和解决方案，持续完善此检查清单。