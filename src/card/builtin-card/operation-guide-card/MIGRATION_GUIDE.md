# Operation Guide Card 组件迁移指南

## 📋 组件概述

### 基本信息
- **组件ID**: `operation-guide-card`
- **组件名称**: 操作指南卡片
- **功能**: 动态操作指南列表，支持角色权限区分
- **当前状态**: ✅ 代码质量优秀，功能完善

## 🔧 技术分析

### 核心功能
1. **角色权限判断**: 根据用户角色显示不同指南列表
2. **动态配置**: 通过card.config配置指南项
3. **国际化支持**: 使用titleKey和descriptionKey
4. **交互导航**: 支持页面跳转和外部链接
5. **响应式设计**: 移动端适配良好

### 技术亮点
- 使用Naive UI组件规范 (NList, NListItem, NThing)
- 完整的TypeScript类型定义
- 良好的错误处理和空状态显示
- 可配置的颜色系统

## ❌ 存在问题
1. **权限硬编码**: 直接读取localStorage，耦合度高
2. **配置复杂**: 需要同时配置guideList和guideListAdmin
3. **样式自定义**: CSS变量使用复杂

## 🔄 迁移建议

### 策略: 独立组件增强
保留为独立的指南组件，重点增强可配置性和易用性。

### 优化方向
1. **权限系统解耦**: 使用统一的权限管理
2. **配置简化**: 统一的指南配置格式
3. **模板预设**: 提供常用场景的预设配置
4. **可视化配置**: 支持拖拽式指南项管理

### 迁移复杂度: ⭐⭐⭐ (中等)

## 💡 Card 2.1 增强版本

```typescript
interface GuideCardConfig {
  title: string
  guides: Array<{
    id: string
    titleKey: string
    descriptionKey: string
    icon?: string
    link?: string
    requiredRoles?: string[]
    category?: string
  }>
  
  // 显示配置
  layout: 'list' | 'grid' | 'compact'
  showIcons: boolean
  showCategories: boolean
  
  // 权限配置
  roleBasedFilter: boolean
  defaultRole: string
}
```

### 预设配置示例
```typescript
export const systemAdminGuidePreset = {
  title: 'guide.systemAdmin.title',
  guides: [
    {
      id: 'user-management',
      titleKey: 'guide.userManagement.title',
      descriptionKey: 'guide.userManagement.desc', 
      icon: 'users-outline',
      link: '/system/user',
      requiredRoles: ['SYS_ADMIN'],
      category: 'system'
    },
    // ... 更多指南项
  ]
}
```

这个组件的迁移重点是提升配置灵活性和角色权限管理的规范性。