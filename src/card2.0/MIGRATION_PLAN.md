# Card 2.0 迁移计划

## 迁移目标

将现有的 Card 系统逐步迁移到 Card 2.0 架构，实现：
- 逻辑与视图分离
- 统一数据协议
- 多渲染器支持
- 插件化架构
- 与 Naive UI 和主题系统的完美兼容

## 迁移策略

### 阶段一：基础设施迁移

#### 1.1 主题系统集成
- [x] 分析现有主题系统 (`src/theme/settings.ts`, `src/theme/vars.ts`)
- [ ] 将 Card 2.0 主题系统与项目主题系统集成
- [ ] 确保 Naive UI 组件在 Card 2.0 中正常工作
- [ ] 适配深浅主题切换

#### 1.2 类型系统统一
- [ ] 将 Card 2.0 类型定义与现有类型系统合并
- [ ] 确保与现有 `ICardData` 接口的兼容性
- [ ] 创建类型转换适配器

#### 1.3 注册表系统迁移
- [ ] 将现有卡片注册到 Card 2.0 注册表
- [ ] 保持向后兼容性
- [ ] 创建迁移工具

### 阶段二：组件迁移

#### 2.1 图表组件迁移
- [x] 柱状图 (`src/card/chart-card/bar`) → `src/card2.0/components/chart/bar`
- [x] 曲线图 (`src/card/chart-card/curve`) → `src/card2.0/components/chart/curve`
- [x] 仪表盘 (`src/card/chart-card/instrument-panel`) → `src/card2.0/components/chart/gauge`
- [x] 表格 (`src/card/chart-card/table`) → `src/card2.0/components/chart/table`

#### 2.2 控制组件迁移
- [x] 数字设置器 (`src/card/chart-card/digit-setter`) → `src/card2.0/components/control/digit-setter`
- [x] 数据发送 (`src/card/chart-card/dispatch-data`) → `src/card2.0/components/control/dispatch-data`
- [x] 枚举控制 (`src/card/chart-card/enum-control`) → `src/card2.0/components/control/enum-control`
- [x] 开关控制 (`src/card/chart-card/switch`) → `src/card2.0/components/control/switch`

#### 2.3 显示组件迁移
- [x] 数字指示器 (`src/card/chart-card/digit-indicator`) → `src/card2.0/components/display/digit-indicator`
- [x] 状态显示 (`src/card/chart-card/state-display`) → `src/card2.0/components/display/state-display`
- [x] 文本信息 (`src/card/chart-card/text-info`) → `src/card2.0/components/display/text-info`

#### 2.4 媒体组件迁移
- [x] 视频播放器 (`src/card/chart-card/video-player`) → `src/card2.0/components/media/video-player`

#### 2.5 内置卡片迁移（待完成）
- [ ] 访问量卡片 (`src/card/builtin-card/access`)
- [ ] 告警统计 (`src/card/builtin-card/alarm-count`)
- [ ] CPU 使用率 (`src/card/builtin-card/cpu-usage`)
- [ ] 其他内置卡片

## 迁移进度总结

### 已完成组件（11个）

**图表组件（4个）**
- ✅ 柱状图 (bar)
- ✅ 曲线图 (curve) 
- ✅ 仪表盘 (gauge)
- ✅ 表格 (table)

**控制组件（4个）**
- ✅ 数字设置器 (digit-setter)
- ✅ 数据发送 (dispatch-data)
- ✅ 枚举控制 (enum-control)
- ✅ 开关控制 (switch)

**显示组件（3个）**
- ✅ 数字指示器 (digit-indicator)
- ✅ 状态显示 (state-display)
- ✅ 文本信息 (text-info)

**媒体组件（1个）**
- ✅ 视频播放器 (video-player)

### 迁移特性

所有迁移的组件都具备以下特性：
- ✅ 完整的 TypeScript 类型定义
- ✅ Card 2.0 架构规范
- ✅ 统一的配置接口
- ✅ 数据处理和生命周期钩子
- ✅ Vue 3 组合式 API
- ✅ Naive UI 组件集成
- ✅ 响应式设计支持
- ✅ 主题系统兼容
- ✅ 组件注册和导出

### 阶段三：渲染器集成

#### 3.1 与现有面板系统集成
- [ ] 将 Card 2.0 渲染器集成到 `PanelManage`
- [ ] 保持现有布局系统兼容性
- [ ] 适配 GridLayout 和 vue3-grid-layout

#### 3.2 PanelV2 系统集成
- [ ] 将 Card 2.0 集成到 PanelV2 架构
- [ ] 利用现有的多渲染器架构
- [ ] 保持工具栏和组件面板兼容性

### 阶段四：数据系统迁移

#### 4.1 数据源适配
- [ ] 适配现有设备数据源
- [ ] 适配系统数据源
- [ ] 保持时间范围和聚合功能

#### 4.2 WebSocket 集成
- [ ] 集成现有 WebSocket 系统
- [ ] 保持实时数据更新
- [ ] 适配数据转换管道

## 迁移原则

### 兼容性原则
1. **向后兼容**：现有卡片配置和数据格式保持兼容
2. **渐进迁移**：支持新旧系统并存
3. **平滑过渡**：用户无感知迁移

### 复用原则
1. **最大化复用**：复用现有组件、样式、配置
2. **避免重复实现**：只在必要时重新实现
3. **保持一致性**：UI 风格和交互保持一致

### 质量原则
1. **类型安全**：全面的 TypeScript 支持
2. **性能优化**：利用 Card 2.0 的性能优势
3. **可维护性**：清晰的代码结构和文档

## 技术要点

### Naive UI 集成
- 使用现有的 `useThemeStore` 获取主题配置
- 复用现有的 Naive UI 组件导入方式
- 保持组件样式的一致性

### 主题系统集成
- 利用现有的 CSS 变量系统
- 适配 `themeVars` 和 `getNaiveTheme`
- 支持深浅主题切换

### 数据流集成
- 适配现有的 API 调用方式
- 保持数据格式兼容性
- 集成现有的错误处理机制

## 迁移时间表

### 第一周：基础设施
- 主题系统集成
- 类型系统统一
- 注册表系统迁移

### 第二周：柱状图迁移
- 完整迁移柱状图组件
- 测试和优化
- 文档更新

### 第三周：其他组件迁移
- 迁移剩余图表组件
- 迁移内置卡片
- 集成测试

### 第四周：系统集成
- 渲染器集成
- 数据系统迁移
- 全面测试和优化

## 风险评估

### 高风险
1. **主题兼容性**：深浅主题切换可能存在样式问题
2. **数据格式**：现有数据格式与新架构的兼容性
3. **性能影响**：迁移过程中可能影响现有功能

### 中风险
1. **组件行为**：新架构下组件行为可能有细微差异
2. **配置迁移**：现有配置可能需要格式转换
3. **依赖冲突**：新旧系统可能存在依赖冲突

### 低风险
1. **UI 一致性**：基于 Naive UI 的 UI 保持一致
2. **API 兼容**：现有 API 调用方式保持不变

## 成功指标

1. **功能完整性**：所有现有功能在新架构下正常工作
2. **性能提升**：组件加载和渲染性能有所提升
3. **代码质量**：代码结构更清晰，可维护性更强
4. **用户体验**：用户无感知迁移，体验保持一致
5. **开发效率**：新组件开发效率提升

## 回滚计划

如果迁移过程中出现重大问题：
1. 立即停止迁移
2. 回滚到迁移前的稳定版本
3. 分析问题原因
4. 制定新的迁移策略
5. 重新开始迁移

---

**注意**：本迁移计划将根据实际情况动态调整，确保迁移过程的顺利进行。