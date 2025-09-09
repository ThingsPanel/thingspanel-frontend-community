# 组件配置系统 - settingConfig 详解

组件配置系统是Card 2.1的核心功能之一，它让用户能够通过可视化界面配置组件的外观、行为和数据。

## 🎯 系统概述

### 配置系统架构
```
settingConfig.ts → AutoFormGenerator → 配置面板UI → 组件props更新
```

### 核心文件职责
- **settingConfig.ts**: 定义配置项和类型
- **setting.vue**: 配置面板组件
- **AutoFormGenerator**: 自动生成表单控件

## 📁 settingConfig.ts 文件结构

### 1. 基础结构
```typescript
/**
 * 组件配置定义文件
 */

import type { Setting, CustomConfig } from '@/card2.1/types/setting-config'
import { createSetting, createCustomConfig, SettingControlType } from '@/card2.1/types/setting-config'

// 1. 自定义配置接口
export interface MyComponentCustomize {
  title: string
  color: string
  // ...其他配置项
}

// 2. 完整配置接口
export interface MyComponentConfig extends CustomConfig<MyComponentCustomize> {
  customize: MyComponentCustomize
}

// 3. 配置项定义数组
export const myComponentSettingConfig: Setting[] = [
  // 配置项列表
]

// 4. 默认配置对象
export const customConfig = createCustomConfig<MyComponentCustomize>({
  title: '默认标题',
  color: '#2080f0'
})
```

## 🎨 配置控件类型详解

### 1. 基础输入控件

#### 文本输入 (INPUT)
```typescript
createSetting(SettingControlType.INPUT, '组件标题', 'customize.title', {
  group: '基础设置',                    // 配置分组
  placeholder: '请输入组件标题',         // 占位符
  defaultValue: '默认标题',             // 默认值
  maxLength: 50,                       // 最大长度（可选）
  validation: {                        // 验证规则（可选）
    required: true,
    pattern: '^[\\u4e00-\\u9fa5a-zA-Z0-9\\s]+$',
    message: '标题只能包含中文、英文和数字'
  }
})
```

#### 多行文本 (TEXTAREA)
```typescript
createSetting(SettingControlType.TEXTAREA, '详细描述', 'customize.description', {
  group: '内容设置',
  placeholder: '请输入详细描述...',
  defaultValue: '',
  rows: 4,                             // 显示行数
  maxLength: 500
})
```

#### 数字输入 (INPUT_NUMBER)
```typescript
createSetting(SettingControlType.INPUT_NUMBER, '数值大小', 'customize.size', {
  group: '样式设置',
  min: 0,                              // 最小值
  max: 100,                            // 最大值
  step: 1,                             // 步长
  defaultValue: 50,
  precision: 0                         // 小数位数
})
```

### 2. 选择控件

#### 下拉选择 (SELECT)
```typescript
createSetting(SettingControlType.SELECT, '图表类型', 'customize.chartType', {
  group: '图表设置',
  options: [                           // 选项列表
    { label: '折线图', value: 'line' },
    { label: '柱状图', value: 'bar' },
    { label: '饼图', value: 'pie' },
    { label: '散点图', value: 'scatter' }
  ],
  defaultValue: 'line',
  searchable: true                     // 是否支持搜索
})
```

#### 单选组 (RADIO_GROUP)
```typescript
createSetting(SettingControlType.RADIO_GROUP, '对齐方式', 'customize.align', {
  group: '布局设置',
  options: [
    { label: '左对齐', value: 'left' },
    { label: '居中', value: 'center' },
    { label: '右对齐', value: 'right' }
  ],
  defaultValue: 'center'
})
```

#### 多选框 (CHECKBOX_GROUP)
```typescript
createSetting(SettingControlType.CHECKBOX_GROUP, '显示元素', 'customize.showElements', {
  group: '显示设置',
  options: [
    { label: '标题', value: 'title' },
    { label: '图标', value: 'icon' },
    { label: '边框', value: 'border' },
    { label: '阴影', value: 'shadow' }
  ],
  defaultValue: ['title', 'icon']
})
```

### 3. 开关控件

#### 开关 (SWITCH)
```typescript
createSetting(SettingControlType.SWITCH, '启用动画', 'customize.enableAnimation', {
  group: '动画设置',
  defaultValue: true,
  checkedText: '开启',                 // 开启状态文本
  uncheckedText: '关闭'                // 关闭状态文本
})
```

### 4. 颜色和样式控件

#### 颜色选择器 (COLOR_PICKER)
```typescript
createSetting(SettingControlType.COLOR_PICKER, '主题色', 'customize.primaryColor', {
  group: '颜色设置',
  defaultValue: '#2080f0',
  showAlpha: true,                     // 是否显示透明度
  presetColors: [                      // 预设颜色
    '#2080f0', '#18a058', '#f0a020', '#d03050'
  ]
})
```

#### 滑块 (SLIDER)
```typescript
createSetting(SettingControlType.SLIDER, '透明度', 'customize.opacity', {
  group: '样式设置',
  min: 0,
  max: 1,
  step: 0.1,
  defaultValue: 1,
  marks: {                             // 标记点
    0: '透明',
    0.5: '半透明', 
    1: '不透明'
  }
})
```

### 5. 高级控件

#### 动态标签 (DYNAMIC_TAGS)
```typescript
createSetting(SettingControlType.DYNAMIC_TAGS, '数据字段', 'customize.dataFields', {
  group: '数据配置',
  placeholder: '输入字段名后回车',
  defaultValue: ['temperature', 'humidity'],
  maxTags: 10,                         // 最大标签数量
  allowDuplicates: false               // 是否允许重复
})
```

#### 代码编辑器 (CODE_EDITOR)
```typescript
createSetting(SettingControlType.CODE_EDITOR, '自定义脚本', 'customize.customScript', {
  group: '高级设置',
  language: 'javascript',              // 语言类型
  theme: 'vs-dark',                   // 编辑器主题
  height: 200,                        // 编辑器高度
  defaultValue: `
function processData(data) {
  return data.map(item => ({
    ...item,
    processed: true
  }));
}
  `.trim()
})
```

## 🏗️ 配置分组管理

### 分组策略
```typescript
export const settingConfig: Setting[] = [
  // 基础配置组
  createSetting(SettingControlType.INPUT, '标题', 'customize.title', {
    group: '基础设置'
  }),
  
  // 数据配置组
  createSetting(SettingControlType.SELECT, '数据源', 'customize.dataSource', {
    group: '数据设置'
  }),
  
  // 样式配置组
  createSetting(SettingControlType.COLOR_PICKER, '背景色', 'customize.backgroundColor', {
    group: '样式设置'
  }),
  
  // 高级配置组
  createSetting(SettingControlType.CODE_EDITOR, '脚本', 'customize.script', {
    group: '高级设置'
  })
]
```

### 分组显示效果
配置面板会自动按分组显示：
```
┌─ 基础设置 ─────────┐
│ 标题: [输入框]     │
│ 描述: [文本域]     │
└─────────────────┘

┌─ 数据设置 ─────────┐
│ 数据源: [下拉选择] │
│ 刷新间隔: [数字]   │
└─────────────────┘

┌─ 样式设置 ─────────┐
│ 背景色: [颜色选择] │
│ 字体大小: [滑块]   │
└─────────────────┘
```

## 🔧 setting.vue 配置面板

### 基础版本（推荐）
```vue
<template>
  <div class="component-setting">
    <AutoFormGenerator 
      :model-value="modelValue"
      :setting-config="settingConfig"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import AutoFormGenerator from '../../core/AutoFormGenerator.vue'
import { componentSettingConfig } from './settingConfig'
import type { ComponentConfig } from './settingConfig'

interface Props {
  modelValue: ComponentConfig
}

interface Emits {
  (e: 'update:modelValue', value: ComponentConfig): void
}

defineProps<Props>()
defineEmits<Emits>()

const settingConfig = componentSettingConfig
</script>
```

### 自定义版本
```vue
<template>
  <div class="custom-component-setting">
    <!-- 自动生成的基础配置 -->
    <AutoFormGenerator 
      :model-value="modelValue"
      :setting-config="basicSettings"
      @update:model-value="handleBasicUpdate"
    />
    
    <!-- 自定义高级配置 -->
    <n-divider>高级配置</n-divider>
    
    <div class="custom-section">
      <n-form-item label="自定义颜色配置">
        <n-color-picker 
          v-model:value="customColor"
          show-alpha
          @update:value="handleColorChange"
        />
      </n-form-item>
      
      <n-form-item label="预览图片">
        <n-upload
          :file-list="fileList"
          @change="handleImageUpload"
          list-type="image-card"
          :max="1"
        >
          点击上传
        </n-upload>
      </n-form-item>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AutoFormGenerator from '../../core/AutoFormGenerator.vue'
import { componentSettingConfig } from './settingConfig'

// Props和事件定义...

// 分离基础配置和自定义配置
const basicSettings = componentSettingConfig.filter(item => 
  item.group !== '高级设置'
)

const customColor = ref('#ffffff')
const fileList = ref([])

// 处理配置更新
const handleBasicUpdate = (newValue) => {
  emit('update:modelValue', newValue)
}

const handleColorChange = (color) => {
  emit('update:modelValue', {
    ...props.modelValue,
    customize: {
      ...props.modelValue.customize,
      customColor: color
    }
  })
}
</script>
```

## 🎛️ 高级配置技巧

### 1. 条件显示配置项
```typescript
createSetting(SettingControlType.SWITCH, '启用图表', 'customize.enableChart', {
  group: '功能设置',
  defaultValue: false
}),

createSetting(SettingControlType.SELECT, '图表类型', 'customize.chartType', {
  group: '功能设置',
  options: [
    { label: '折线图', value: 'line' },
    { label: '柱状图', value: 'bar' }
  ],
  defaultValue: 'line',
  // 条件显示：只有启用图表时才显示
  condition: 'customize.enableChart === true'
})
```

### 2. 联动配置项
```typescript
// 在setting.vue中实现联动
<script setup lang="ts">
import { watch } from 'vue'

// 监听配置变化，实现联动效果
watch(() => props.modelValue.customize.chartType, (newType) => {
  if (newType === 'pie') {
    // 饼图模式下自动隐藏某些选项
    emit('update:modelValue', {
      ...props.modelValue,
      customize: {
        ...props.modelValue.customize,
        showAxis: false,
        showGrid: false
      }
    })
  }
})
</script>
```

### 3. 验证和错误处理
```typescript
createSetting(SettingControlType.INPUT_NUMBER, '端口号', 'customize.port', {
  group: '连接设置',
  min: 1,
  max: 65535,
  defaultValue: 8080,
  validation: {
    required: true,
    custom: (value) => {
      if (value < 1024) {
        return '建议使用1024以上的端口号'
      }
      if ([3000, 5000, 8000].includes(value)) {
        return '该端口可能已被占用'
      }
      return null
    }
  }
})
```

## 🔄 配置数据流

### 1. 配置更新流程
```
用户操作配置面板 → setting.vue接收事件 → 触发update:modelValue → 
definition接收新配置 → 组件props更新 → 组件重新渲染
```

### 2. 配置持久化
```typescript
// 配置会自动保存到Visual Editor的状态中
// 并在页面刷新后恢复
const componentState = {
  id: 'comp-123',
  type: 'my-component',
  config: {
    customize: {
      title: '用户设置的标题',
      color: '#ff6600'
    }
  },
  layout: { /* 布局信息 */ }
}
```

## ✅ 配置系统最佳实践

### 1. 配置项设计原则
- **分组合理**: 相关配置放在同一组
- **命名清晰**: 使用用户友好的标签
- **默认合理**: 提供合适的默认值
- **验证完整**: 添加必要的验证规则

### 2. 性能优化
- **按需加载**: 复杂配置项延迟初始化
- **防抖处理**: 对频繁变化的配置进行防抖
- **局部更新**: 只更新变化的配置项

### 3. 用户体验
- **即时预览**: 配置变化立即在组件中体现
- **智能提示**: 提供有用的placeholder和help文本
- **错误友好**: 显示清晰的错误信息和建议

## 🚨 常见问题解决

### 问题1: 配置面板空白
**原因**: definition.ts中缺少settingConfig引用
**解决**: 确保在定义中包含settingConfig字段

### 问题2: 配置项不显示
**原因**: group名称拼写错误或配置项语法错误
**解决**: 检查createSetting语法和group名称

### 问题3: 配置变化不生效
**原因**: 组件props定义与配置路径不匹配
**解决**: 确保props接口与customize接口一致

## 🔗 相关文档

- [组件定义详解](./04-component-definition.md)
- [属性暴露系统](./07-property-exposure.md)
- [API参考](./18-api-reference.md)

---

**强大的配置系统让组件更加灵活易用！** ⚙️