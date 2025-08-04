# Card 2.1 图标生成规则

## 图标设计原则

### 1. 统一风格
- **尺寸**: 20x20px
- **圆角**: 4px
- **背景**: 彩色矩形背景
- **前景**: 白色图标元素

### 2. 颜色方案
根据组件功能选择不同的主色调：

- **🔵 蓝色系 (#4F46E5)**: 数据访问、设备管理
- **🟢 绿色系 (#10B981)**: 数字显示、指标
- **🟡 橙色系 (#F59E0B)**: 多数据、测试
- **🔴 红色系 (#EF4444)**: 告警、错误
- **🟣 紫色系 (#8B5CF6)**: 高级功能、配置
- **⚫ 灰色系 (#6B7280)**: 基础组件、工具

### 3. 图标元素
- **简单几何图形**: 圆形、方形、三角形
- **线条**: 直线、曲线、箭头
- **文字**: 数字、字母（仅用于数字类组件）
- **组合**: 多个简单元素组合

## 生成模板

```typescript
// src/card2.1/components/your-component/icon.ts
export const YourComponentIcon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="20" height="20" rx="4" fill="#颜色代码"/>
  <!-- 图标内容 -->
</svg>`
```

## 组件图标示例

### 1. 设备总数 (Access)
- **颜色**: #4F46E5 (蓝色)
- **元素**: 下载箭头 + 圆圈
- **含义**: 数据访问、设备统计

### 2. 数字指示器 (DigitIndicator)
- **颜色**: #10B981 (绿色)
- **元素**: 数字"123"
- **含义**: 数值显示、指标

### 3. 多数据测试 (MultiDataTest)
- **颜色**: #F59E0B (橙色)
- **元素**: 三个连接的圆圈
- **含义**: 多数据源、网络连接

## 新组件图标生成指南

### 步骤1: 确定功能类别
根据组件的主要功能选择颜色：
- 数据类 → 蓝色
- 显示类 → 绿色
- 测试类 → 橙色
- 告警类 → 红色
- 配置类 → 紫色
- 工具类 → 灰色

### 步骤2: 设计图标元素
- 使用简单的几何图形
- 保持视觉平衡
- 确保在小尺寸下清晰可辨

### 步骤3: 实现SVG组件
```typescript
const NewComponentIcon = {
  name: 'NewComponentIcon',
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="20" height="20" rx="4" fill="#颜色代码"/>
      <!-- 自定义图标内容 -->
    </svg>
  `
}
```

### 步骤4: 应用到组件定义
```typescript
// src/card2.1/components/your-component/index.ts
import { YourComponentIcon } from './icon'

const componentDefinition: ComponentDefinition = {
  // ... 其他属性
  icon: YourComponentIcon,
  // ...
}
```

## 注意事项

1. **保持简洁**: 避免过于复杂的图案
2. **确保可读性**: 在小尺寸下仍然清晰
3. **一致性**: 保持整体设计风格统一
4. **语义化**: 图标应该能反映组件的功能
5. **可扩展性**: 考虑未来可能的功能扩展 