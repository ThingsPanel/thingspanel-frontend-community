# Manual Test Checklist

> 从架构设计文档 v2.0 Step 6.1 提取，每次 Phase 迭代后使用。

---

## Track A: Widget Mode (物模型组件)

- [ ] **A1** ThingsPanel → 设备模板 → Web 图表配置 → 打开编辑器
  - 预期: Editor 加载成功
- [ ] **A2** 拖入一个图表组件
  - 预期: 组件渲染正常
- [ ] **A3** 修改组件属性
  - 预期: 属性面板实时反映变化
- [ ] **A4** 点击保存 → 检查 Console
  - 预期: 看到 `thingsvis:host-save`，**不应**看到 `PUT /api/v1/projects`
- [ ] **A5** 检查 Network Tab
  - 预期: 零 ThingsVis API 调用 (除了静态资源)
- [ ] **A6** 关闭编辑器 → 重新打开
  - 预期: 之前保存的组件恢复 (Host 管理数据)
- [ ] **A7** 推送实时数据 (如果有绑定)
  - 预期: 组件数值实时更新

## Track B: App Mode (可视化大屏)

- [ ] **B1** ThingsPanel → 可视化 → 新建大屏
  - 预期: Editor 加载成功
- [ ] **B2** 拖入多个组件
  - 预期: 组件渲染正常
- [ ] **B3** 等待 3 秒 (Auto-Save 触发)
  - 预期: Console 显示 Auto-Save completed
- [ ] **B4** 检查 Network Tab
  - 预期: 看到 `PUT /api/v1/projects/:id`
- [ ] **B5** 点击预览
  - 预期: 新标签页打开预览，渲染正确
- [ ] **B6** 点击发布
  - 预期: 发布成功提示
- [ ] **B7** 关闭 → 重新打开
  - 预期: 所有组件和配置恢复

## Track C: 独立运行 (ThingsVis Standalone)

- [ ] **C1** 直接打开 `localhost:3000`
  - 预期: 首页项目列表正常
- [ ] **C2** 不登录 → 新建项目
  - 预期: 使用 IndexedDB 保存
- [ ] **C3** 登录 → 新建项目
  - 预期: 使用 Cloud API 保存
- [ ] **C4** 所有工具栏按钮可用
  - 预期: 无 UI 残缺
- [ ] **C5** Undo/Redo 正常
  - 预期: 历史记录无异常

## Track D: 预览 (Viewer)

- [ ] **D1** ThingsPanel 首页 → 仪表板预览
  - 预期: ThingsVisViewer 加载，内容渲染正确
- [ ] **D2** Grid 布局仪表板
  - 预期: 正常渲染，自适应宽度
- [ ] **D3** Fixed 布局仪表板
  - 预期: 正常渲染，fullWidthPreview 生效
- [ ] **D4** 窗口缩放
  - 预期: 布局自适应，无截断

---

## Architecture Fitness Functions

| 检查项 | 规则 | 命令 |
|--------|------|------|
| Widget 无 Cloud API 导入 | `WidgetModeStrategy.ts` 不 import `cloudAdapter` | `grep -r "cloudAdapter" strategies/WidgetModeStrategy.ts` |
| AppMode 无 postMessage 发送 | `AppModeStrategy.ts` 不 import `embed-mode` | `grep -r "embed-mode" strategies/AppModeStrategy.ts` |
| Editor 行数 < 1000 | `EditorShell.tsx` 不超过 1000 行 | `wc -l components/EditorShell.tsx` |
| `isEmbedMode()` 调用次数 | `components/` 目录下 0 次 | `grep -rn "isEmbedMode" components/` |
