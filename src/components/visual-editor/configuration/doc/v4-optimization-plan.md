# V4 优化方案 (V2 - 修正版)

**目标:** 根据深入分析和用户反馈，精准解决数据初始化、UI布局及数组映射的核心问题，并创建测试组件验证方案的完整性。

---

## 任务一：彻底解决“数据初始化与同步”问题

**问题场景 (根据用户反馈):**
1.  组件在配置数据后能正常显示。
2.  保存配置并刷新页面后，组件变为空白，数据丢失。
3.  此时，右键打开该组件的配置面板，数据又会立刻显示出来。

**根本原因分析:**
此问题的核心在于 `useWidgetProps` Hook 的 `watch` 侦听器没有在组件首次挂载时立即执行。它只在 `configuration` 对象后续发生变化时才触发。页面刷新后，`configuration` prop 被一次性传入，但 `watch` 没有立即响应，导致组件无法进行初始的数据加载和渲染。当用户打开配置面板时，面板的打开行为可能触发了父组件的重渲染，导致 `configuration` prop 发生变化，从而“意外地”触发了 `watch`，使数据得以显示。

**解决方案:**

### 1.1 升级 `useWidgetProps` Hook

*   **文件:** `e:\wbh\things2\thingspanel-frontend-community\src\card2.1\hooks\useWidgetProps.ts`
*   **任务:**
    1.  为 `configuration` 的 `watch` 同时启用 `deep: true` 和 `immediate: true` 选项。
    2.  在 `resolveProps` 函数中增加处理 `dataType: 'array'` 的逻辑 (此部分不变)。

*   **实现思路:**

    ```typescript
    // src/card2.1/hooks/useWidgetProps.ts

    // ...
    // 监听变化: 开启深度侦听和立即执行
    watch(
      configuration,
      resolveProps,
      {
        deep: true,      // <--- 关键1：确保配置内部变化能被侦测
        immediate: true  // <--- 关键2：确保在组件挂载时立即执行一次，解决初始化问题
      }
    );
    // ...
    ```
    *   **说明:** `immediate: true` 会强制 `watch` 在组件创建时，立即使用当前的 `configuration` 值执行一次 `resolveProps` 函数。这确保了无论后续有无交互，组件都能在第一时间完成数据水合，从而根治刷新后数据丢失的问题。

### 1.2 扩展核心类型定义

*   **文件:** `e:\wbh\things2\thingspanel-frontend-community\src\card2.1\core\types.ts`
*   **任务:** 在 `DataSourceRequirement` 接口中增加 `dataType` 字段 (此部分不变)。

---

## 任务二：优化配置UI (采纳NCollapse方案)

**问题描述:** 在配置面板中使用 `NTabs` 会与外部可能存在的 `NTabs` 形成嵌套，UI结构不佳。当数据源增多时，横向排列的标签页也难以扩展。

**解决方案 (根据用户建议):** 使用 `NCollapse` (折叠面板) 代替 `NTabs`，将静态参数和每个数据源的配置项垂直分组，UI更清晰，扩展性更好。

### 2.1 重构配置表单UI

*   **文件:** `e:\wbh\things2\thingspanel-frontend-community\src\components\visual-editor\configuration\SimpleDataMappingForm.vue` (或承担此功能的组件)
*   **任务:** 使用 `NCollapse` 组件重构UI布局。

*   **实现思路:**
    ```html
    <!-- src/components/visual-editor/configuration/SimpleDataMappingForm.vue -->
    <template>
      <n-collapse default-expanded-names="static">
        <!-- 静态参数折叠项 -->
        <n-collapse-item title="静态参数" name="static">
          <!-- 在这里渲染所有静态参数的表单控件 -->
        </n-collapse-item>

        <!-- 动态数据源折叠项 -->
        <n-collapse-item
          v-for="(dataSourceReq, index) in definition.dataSources"
          :key="dataSourceReq.key"
          :title="`数据源 ${index + 1}: ${dataSourceReq.key}`"
          :name="dataSourceReq.key"
        >
          <!-- 
            为每个数据源渲染其独立的配置项：
            1. 数据源选择器 (DataSource Selector)
            2. 字段映射表单 (Field Mappings Form)
          -->
        </n-collapse-item>
      </n-collapse>
    </template>
    ```
*   **说明:** 采用折叠面板后，所有配置项垂直排列，清晰明了。默认展开“静态参数”便于快速配置。即便是多个数据源，也能在有限的垂直空间内优雅展示，完全避免了UI嵌套和扩展性问题。

---

## 任务三：创建“列表测试组件”

*   (此任务内容不变，用于验证上述修复的有效性，详见上一版方案)

---

## 任务四：集成与验证

**目标:** 将新组件集成到可视化编辑器中，并通过实际操作验证所有修复是否生效。

1.  **注册与配置:** (步骤不变)
2.  **验证:**
    *   **UI验证:** 打开配置面板，确认配置项已改为 **折叠面板 (NCollapse)** 样式。
    *   **数据初始化验证:**
        1.  配置好数据源并保存。
        2.  **刷新整个页面**。
        3.  **验证组件是否在刷新后能立即显示数据**，无需任何额外操作。
    *   **数据同步验证:** 再次打开配置面板，修改静态参数（如标题），保存后，组件应立即更新。
