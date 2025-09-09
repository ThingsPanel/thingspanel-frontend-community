# 开发环境配置与工具 - Card 2.1 开发环境搭建

本章介绍Card 2.1组件开发所需的开发环境配置、开发工具和调试方法。

## 🛠️ 开发环境要求

### 系统要求
- **Node.js**: 版本 >= 16.0.0
- **pnpm**: 版本 >= 8.0.0（推荐包管理器）
- **操作系统**: Windows/macOS/Linux
- **内存**: 建议 8GB 以上（构建需要大量内存）

### 浏览器要求
- **Chrome**: >= 90（推荐，最佳开发体验）
- **Firefox**: >= 88
- **Safari**: >= 14
- **Edge**: >= 90

## 📦 项目初始化

### 1. 克隆项目
```bash
git clone <项目地址>
cd thingspanel-frontend-community
```

### 2. 安装依赖
```bash
# 使用pnpm安装依赖（推荐）
pnpm install

# 或使用npm
npm install
```

### 3. 启动开发服务器
```bash
# 启动开发服务器（端口5002）
pnpm dev

# 启动测试环境服务器
pnpm dev:test
```

### 4. 验证环境
访问 `http://localhost:5002` 确认项目正常运行。

## 🔧 IDE配置建议

### VS Code推荐插件
```json
{
  "recommendations": [
    "vue.volar",              // Vue 3支持
    "vue.vscode-typescript-vue-plugin", // Vue TS支持
    "bradlc.vscode-tailwindcss",        // UnoCSS智能提示
    "esbenp.prettier-vscode",           // 代码格式化
    "dbaeumer.vscode-eslint",           // ESLint集成
    "antfu.iconify",                    // 图标预览
    "antfu.unocss",                     // UnoCSS语法高亮
    "ms-vscode.vscode-typescript-next"   // TypeScript支持
  ]
}
```

### VS Code设置建议
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "vue.codeActions.enabled": true,
  "[vue]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### WebStorm配置
- 启用Vue.js插件
- 配置ESLint自动修复
- 启用TypeScript严格模式检查
- 配置Prettier代码格式化

## 🏗️ 开发工作区配置

### 目录结构理解
```
thingspanel-frontend-community/
├── src/
│   ├── card2.1/                    # Card 2.1系统
│   │   ├── components/             # 组件实现目录
│   │   │   ├── test/              # 测试组件
│   │   │   ├── dashboard/         # 仪表盘组件
│   │   │   └── device/            # 设备组件
│   │   ├── core/                  # 核心系统
│   │   ├── hooks/                 # 自定义Hook
│   │   ├── types/                 # 类型定义
│   │   └── docs/                  # 文档目录
│   ├── components/visual-editor/   # Visual Editor
│   └── views/                     # 页面视图
├── packages/                       # 内部包
└── docs/                          # 项目文档
```

### 开发热重载配置
项目已配置Vite热重载，支持：
- **Vue SFC热重载** - 修改.vue文件立即生效
- **TypeScript热更新** - 修改.ts文件自动重新编译
- **CSS热更新** - 修改样式文件立即应用
- **配置文件监听** - 修改定义文件自动重新注册

## 🎯 开发工具集成

### 1. 组件开发测试页面
```bash
# 访问测试页面
http://localhost:5002/test/panel-editor-v2
```

**功能特性：**
- 实时预览组件效果
- 测试数据源配置
- 验证交互功能
- 调试布局问题

### 2. 数据绑定系统测试
```bash
# 访问数据绑定测试页面
http://localhost:5002/test/data-binding-system-integration
```

**功能特性：**
- 测试多数据源配置
- 验证数据转换逻辑
- 调试响应式更新
- 检查字段映射

### 3. 组件注册调试
```bash
# 访问自动注册测试页面
http://localhost:5002/test/auto-registry-test
```

**功能特性：**
- 查看组件注册状态
- 调试分类映射
- 验证组件定义
- 检查配置完整性

## 🔍 调试工具配置

### 1. Vue DevTools配置
```bash
# 安装Vue DevTools浏览器扩展
# Chrome: https://chrome.google.com/webstore/detail/vuejs-devtools
# Firefox: https://addons.mozilla.org/firefox/addon/vue-js-devtools/
```

**使用技巧：**
- 查看组件树结构
- 监听Props和Events
- 调试Pinia状态管理
- 检查性能问题

### 2. 浏览器开发者工具
```javascript
// 在浏览器控制台中调试Card2.1组件
window.__CARD2_DEBUG__ = true

// 查看已注册组件
console.log(window.__CARD2_REGISTRY__)

// 查看组件状态
console.log(window.__CARD2_COMPONENT_STATES__)
```

### 3. ESLint和TypeScript检查
```bash
# 运行ESLint检查
pnpm lint

# 运行TypeScript类型检查
pnpm typecheck

# 运行完整质量检查
pnpm quality-check
```

## 🚀 开发服务器配置

### 端口配置
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5002,           // 开发服务器端口
    host: '0.0.0.0',      // 允许外部访问
    open: false,          // 不自动打开浏览器
    hmr: {
      port: 5003          // HMR端口
    }
  },
  preview: {
    port: 9725            // 预览服务器端口
  }
})
```

### 代理配置
```typescript
// 开发环境API代理配置
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true
      }
    }
  }
})
```

## 📝 代码片段和模板

### VS Code代码片段配置
```json
{
  "Card2.1 Component Definition": {
    "prefix": "card2-definition",
    "body": [
      "import type { ComponentDefinition } from '../../../core/types'",
      "import ${1:ComponentName}Vue from './index.vue'",
      "import ${1:ComponentName}Setting from './setting.vue'",
      "import { ${2:settingConfig}, customConfig } from './settingConfig'",
      "",
      "const definition: ComponentDefinition = {",
      "  type: '${3:component-type}',",
      "  name: '${4:组件名称}',",
      "  description: '${5:组件描述}',",
      "  mainCategory: '${6:test}',",
      "  component: ${1:ComponentName}Vue,",
      "  configComponent: ${1:ComponentName}Setting,",
      "  settingConfig: ${2:settingConfig},",
      "  config: {",
      "    type: '${3:component-type}',",
      "    customize: customConfig",
      "  },",
      "  defaultLayout: {",
      "    canvas: { width: 300, height: 200, x: 0, y: 0 },",
      "    gridstack: { w: 4, h: 3, x: 0, y: 0 }",
      "  }",
      "}",
      "",
      "export default definition"
    ]
  },
  
  "Card2.1 Setting Config": {
    "prefix": "card2-setting",
    "body": [
      "import { createSetting, SettingControlType } from '../../../core/setting-utils'",
      "",
      "export const ${1:componentName}SettingConfig = [",
      "  createSetting(SettingControlType.INPUT, '${2:标题}', 'customize.${3:title}', {",
      "    group: '${4:基础设置}',",
      "    defaultValue: '${5:默认值}'",
      "  })",
      "]",
      "",
      "export const customConfig = {",
      "  ${3:title}: '${5:默认值}'",
      "}"
    ]
  }
}
```

## 🎨 开发主题配置

### 主题切换测试
开发时需要测试明暗主题兼容性：

```vue
<template>
  <div class="dev-theme-switcher">
    <n-button @click="toggleTheme">
      {{ isDark ? '切换到浅色' : '切换到深色' }}
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/store/modules/theme'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.darkMode)

const toggleTheme = () => {
  themeStore.setDarkMode(!themeStore.darkMode)
}
</script>
```

### CSS变量调试
```css
/* 在开发工具中检查CSS变量 */
:root {
  --primary-color: #2080f0;
  --text-color: #333333;
  --card-color: #ffffff;
  --border-color: #e0e0e6;
}

[data-theme="dark"] {
  --text-color: #ffffffd1;
  --card-color: #18181c;
  --border-color: #333333;
}
```

## 📊 性能监控

### 开发模式性能检查
```javascript
// 在开发模式下启用性能监控
if (import.meta.env.DEV) {
  // 组件渲染性能监控
  const observer = new PerformanceObserver((list) => {
    console.log('组件性能:', list.getEntries())
  })
  observer.observe({ entryTypes: ['measure'] })
}
```

### 内存使用监控
```bash
# 构建时内存监控
NODE_OPTIONS="--max-old-space-size=8192" pnpm build

# 开发服务器内存监控
NODE_OPTIONS="--max-old-space-size=4096" pnpm dev
```

## 🚨 常见问题解决

### 1. 热重载不工作
```bash
# 清除缓存并重启
rm -rf node_modules/.vite
pnpm dev
```

### 2. TypeScript类型错误
```bash
# 重新生成类型文件
pnpm typecheck
npx tsc --noEmit
```

### 3. 组件不显示在库中
- 检查组件definition.ts是否正确
- 确认mainCategory与文件夹名匹配
- 验证组件是否正确注册

### 4. 配置面板空白
- 检查settingConfig是否导入
- 确认配置项语法正确
- 验证AutoFormGenerator组件

## 🔗 相关资源

- [快速开始](./01-quick-start.md) - 创建第一个组件
- [组件架构](./03-component-architecture.md) - 了解系统架构
- [调试工具](./15-debugging-tools.md) - 深入调试技巧
- [最佳实践](./17-best-practices.md) - 开发规范

---

**良好的开发环境是高效开发的基础！** 🛠️