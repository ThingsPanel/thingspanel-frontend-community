# GridV2 重构方案（列数切换 + 间距可调）

结论：保留并充分利用 GridStack（当前版本 ^9.5.1）能力。GridStack 原生支持动态列数切换（`grid.column()`）与水平/垂直间距配置（`margin`），无需自实现定位与样式注入。

## 目标
- 列数可稳定切换（不重叠、不随机“瞬移”）。
- 间距可独立调节（水平/垂直），与碰撞判定一致。
- 移除手动 inline 定位与自定义列宽样式注入，降低复杂度与抖动。

## 能力匹配
- 列数切换：`grid.column(newCol, doLayout)`
  - 推荐：`doLayout = 'moveScale'`（保持相对宽度比例，常见期望）。
  - 备选：`doLayout = true`（重算布局）或 `false`（仅切列，不动节点）。
- 间距调整：`options.margin` 接受数字或 CSS 字符串（支持 1/2/4 值），可分别控制垂直与水平，如：`"8px 16px"`（垂直 8px，水平 16px）。

## 改造要点
1) 选项映射（仅一次初始化）
- `column = config.colNum`
- `cellHeight = config.rowHeight`
- `margin = toCssMargin(config.verticalGap, config.horizontalGap)`（否则回退 `config.margin`）
- `preventCollision = config.preventCollision`
- `staticGrid = props.readonly || config.staticGrid`
- 其余：`styleInHead: true`，`animate: false`，`acceptWidgets: false`

2) 列数切换（去除自排版/内联同步）
- 监听 `config.colNum`：`grid.column(newCol, 'moveScale')`
- 若 `config.verticalCompact === true`，切换后可调用一次 `grid.compact()`；否则不调用。
- 不再：注入自定义列宽 CSS、不再改写 `style.left/top/position`。

3) 间距调整（原生 margin）
- 监听 `horizontalGap/verticalGap`：
  - 若存在 `grid.margin` API：`grid.margin(`${vGap}px ${hGap}px`)`。
  - 若无该 API：销毁并用相同布局参数重建（读取 `grid.engine.nodes` 为布局，`GridStack.init({...})`）。

4) 布局同步策略（精简）
- 初始：由 DOM + `GridStack.init()` 接管。
- 运行中：
  - 外部驱动的布局更新 → 使用 `grid.load(layout)` 或批量 `grid.batchUpdate()` + `grid.update(el, node)` 应用；不要写 inline 样式。
  - 用户拖拽/缩放 → 监听 `change`，合并 `grid.getGridItems()` 的 `gridstackNode`，`emit('update:layout', newLayout)`。

5) 移除反模式
- 删除：`injectColumnStyles()`、清理 `gs-\d+` 类名、所有 inline `left/top/position` 同步、对 v-for 节点重复 `makeWidget/removeWidget`。

## 验证清单
- 12→24→12 列切换：无重叠；相对宽度保持（`moveScale`）。
- 间距：`(h,v)=(0,0)→(8,8)→(16,8)→(16,16)`，视觉与碰撞一致（拖拽边界正确）。
- 删除/新增节点后：未出现“瞬移”，`change` 事件产出的布局与渲染一致。

## 里程碑
- M1：移除自定义样式/定位与注册逻辑，保留原生行为。
- M2：列数/间距监听与映射落地，完成回归测试。
- M3：精简事件透出与类型定义，补充用法示例与文档。
