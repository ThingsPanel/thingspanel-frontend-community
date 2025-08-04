# Card2.1 - 全新架构

> 🎯 简洁、高效、易用的组件系统

## 🌟 设计原则

- **简洁至上**：只包含必要的功能，避免过度设计
- **渐进增强**：从最基础的功能开始，逐步扩展
- **易于理解**：代码结构清晰，文档完整
- **向后兼容**：与现有系统保持兼容

## 📁 目录结构

```
card2.1/
├── core/                 # 核心功能
│   ├── types.ts         # 类型定义
│   └── registry.ts      # 组件注册表
├── utils/               # 工具组件
│   └── ConfigProvider.vue  # 配置提供者
├── components/          # 组件库
│   └── text/           # 文本组件
│       ├── TextCard.vue     # 组件主体
│       ├── TextConfig.vue   # 配置界面
│       └── index.ts         # 组件注册
├── demo/               # 演示和测试
│   └── TextDemo.vue    # 文本组件演示
├── index.ts            # 主入口文件
└── README.md           # 说明文档
```

## 🚀 快速开始

### 1. 基础使用

```typescript
import { initCard21, registerCard } from '@/card2.1'

// 初始化系统
await initCard21()
```

### 2. 创建自定义组件

```typescript
import type { CardComponent } from '@/card2.1'

export const myComponent: CardComponent = {
  id: 'my-component',
  name: '我的组件',
  component: MyCard,        // 组件主体
  config: MyConfig,         // 配置界面（可选）
  poster: 'preview.png'     // 预览图（可选）
}

// 注册组件
registerCard(myComponent)
```

### 3. 使用配置提供者

```vue
<template>
  <ConfigProvider v-model:config="config">
    <component :is="cardComponent" />
  </ConfigProvider>
</template>

<script setup>
import { ConfigProvider } from '@/card2.1'

const config = ref({
  content: '文本内容',
  fontSize: 16
})
</script>
```

### 4. 创建配置界面

```vue
<script setup>
import { inject } from 'vue'
import type { ConfigContext } from '@/card2.1'

// 注入配置上下文
const ctx = inject<ConfigContext>('config-ctx')!
</script>

<template>
  <n-form>
    <n-form-item label="内容">
      <n-input v-model:value="ctx.config.content" />
    </n-form-item>
  </n-form>
</template>
```

## 🎨 现有组件

### Text 组件

简洁的文本显示组件，支持：

- ✅ 文本内容编辑
- ✅ 字体大小调整
- ✅ 颜色选择
- ✅ 文本对齐
- ✅ 字体粗细
- ✅ 行高设置
- ✅ 实时预览

## 🛠️ 开发指南

### 组件开发

1. **保持简洁**：组件只做一件事，做好一件事
2. **使用 TypeScript**：完整的类型支持
3. **响应式设计**：适配不同屏幕尺寸
4. **配置驱动**：所有可变内容都应该可配置

### 配置界面开发

1. **使用 Naive UI**：保持界面一致性
2. **实时预览**：配置变更立即生效
3. **合理默认值**：提供有意义的默认配置
4. **用户友好**：清晰的标签和说明

### 测试

每个组件都应该有对应的演示页面：

```vue
<!-- MyComponentDemo.vue -->
<template>
  <ConfigProvider v-model:config="config">
    <component :is="myComponent.component" />
  </ConfigProvider>
</template>
```

## 🎯 下一步计划

1. [ ] 添加更多基础组件（按钮、图片、图表等）
2. [ ] 完善文档和示例
3. [ ] 添加主题系统
4. [ ] 与 Visual Editor 集成
5. [ ] 性能优化

## 🔄 迁移说明

### 从旧 Card2.1 迁移

旧版本已备份到 `card2.1.backup/`，新版本API更简洁：

```typescript
// 旧版本
import componentRegistry from '@/card2.1'

// 新版本
import { cardRegistry } from '@/card2.1'
```

### 与原始 Panel 系统兼容

通过 ConfigProvider 可以与原始的配置系统无缝对接。

## 📝 贡献指南

1. 遵循现有的代码风格
2. 添加适当的类型注解
3. 编写清晰的文档
4. 创建演示页面
5. 保持向后兼容

---

> 🎉 **少即是多** - 这个新架构专注于核心功能，让开发变得更简单、更愉快！