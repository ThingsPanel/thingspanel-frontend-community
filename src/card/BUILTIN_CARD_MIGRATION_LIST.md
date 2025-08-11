# Builtin Card 组件迁移清单

## 📋 概述
本文档详细列举了 `src/card/builtin-card` 文件夹中的所有组件，为迁移到Card 2.1系统提供参考。

## 🏷️ 组件分类

### 🎨 渐变背景统计卡片类 (可合并优化)
这类组件都使用相同的 `GradientBg` 组件，结构极其相似，**强烈建议合并为通用模板**。

#### 1. **access** - 设备总数卡片
- **文件**: `access/component.vue`
- **功能**: 显示设备总数统计
- **API**: `sumData()` / `totalNumber()`
- **特点**: 使用CountTo动画，支持权限判断
- **颜色**: 粉色渐变 `['#ec4786', '#b955a4']`
- **图标**: `ant-design:bar-chart-outlined`
- **问题**: ❌ 直接使用`$t()`而非`useI18n()` hook
- **迁移建议**: 可作为通用"数值统计卡片"模板

#### 2. **alarm-count** - 告警数量卡片
- **文件**: `alarm-count/component.vue`  
- **功能**: 显示告警数量统计
- **API**: 暂无具体API调用
- **特点**: 与access组件结构99%相同
- **颜色**: 红色渐变（推测，需要查看代码）
- **问题**: ❌ 可能缺少数据获取逻辑
- **迁移建议**: **可与access合并**为通用模板

#### 3. **cpu-usage** - CPU使用率卡片
- **文件**: `cpu-usage/component.vue`
- **功能**: 显示实时CPU使用率
- **API**: `getSystemMetricsCurrent()`
- **特点**: 30秒自动刷新，百分比显示
- **颜色**: 绿色渐变 `['#4ade80', '#22c55e']`
- **图标**: `fa-microchip`
- **问题**: ✅ 代码质量较好
- **迁移建议**: 可与其他系统指标合并

#### 4. **disk-usage** - 磁盘使用率卡片
- **文件**: `disk-usage/component.vue`
- **功能**: 显示磁盘使用率
- **API**: `getSystemMetricsCurrent()`
- **特点**: 与CPU使用率组件结构几乎相同
- **迁移建议**: **可与cpu-usage合并**为通用系统指标模板

#### 5. **memory-usage** - 内存使用率卡片
- **文件**: `memory-usage/component.vue`
- **功能**: 显示内存使用率
- **API**: `getSystemMetricsCurrent()`
- **特点**: 与CPU、磁盘使用率组件结构几乎相同
- **迁移建议**: **可与cpu-usage合并**为通用系统指标模板

#### 6. **news** - 新闻卡片
- **文件**: `news/component.vue`
- **功能**: 显示新闻或公告
- **特点**: 使用渐变背景展示文本信息
- **迁移建议**: 可作为通用"文本展示卡片"

#### 7. **off-line** - 离线设备数卡片
- **文件**: `off-line/component.vue`
- **功能**: 显示离线设备数量
- **特点**: 与online卡片成对出现
- **迁移建议**: **可与on-line合并**为设备状态统计模板

#### 8. **on-line** - 在线设备数卡片
- **文件**: `on-line/component.vue`
- **功能**: 显示在线设备数量
- **特点**: 与offline卡片成对出现
- **迁移建议**: **可与off-line合并**为设备状态统计模板

#### 9. **tenant-count** - 租户数量卡片
- **文件**: `tenant-count/component.vue`
- **功能**: 显示租户数量统计
- **特点**: 多租户系统专用
- **迁移建议**: 可归入通用统计卡片模板

### 📊 图表可视化类
#### 10. **online-trend** - 在线趋势图表
- **文件**: `online-trend/component.vue`
- **功能**: 显示设备在线/离线趋势图
- **技术**: ECharts 折线图，面积填充
- **API**: `getOnlineDeviceTrend()`
- **特点**: 实时数据，计算在线率百分比
- **问题**: ✅ 代码质量好，图表配置完整
- **迁移建议**: 可作为时间序列图表模板

#### 11. **tenant-chart** - 租户统计图表
- **文件**: `tenant-chart/component.vue`
- **功能**: 租户增长趋势柱状图 + 统计数字
- **技术**: ECharts 柱状图 + NStatistic
- **API**: `tenant()`
- **特点**: 左侧统计，右侧图表布局
- **问题**: ✅ 主题适配良好，响应式设计
- **迁移建议**: 可作为统计图表组合模板

#### 12. **system-metrics-history** - 系统指标历史图表
- **文件**: `system-metrics-history/component.vue`
- **功能**: CPU/内存/磁盘历史趋势
- **技术**: ECharts 多线图，面积填充
- **API**: `getSystemMetricsHistory()`
- **特点**: 三指标叠加，时间轴显示
- **问题**: ✅ 代码质量优秀，图表配置详细
- **迁移建议**: 系统监控专用，建议保留

### 📋 数据表格类
#### 13. **alarm-info** - 告警信息列表
- **文件**: `alarm-info/component.vue`
- **功能**: 显示最新告警信息列表
- **技术**: Naive UI DataTable
- **API**: `alarmHistory()`
- **特点**: 支持状态标签，时间格式化，可跳转详情
- **问题**: ✅ 代码规范，使用Naive UI组件
- **迁移建议**: 可作为数据列表模板

#### 14. **reported-data** - 上报数据信息
- **文件**: `reported-data/component.vue`
- **功能**: 显示设备上报数据（推测）
- **特点**: 数据展示类组件
- **迁移建议**: 需要具体查看代码确定功能

#### 15. **recently-visited** - 最近访问记录
- **文件**: `recently-visited/component.vue`
- **功能**: 显示用户最近访问的页面或设备
- **特点**: 历史记录类组件
- **迁移建议**: 用户行为分析相关

### 🔧 功能工具类
#### 16. **app-download** - 应用下载
- **文件**: `app-download/component.vue`
- **功能**: 展示应用下载二维码和商店链接
- **技术**: 静态图片展示
- **特点**: 简单的图片展示组件
- **问题**: ⚠️ 图片路径硬编码，缺少实际下载逻辑
- **迁移建议**: 简化为纯展示组件

#### 17. **version** - 版本信息
- **文件**: `version/component.vue`
- **功能**: 显示系统版本，检查更新
- **API**: `getSysVersion()` + GitHub API
- **特点**: 版本比较，GitHub集成
- **问题**: ✅ 功能完整，但有外部API依赖
- **迁移建议**: 系统信息类，建议保留

#### 18. **operation-guide-card** - 操作指南
- **文件**: `operation-guide-card/component.vue`
- **功能**: 动态操作指南列表
- **技术**: Naive UI List，支持角色权限
- **特点**: 可配置引导项，用户角色判断
- **问题**: ✅ 代码质量好，配置灵活
- **迁移建议**: 用户引导系统，建议保留并扩展

### ⚠️ 问题组件
#### 19. **information** - 信息展示 (废弃)
- **文件**: 仅存在 `information/poster.png`
- **状态**: ❌ 缺少component.vue，疑似废弃
- **迁移建议**: 可删除或补充实现

## 🔄 合并建议

### 1. 通用统计卡片模板 (高优先级)
**合并组件**: access, alarm-count, cpu-usage, disk-usage, memory-usage, off-line, on-line, tenant-count

**统一结构**:
```vue
<template>
  <GradientBg :start-color="config.startColor" :end-color="config.endColor">
    <h3>{{ config.title }}</h3>
    <div class="flex justify-between items-center pt-30px">
      <SvgIcon :icon="config.icon" />
      <CountTo 
        :prefix="config.prefix"
        :suffix="config.suffix" 
        :end-value="value" 
        :loading="loading"
      />
    </div>
  </GradientBg>
</template>
```

### 2. 系统监控组合模板
**合并组件**: cpu-usage, disk-usage, memory-usage, system-metrics-history
- 可提供单指标卡片和多指标图表两种模式

### 3. 图表组件标准化
**标准化**: online-trend, tenant-chart, system-metrics-history
- 统一ECharts配置
- 统一主题适配
- 统一数据格式

## ❌ 通用问题总结

### 代码质量问题
1. **国际化不一致**: 部分组件直接使用`$t()`，应统一使用`useI18n()` hook
2. **硬编码样式**: 部分组件颜色、尺寸硬编码，缺少主题适配
3. **错误处理不足**: 部分API调用缺少完整的错误处理
4. **重复代码**: gradient-bg组件被重复创建，应统一提取

### 架构问题
1. **组件粒度过细**: 功能相似的组件独立实现，造成代码重复
2. **配置不够灵活**: 大部分配置项硬编码，难以复用
3. **主题系统集成不完整**: 部分组件未完全适配暗色主题
4. **响应式支持不一致**: 不同组件响应式表现不一致

### 性能问题
1. **图片资源**: 部分组件使用PNG图片，建议转为SVG图标
2. **API轮询**: 部分组件使用定时器，需要优化生命周期管理
3. **ECharts配置**: 部分图表配置冗余，可以简化

## 🚀 迁移优先级

### 🔴 高优先级 (立即处理)
1. **统计卡片合并** - 减少90%重复代码
2. **gradient-bg组件统一** - 提取公共组件
3. **国际化规范化** - 统一使用useI18n hook

### 🟡 中优先级 (后续优化)
1. **图表组件标准化** - 统一ECharts配置和主题
2. **主题系统完善** - 确保所有组件支持暗色主题
3. **配置系统增强** - 提高组件可配置性

### 🟢 低优先级 (长期规划)
1. **功能组件优化** - operation-guide-card, version等功能增强
2. **新组件开发** - 根据业务需要开发新的Card 2.1组件
3. **性能优化** - 图标SVG化，API调用优化

## 📝 结论

现有builtin-card系统中有**19个组件**，其中：
- **9个渐变统计卡片**可合并为1-2个通用模板
- **3个图表组件**需要标准化处理  
- **5个功能组件**质量较好，可直接迁移
- **1个废弃组件**需要清理

通过合理的合并和重构，可以将代码量减少约**70%**，同时提高可维护性和一致性。