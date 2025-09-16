# 统一配置架构重构方案

## 🎯 核心架构原则

### 1. 统一存储原则
- **核心思想**: 所有配置以卡片组件ID为基础存储
- **存储位置**: 卡片层（useCard2Props管理的unifiedConfig）
- **避免问题**: 配置管理的各自为政，数据同步混乱

### 2. 卡片层配置管理
- **数据仓库**: 卡片层是配置的唯一数据源
- **配置组织**: 以组件ID为key，统一管理四层配置
- **数据流向**: 编辑器面板 ↔ 卡片层配置仓库

### 3. 编辑器显示分离
- **职责定义**: 编辑器右侧面板只是配置的UI显示界面
- **不存储数据**: 编辑器不维护自己的配置状态
- **双向绑定**: 显示卡片层配置，修改同步回卡片层

## 🏗️ 配置分层结构设计

```typescript
// 统一配置存储结构
const unifiedConfig: Record<string, UnifiedCard2Configuration> = {
  [componentId]: {
    // 基础配置层 - 通用配置，完全可解耦
    base: {
      // 设备绑定配置（最高优先级）
      deviceId: string,           // 设备ID
      metricsList: MetricItem[],  // 设备指标列表
      
      // UI样式配置
      title: string,              // 组件标题
      showTitle: boolean,         // 显示标题
      visible: boolean,           // 可见性
      opacity: number,            // 透明度
      backgroundColor: string,    // 背景色
      borderWidth: number,        // 边框
      borderColor: string,
      borderStyle: string,
      borderRadius: number,
      padding: SpacingConfig,     // 内边距
      margin: SpacingConfig       // 外边距
    },
    
    // 组件配置层 - 组件特有属性，暂时不解耦
    component: {
      // 来自各组件的 settingConfig.ts
      // 例如: alert-status 的 title, amount, description
      // 例如: simple-chart 的图表配置等
      [key: string]: any
    },
    
    // 数据源配置层 - 通用配置，完全可解耦
    dataSource: {
      // 数据绑定和来源配置
      // 基于 base.deviceId 和 base.metricsList 自动生成
      [key: string]: any
    },
    
    // 交互配置层 - 通用配置，完全可解耦
    interaction: {
      // 组件间交互和行为配置
      [key: string]: any
    }
  }
}
```

## 📊 基础配置特性分析

### 通用性特征
- **所有组件共享**: 设备ID、设备指标、标题、样式、布局等
- **与settingConfig无关**: settingConfig只管理组件特有的自定义属性
- **可完全解耦**: 类似数据源和交互配置，基础配置是通用的

### 优先级结构
1. **最高优先级**: 设备ID、设备指标（业务核心配置）
2. **第二优先级**: 标题、可见性等UI基础配置
3. **第三优先级**: 样式配置（颜色、边框、间距等）

### 配置流向关系
```
用户操作编辑器面板 
    ↓
配置变更事件
    ↓
useCard2Props.updateConfig('base', newConfig)
    ↓
卡片层 unifiedConfig 更新
    ↓
组件 displayData 自动更新
    ↓
组件重新渲染
```

## 🚀 分阶段实施计划

### 阶段一: 基础配置统一存储架构
1. **完善 useCard2Props 基础配置处理**
   - 确保正确处理 base 配置层的所有字段
   - 重点验证 deviceId 和 metricsList 的数据流
   - 修复配置更新和同步逻辑

2. **修复 BaseConfigForm 数据同步**
   - 确保表单修改正确传递到卡片层
   - 验证配置持久化机制
   - 优化设备配置的UI显示和验证

### 阶段二: 编辑器面板重建
1. **ConfigurationPanel 重新实现**
   - 基于卡片层配置数据重建面板
   - 实现配置的双向绑定显示
   - 移除面板自身的配置状态管理

2. **Card2Wrapper 配置集成**
   - 恢复完整的配置管理功能
   - 确保配置变更的正确传播
   - 集成统一配置架构

## ⚠️ 关键注意事项

### 架构坚持要点
1. **配置存储统一性**: 所有配置必须存储在卡片层，以组件ID为基础
2. **基础配置通用性**: 基础配置对所有组件通用，不在 settingConfig 中定义
3. **数据流单向性**: 编辑器 → 卡片层，避免双向数据流的混乱

### 易跑偏的地方
1. **不要在 settingConfig 中定义基础配置**
2. **不要让编辑器面板维护自己的配置状态**
3. **不要跳过基础配置直接处理数据源配置**

---
**文档目的**: 防止开发过程中方向跑偏，确保架构重构的一致性和正确性
**更新时间**: 2025-09-14