# ThingsPanel & ThingsVis 双轨集成架构白皮书 v1.0

> **版本**: 1.0.0
> **状态**: 待执行
> **核心目标**: 彻底解耦“物模型组件”与“可视化项目编辑器”，通过 SDK 层标准化集成逻辑，实现高可用、易扩展、易维护。

---

## 1. 核心架构理念：双轨隔离 (Dual-Track Isolation)

我们识别出两种**截然不同**的集成场景，必须在架构层面进行物理隔离，严禁代码复用。

### 1.1 轨道 A：物模型组件 (Widget Mode)
*   **应用场景**:
    *   设备详情页的实时图表
    *   APP/Web 端组态配置
*   **本质**: 一个无状态的 UI 渲染器/编辑器。
*   **数据流**: **Host-Managed**。宿主 (ThingsPanel) 负责存储 JSON 配置，通过 `Props` 传入组件。组件编辑后，通过事件传回 JSON，由宿主保存。
*   **关键特征**: **No API Call**。组件内部绝不调用 ThingsVis 后端 API，只进行纯前端交互。

### 1.2 轨道 B：可视化项目编辑器 (App Mode)
*   **应用场景**:
    *   独立的可视化大屏编辑器
    *   完整的多页面仪表盘项目
*   **本质**: 一个完整的 SaaS 应用嵌入 (Iframe)。
*   **数据流**: **Self-Managed**。ThingsVis 独立闭环，自行调用云端 API 加载/保存数据。宿主仅作为入口。
*   **关键特征**: **Token-Based**。宿主只负责传递 SSO Token，不干涉内部逻辑。

---

## 2. 组件拆分与强制命名规范

为防止逻辑混淆，**必须废弃**通用的 `ThingsVisEditor` 命名，采用职责明确的组件名。

| 场景 | **Widget Mode (物模型/组件)** | **App Mode (可视化项目/大屏)** | **已废弃 (Deprecated)** |
| :--- | :--- | :--- | :--- |
| **组件名** | **`ThingsVisWidget.vue`** | **`ThingsVisAppFrame.vue`** | `ThingsVisEditor.vue` |
| **职责** | 仅负责 JSON 数据透传渲染 | 仅负责 Iframe 容器与 SSO | 试图混合两者的“万能组件” |
| **输入** | `config` (JSON), `data` (Realtime) | `token` (SSO), `projectId` | - |
| **输出** | `emit('save', json)` | 无 (内部自闭环) | - |
| **路由** | `/device/template/*` | `/visualization/editor/:id` | - |

---

## 3. 集成层 SDK 化 (`@thingsvis/embed-sdk`)

为了解决“代码繁琐、调试困难”的问题，我们将所有底层通信逻辑封装为标准 SDK。Host 端 Vue 组件将极其轻量。

### 3.1 SDK 核心类设计

```typescript
// src/utils/thingsvis/sdk/client.ts

export class ThingsVisClient {
  /**
   * 初始化 Client
   * @param container 挂载节点
   * @param options 配置项 (url, mode)
   */
  constructor(container: HTMLElement, options: ThingsVisOptions);

  /**
   * [Widget Mode] 加载组件配置
   * 发送 'LOAD_WIDGET' 消息给 Iframe
   */
  loadWidgetConfig(config: WidgetConfig): void;

  /**
   * [Widget Mode] 监听保存事件
   * 当 Iframe 内部触发保存时回调
   */
  onWidgetSave(callback: (config: WidgetConfig) => void): void;

  /**
   * [App Mode] 建立应用会话
   * 发送 SSO Token 给 Iframe
   */
  connectAppSession(token: string): void;

  /** 销毁 Iframe 与监听器 */
  destroy(): void;
}
```

### 3.2 组件实现示例 (极端简化)

#### `ThingsVisWidget.vue` (物模型组件)
```vue
<script setup>
import { onMounted, ref } from 'vue';
import { ThingsVisClient } from '@/utils/thingsvis/sdk';

const props = defineProps(['config']);
const emit = defineEmits(['save']);
const container = ref(null);
let client;

onMounted(() => {
  // 1. 初始化
  client = new ThingsVisClient(container.value, { mode: 'widget' });

  // 2. 加载数据 (Host -> Guest)
  client.loadWidgetConfig(props.config);

  // 3. 监听保存 (Guest -> Host)
  client.onWidgetSave((data) => emit('save', data));
});
</script>
```

#### `ThingsVisAppFrame.vue` (可视化项目)
```vue
<script setup>
import { onMounted, ref } from 'vue';
import { ThingsVisClient } from '@/utils/thingsvis/sdk';

const props = defineProps(['token', 'projectId']);
const container = ref(null);

onMounted(() => {
  // 1. 初始化
  client = new ThingsVisClient(container.value, {
    mode: 'app',
    url: `/editor/${props.projectId}`
  });

  // 2. 注入 Token (Host -> Guest)
  client.connectAppSession(props.token);
});
</script>
```

---

## 4. 迁移与实施路线图

### 阶段一：SDK 原型与物模型恢复 (Immediate)
1.  **创建 SDK**: 在 `src/utils/thingsvis/sdk/` 下实现 `ThingsVisClient` 类。
2.  **创建 Widget 组件**: 新增 `src/components/thingsvis/ThingsVisWidget.vue`，使用 SDK 实现。
3.  **恢复业务**: 修改 `web-chart-config.vue`，引用新组件，确保物模型功能 100% 恢复。

### 阶段二：可视化项目集成 (Secondary)
1.  **创建 App 组件**: 新增 `src/components/thingsvis/ThingsVisAppFrame.vue`。
2.  **集成页面**:修改 `src/views/visualization/thingsvis-editor/index.vue`，引用新组件。
3.  **验证 SSO**: 确保 Token 传递正确，编辑器能正常加载云端数据。

### 阶段三：清理与规范化 (Final)
1.  **物理删除**: `ThingsVisEditor.vue`。
2.  **清理路由**: `url-builder.ts` 中的冗余逻辑移入 SDK。
3.  **文档归档**: 本白皮书作为标准文档存入项目文档库。
