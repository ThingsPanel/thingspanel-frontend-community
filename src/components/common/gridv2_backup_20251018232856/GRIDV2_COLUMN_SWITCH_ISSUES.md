# GridV2 列数切换问题复盘（二次分析）

目标：定位“修改列数(colNum) 产生 Bug”的新原因，并给出可执行修复建议。

## 现象与影响
- 切换列数（如 12→24 或 24→36）时，布局闪动、位置短暂错乱，偶发回退到旧布局。
- 某些场景下出现重复的布局更新事件，导致状态抖动或覆盖最新结果。

## 根因定位
1) 双通道重复触发布局更新（事件风暴）
- `grid.column(newCol, 'moveScale')` 会触发 GridStack 的 `change` 事件；
- 组件内 `handleChange()` 会 emit 一次 `layout-change/update:layout`（src/components/common/gridv2/GridV2.vue:119）；
- `updateColumns()` 完成后又手动 emit 一次（src/components/common/gridv2/GridV2.vue:652-674）。
- 结果：一次列数切换 → 至少两次布局提交，和上层监听（Wrapper 的 watch）相互打架，表现为闪动/回退。

2) 与父层适配器的“配置变更 → 重新构造 layout”互相竞争
- `GridLayoutPlusWrapper.vue` 在 `props.gridConfig` 变化时会用 store 数据重建 `layout`（src/components/visual-editor/renderers/gridstack/GridLayoutPlusWrapper.vue:200-216）。
- 列数切换期间，GridV2 正在驱动布局变化、Wrapper 又按旧 store 值重建 layout，二者竞争导致短暂错乱或覆盖。

3) 仍保留了无效的样式注入路径
- 旧版 `injectColumnStyles(newCol)` 注入 `.gs-${n}` 选择器，与 GridStack `grid-stack-${n}` 机制不匹配，导致 >12 列宽度未正确计算。

4) 列数策略与业务期望未对齐
- 采用 `'moveScale'` 会按列比例缩放 `w/x`。如业务期望“保持网格单位 w 不变，只改变相对宽度”，则应使用 `'none'`；若期望“自适应填充”，才用 `'moveScale'`/`true`。

## 修复建议（最小侵入）
- 去掉 `updateColumns()` 内的 emit，统一由 `handleChange()` 输出布局；或在列数切换期间设置 `suspendChangeEvents` 标志屏蔽一次 `handleChange()`。
- 在 Wrapper 对 `gridConfig` 的 watch 中，特判 `colNum`：改列只更新配置，不重建 `layout` 数组（避免 remount/覆盖）。
- 移除 `injectColumnStyles()` 及 `.gs-${n}` 相关逻辑，完全依赖 `styleInHead: true` 与 `grid-stack-${n}`。
- 明确列数策略：
  - 若要保持 w 单位不变：`grid.column(newCol, 'none')`；
  - 若要随列数缩放：`'moveScale'`。与产品期望一致后再定。

## 实施记录
- [x] 移除 `updateColumns()` 内的显式 emit，改由 `change` 事件统一回写。
- [x] 替换早期 `.gs-xx` 注入为 `.grid-stack.grid-stack-${n}` 动态样式（覆盖 >12 列场景）。
- [x] Wrapper 不再在 `gridConfig` 变化时重建布局，仅同步拖拽/缩放属性，避免列切换期间的布局覆盖。
- [x] 间距改用 GridStack `margin` 管理，横纵向 gap 变更时重新初始化配置，取消 content padding 方案。

## 验收清单
- 连续切列（12↔24↔36）无闪动、无回退；布局仅提交一次，日志无重复事件。
- 改列后拖拽/缩放正常，`preventCollision` 生效；Wrapper 未重建 `layout` 导致的“瞬移”消失。
