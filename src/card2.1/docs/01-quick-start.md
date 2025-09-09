# 快速开始 - 5分钟创建第一个组件

本指南将带您在5分钟内创建一个功能完整的Card 2.1组件。

## 🎯 学习目标

- 理解Card 2.1组件的基本结构
- 创建并注册一个简单的组件
- 在Visual Editor中查看和测试组件

## 📁 组件文件结构

每个Card 2.1组件都采用**标准三文件结构**：

```
src/card2.1/components/你的分类/组件名称/
├── index.vue          # Vue组件实现
├── setting.vue        # 配置面板组件
├── settingConfig.ts   # 配置项定义
├── definition.ts      # 组件定义（核心）
└── index.ts          # 导出文件
```

## 🚀 创建第一个组件

### 步骤1: 创建组件目录

```bash
mkdir -p src/card2.1/components/test/my-first-card
cd src/card2.1/components/test/my-first-card
```

### 步骤2: 创建组件实现 (index.vue)

```vue
<template>
  <div class="my-first-card" :style="cardStyle">
    <div class="card-header">
      <h3>{{ config.title }}</h3>
    </div>
    <div class="card-content">
      <p class="message">{{ config.message }}</p>
      <div class="counter">
        计数器: {{ count }}
        <button @click="increment" class="btn">+1</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MyFirstCardConfig } from './settingConfig'

// Props定义 - 接收配置数据
interface Props {
  config?: MyFirstCardConfig
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    title: '我的第一个组件',
    message: 'Hello Card 2.1!',
    themeColor: '#2080f0',
    showCounter: true
  })
})

// 组件状态
const count = ref(0)
const increment = () => count.value++

// 样式计算
const cardStyle = computed(() => ({
  '--theme-color': props.config.themeColor,
  display: props.config.showCounter ? 'block' : 'none'
}))
</script>

<style scoped>
.my-first-card {
  border: 2px solid var(--theme-color);
  border-radius: 8px;
  padding: 16px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.card-header h3 {
  margin: 0 0 12px 0;
  color: var(--theme-color);
  font-size: 18px;
  font-weight: bold;
}

.card-content .message {
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
}

.counter {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

.btn {
  padding: 4px 12px;
  background: var(--theme-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn:hover {
  opacity: 0.8;
}
</style>
```

### 步骤3: 创建配置定义 (settingConfig.ts)

```typescript
/**
 * 我的第一个组件配置定义
 */

import type { Setting, CustomConfig } from '@/card2.1/types/setting-config'
import { createSetting, createCustomConfig, SettingControlType } from '@/card2.1/types/setting-config'

/**
 * 组件自定义配置接口
 */
export interface MyFirstCardCustomize {
  /** 组件标题 */
  title: string
  /** 消息内容 */
  message: string
  /** 主题颜色 */
  themeColor: string
  /** 是否显示计数器 */
  showCounter: boolean
}

/**
 * 组件完整配置接口
 */
export interface MyFirstCardConfig extends CustomConfig<MyFirstCardCustomize> {
  customize: MyFirstCardCustomize
}

/**
 * 配置项定义 - 定义配置面板显示的所有设置项
 */
export const myFirstCardSettingConfig: Setting[] = [
  // 基础配置组
  createSetting(SettingControlType.INPUT, '组件标题', 'customize.title', {
    group: '基础设置',
    placeholder: '请输入组件标题',
    defaultValue: '我的第一个组件'
  }),

  createSetting(SettingControlType.TEXTAREA, '消息内容', 'customize.message', {
    group: '基础设置',
    placeholder: '请输入要显示的消息',
    defaultValue: 'Hello Card 2.1!'
  }),

  // 样式配置组
  createSetting(SettingControlType.COLOR_PICKER, '主题颜色', 'customize.themeColor', {
    group: '样式设置',
    defaultValue: '#2080f0'
  }),

  createSetting(SettingControlType.SWITCH, '显示计数器', 'customize.showCounter', {
    group: '功能设置',
    defaultValue: true
  })
]

/**
 * 默认配置
 */
export const customConfig = createCustomConfig<MyFirstCardCustomize>({
  title: '我的第一个组件',
  message: 'Hello Card 2.1!',
  themeColor: '#2080f0',
  showCounter: true
})

// 导出类型
export type { MyFirstCardConfig, MyFirstCardCustomize }
```

### 步骤4: 创建配置面板 (setting.vue)

```vue
<template>
  <div class="my-first-card-setting">
    <!-- 使用自动表单生成器 -->
    <AutoFormGenerator 
      :model-value="modelValue"
      :setting-config="settingConfig"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import AutoFormGenerator from '../../core/AutoFormGenerator.vue'
import { myFirstCardSettingConfig } from './settingConfig'
import type { MyFirstCardConfig } from './settingConfig'

// Props和Events
interface Props {
  modelValue: MyFirstCardConfig
}

interface Emits {
  (e: 'update:modelValue', value: MyFirstCardConfig): void
}

defineProps<Props>()
defineEmits<Emits>()

// 配置项
const settingConfig = myFirstCardSettingConfig
</script>

<style scoped>
.my-first-card-setting {
  padding: 16px;
}
</style>
```

### 步骤5: 创建组件定义 (definition.ts)

```typescript
/**
 * 我的第一个组件定义
 */

import type { ComponentDefinition } from '../../../core/types'
import MyFirstCardComponent from './index.vue'
import MyFirstCardSetting from './setting.vue'
import { myFirstCardSettingConfig, customConfig, type MyFirstCardConfig } from './settingConfig'

/**
 * 组件定义 - Card 2.1系统的核心配置
 */
const myFirstCardDefinition: ComponentDefinition<MyFirstCardConfig> = {
  // ============ 基础信息 ============
  type: 'my-first-card',
  name: '我的第一个组件',
  description: '一个简单的演示组件，包含标题、消息和计数器功能',
  category: '数据展示',
  mainCategory: '测试', // 对应文件夹名称
  subCategory: '演示组件',
  icon: `<svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
  </svg>`,
  version: '1.0.0',
  author: 'ThingsPanel',

  // ============ 组件实现 ============
  component: MyFirstCardComponent,
  configComponent: MyFirstCardSetting,

  // ============ 默认配置 ============
  defaultConfig: customConfig,
  config: {
    type: 'my-first-card',
    root: {
      transform: {
        rotate: 0,
        scale: 1
      }
    },
    customize: customConfig
  },

  // ============ 布局配置 ============
  defaultLayout: {
    canvas: {
      width: 300,
      height: 200,
      x: 0,
      y: 0
    },
    gridstack: {
      w: 4,
      h: 3,
      x: 0,
      y: 0,
      minW: 2,
      minH: 2,
      maxW: 6,
      maxH: 4
    }
  },

  layout: {
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 6, height: 4 },
    resizable: true
  },

  // ============ 权限与标签 ============
  permission: '不限',
  tags: ['演示', '计数器', '交互', '基础'],

  // ============ 特性标记 ============
  features: {
    realtime: false,
    dataBinding: false,
    themeable: true,
    responsive: true,
    configurable: true
  },

  // ============ 交互能力 ============
  interaction: {
    capability: {
      supportedEvents: ['click', 'hover'],
      supportedActions: ['jump', 'modify'],
      defaultPermissions: {
        allowExternalControl: true,
        requirePermissionCheck: false
      },
      listenableProperties: ['title', 'message', 'themeColor', 'showCounter']
    },

    examples: [
      {
        name: '点击跳转示例',
        description: '点击组件时跳转到指定页面',
        scenario: 'click-jump',
        config: {
          event: 'click',
          responses: [{
            action: 'jump',
            jumpConfig: {
              jumpType: 'internal',
              url: '/dashboard',
              target: '_self'
            }
          }],
          enabled: true
        }
      }
    ]
  },

  // ============ 配置系统 ============
  settingConfig: myFirstCardSettingConfig
}

export default myFirstCardDefinition
```

### 步骤6: 创建导出文件 (index.ts)

```typescript
/**
 * 我的第一个组件导出
 */

// 导出组件定义
export { default } from './definition'

// 导出类型定义
export type { MyFirstCardConfig, MyFirstCardCustomize } from './settingConfig'
```

## 🎉 测试组件

### 1. 启动开发服务器

```bash
pnpm dev
```

### 2. 访问测试页面

打开浏览器访问: `http://localhost:5002/test/editor-integration`

### 3. 查看组件

1. 在左侧组件库中找到 **"测试"** 分类
2. 应该能看到 **"我的第一个组件"**
3. 拖拽组件到画布上
4. 选中组件，在右侧配置面板中修改配置
5. 观察组件实时更新

## ✅ 验收标准

组件创建成功的标志：

- [x] 组件出现在左侧组件库的"测试"分类中
- [x] 能够成功拖拽到画布上
- [x] 右侧配置面板显示所有设置项（基础设置、样式设置、功能设置）
- [x] 修改配置后组件实时更新
- [x] 计数器按钮可以正常工作
- [x] 主题颜色更改后样式立即生效

## 🚀 下一步

恭喜！您已经成功创建了第一个Card 2.1组件。接下来推荐学习：

1. [**组件架构**](./03-component-architecture.md) - 理解系统整体架构
2. [**数据源系统**](./06-data-sources.md) - 学习如何连接数据
3. [**示例库**](./19-examples.md) - 查看更多实际案例

## 🔧 常见问题

**Q: 组件没有出现在组件库中？**
A: 检查`mainCategory`是否与文件夹名称一致，确保为'测试'

**Q: 配置面板是空白的？**
A: 确保组件定义中包含`settingConfig`字段

**Q: 拖拽组件时报错？**
A: 检查`defaultLayout`配置是否正确设置

---

**🎊 恭喜您完成了第一个Card 2.1组件！**