# Card 2.1 图标测试指南

## 当前已生成的图标

### 1. 设备总数 (Access) - 蓝色图标
- **文件**: `src/card2.1/components/access/icon.ts`
- **颜色**: #4F46E5 (蓝色)
- **设计**: 下载箭头 + 圆圈
- **含义**: 数据访问、设备统计

```typescript
// src/card2.1/components/access/icon.ts
export const AccessIcon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="20" height="20" rx="4" fill="#4F46E5"/>
  <path d="M6 8L10 12L14 8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="10" cy="6" r="2" fill="white"/>
</svg>`
```

### 2. 数字指示器 (DigitIndicator) - 绿色图标
- **文件**: `src/card2.1/components/digit-indicator/icon.ts`
- **颜色**: #10B981 (绿色)
- **设计**: 数字"123"
- **含义**: 数值显示、指标

```typescript
// src/card2.1/components/digit-indicator/icon.ts
export const DigitIndicatorIcon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="20" height="20" rx="4" fill="#10B981"/>
  <text x="10" y="14" text-anchor="middle" fill="white" font-size="12" font-weight="bold">123</text>
</svg>`
```

### 3. 多数据测试 (MultiDataTest) - 橙色图标
- **文件**: `src/card2.1/components/multi-data-test/icon.ts`
- **颜色**: #F59E0B (橙色)
- **设计**: 三个连接的圆圈
- **含义**: 多数据源、网络连接

```typescript
// src/card2.1/components/multi-data-test/icon.ts
export const MultiDataTestIcon = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="20" height="20" rx="4" fill="#F59E0B"/>
  <circle cx="7" cy="7" r="2" fill="white"/>
  <circle cx="13" cy="7" r="2" fill="white"/>
  <circle cx="10" cy="13" r="2" fill="white"/>
  <path d="M7 7L13 7M7 7L10 13M13 7L10 13" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>`
```

## 测试步骤

### 1. 启动开发服务器
```bash
npm run dev
```

### 2. 访问Visual Editor
- 打开浏览器访问: `http://localhost:5003/`
- 进入可视化编辑器页面

### 3. 检查左侧组件库
- 点击左侧组件库面板
- 切换到"Card 2.1"标签页
- 应该能看到三个组件，每个都有对应的彩色图标

### 4. 验证图标显示
- **设备总数**: 蓝色背景，白色下载箭头和圆圈
- **数字指示器**: 绿色背景，白色数字"123"
- **多数据测试**: 橙色背景，三个白色圆圈和连接线

### 5. 测试拖拽功能
- 将组件拖拽到画布上
- 确认组件正常渲染
- 检查右侧属性面板是否正常显示

## 预期效果

### 组件库显示
```
Card 2.1 Tab:
  ┌─────────┐ ┌─────────┐ ┌─────────┐
  │ 🔵 设备 │ │ 🟢 数字 │ │ 🟡 多数据│
  │   总数  │ │ 指示器  │ │   测试  │
  └─────────┘ └─────────┘ └─────────┘
```

### 图标特点
- **尺寸**: 20x20px，在组件库中清晰可见
- **颜色**: 符合功能分类的颜色方案
- **设计**: 简洁明了，语义化强
- **一致性**: 统一的设计风格

## 故障排除

### 如果图标不显示
1. **检查控制台错误**: 查看浏览器控制台是否有错误信息
2. **检查组件注册**: 确认组件已正确注册到 `componentRegistry`
3. **检查类型定义**: 确认 `ComponentDefinition.icon` 支持 `string | Component`
4. **检查WidgetLibrary**: 确认 `WidgetLibrary.vue` 正确处理图标渲染

### 如果图标显示异常
1. **检查SVG语法**: 确认SVG代码语法正确
2. **检查颜色值**: 确认颜色代码格式正确
3. **检查尺寸**: 确认 `width="20" height="20"` 设置正确
4. **检查viewBox**: 确认 `viewBox="0 0 20 20"` 设置正确

## 成功标准

✅ **图标正确显示**: 三个组件都有对应的彩色图标
✅ **颜色符合规范**: 蓝色(数据)、绿色(显示)、橙色(测试)
✅ **设计简洁美观**: 图标清晰可辨，语义化强
✅ **功能正常**: 可以正常拖拽、配置、渲染
✅ **布局正确**: 一行显示3个组件，布局美观

## 下一步

图标测试通过后，可以：
1. 继续添加更多Card2.1组件
2. 按照图标生成规则为新组件设计图标
3. 完善组件功能和数据源配置
4. 优化用户体验和交互效果 