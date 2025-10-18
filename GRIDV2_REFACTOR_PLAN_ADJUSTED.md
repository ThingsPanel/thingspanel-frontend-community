# GridV2 重构方案（结合使用链路）

本方案在确认使用链路后，针对列数可切换与间距可调两大诉求，结合 `src/components/common/gridv2/GRIDV2_ANALYSIS.md` 的根因结论，给出最小且稳定的整改计划。

## 使用链路（祖先 → 父 → 子）
- src/components/visual-editor/PanelEditor.vue: GridstackRenderer 的直接使用处（编辑器主入口）
- src/components/visual-editor/renderers/gridstack/GridstackRenderer.vue: 渲染器，向下传递 `gridConfig`
- src/components/visual-editor/renderers/gridstack/GridLayoutPlusWrapper.vue: 适配层，映射 store 节点到 `layout` 与 `config`，直接使用 GridV2
- src/components/common/gridv2/GridV2.vue: GridStack 封装组件（问题集中处）

## 改造目标
- 列数切换：稳定、无重叠、状态同步一致
- 间距调整：水平/垂直独立控制，与碰撞判定一致（不再通过 content padding 伪间距）

## 分层整改要点
1) GridV2（核心）
- 去除所有手动 `left/top/position:absolute` 同步与“自排版”逻辑；仅使用 GridStack 布局与样式（`styleInHead: true`）。
- 删除自定义列宽注入与 `gs-xx` 类清理；依赖官方 `.grid-stack.grid-stack-${n}` 机制。
- 选项映射：`column=colNum`，`cellHeight=rowHeight`，`preventCollision=config.preventCollision`，`staticGrid=readonly||config.staticGrid`。
- 间距：用 GridStack 原生 `margin`，将 `horizontalGap/verticalGap` 映射为字符串：`"${vGap}px ${hGap}px"`，不再用 content padding。
- 列数切换：监听 `config.colNum` → `grid.column(newCol, 'moveScale')`，必要时（开启压缩）再 `grid.compact()`；不写入内联定位、不手动遍历重排。
- 布局变更：仅监听 `change`，合并 `grid.getGridItems()` 的 `gridstackNode`，`emit('update:layout')`。

2) GridLayoutPlusWrapper.vue
- 保持 API 兼容：`v-model:layout`，`idKey` 透传。
- 配置映射：将 UI 侧的 `horizontalGap/verticalGap` 与 `colNum/rowHeight/preventCollision` 直传给 GridV2（见 src/components/visual-editor/renderers/gridstack/GridLayoutPlusWrapper.vue:1）。
- 避免因仅改列/间距而重建 `layout` 数组，防止无谓 remount；对只读字段改用就地更新策略。

3) GridstackRenderer.vue 与 PanelEditor(.vue/.vueV2)
- 延续现有链路，仅确保 `editorConfig.gridConfig` 包含：`colNum,rowHeight,horizontalGap,verticalGap,preventCollision,staticGrid`。
- 工具栏配置面板（RendererConfigDropdown.vue）已经提供列数与间距滑块，语义保持：`horizontalGap=水平间距, verticalGap=垂直间距`。

## 关键 API 与配置
- 列数切换：`grid.column(newCol, 'moveScale')`（保持相对宽度），必要时 `grid.compact()`。
- 间距：`options.margin = "${v}px ${h}px"`（GridStack 使用“垂直 水平”顺序）。
- 碰撞：`preventCollision: true` 可避免重叠；`staticGrid` 控制只读。

## 验收清单
- 12↔24↔36 列切换：无错位/重叠；相对宽度符合预期。
- 间距从 0→8→16 像素：可视与碰撞一致；拖拽命中正确。
- 删除/新增节点后：未出现“瞬移”；`change` 输出的布局与视觉一致。

如需，我可按本计划提交具体改造 PR（最小侵入，保持现有 Props/Emits 契约）。
