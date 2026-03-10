# 旧看板删除 & ThingsVis 品牌解耦 架构设计书

> **状态**: Draft
> **涉及仓库**:
>   - `thingspanel-frontend-community` (Host) — Task A: 删除旧看板系统
>   - `thingsvis` (Guest) — Task B: 移除硬编码 ThingsPanel 品牌
> **优先级**: P1 — 清除历史负债，打通 ThingsVis 平台无关性
> **依赖**: 本 spec 完成后 `device-data-binding-spec.md` G8 条目可标注为已修复

---

## 一、背景 & 动机

### Task A — 旧看板

`visualization/kanban` 和 `visualization/kanban-details` 是基于旧 `PanelManage` 组件的看板系统（GridStack + 自定义卡片引擎）。ThingsVis 已通过 4 个独立路由（`thingsvis/`、`thingsvis-dashboards/`、`thingsvis-editor/`、`thingsvis-preview/`）完整替代该老系统，旧看板路由现在是死代码，保留只会制造混淆并增加维护面。

### Task B — 品牌解耦

ThingsVis 的核心 Schema 和 SSO 验证器中存在硬编码的 `'ThingsPanel'` 字符串。这使得 ThingsVis 作为独立产品部署时，任何非 ThingsPanel 平台接入均会 Schema 解析失败，属于直接架构缺陷（对应 `device-data-binding-spec.md` 中的 Gap G8）。

---

## 二、Task A — 旧看板系统删除

### 2.1 文件删除清单（DELETE）

| 文件路径 | 说明 |
|---------|------|
| `src/views/visualization/kanban/index.vue` | 旧看板列表页 |
| `src/views/visualization/kanban/index copy.vue` | 看板列表备份文件 |
| `src/views/visualization/kanban-details/index.vue` | 旧看板详情页（内嵌 `<PanelManage>`）|
| `src/components/panel/panel-manage.vue` | 仅被 `kanban-details/index.vue` 引用 |
| `src/components/panel/PANEL_ANALYSIS.md` | 旧系统分析文档 |
| `src/locales/langs/zh-cn/kanban.json` | 仅含 `kanban.add-cards`，随视图删除 |
| `src/locales/langs/en-us/kanban.vue` | 对应英文翻译文件 |

> ⚠️ **需确认 `kanban-details` 目录**：该目录删除后若为空请一并删除目录本身。

### 2.2 不删除（KEEP）

下列文件属于看板卡片系统，同时被 **设备模板（device/template）** 等其他模块使用，不在本次删除范围内：

| 文件路径 | 被哪里使用 |
|---------|-----------|
| `src/components/panel/card.d.ts` | 所有 `src/card/**/*.ts`、设备模板 |
| `src/components/panel/index.ts` | `src/store/modules/panel/index.ts` |
| `src/components/panel/ui/*.vue` | `src/views/device/template/components/card-select/ui/` |
| `src/store/modules/panel/index.ts` | `card-template-item.vue`、`card-template-form.vue` |
| `src/service/api/panel.ts` | `PanelEditor.vue`、`usePanelDataManager.ts`（ultra-kanban 编辑器）|

### 2.3 路由文件修改清单（MODIFY）

#### `src/router/elegant/routes.ts`
删除以下两个 route 对象（约第 872-887 行）：

```ts
// 删除这两个对象
{
  name: 'visualization_kanban',
  path: '/visualization/kanban',
  component: 'view.visualization_kanban',
  meta: {
    title: 'visualization_kanban',
    i18nKey: 'route.visualization_kanban'
  }
},
{
  name: 'visualization_kanban-details',
  path: '/visualization/kanban-details',
  component: 'view.visualization_kanban-details',
  meta: {
    title: 'visualization_kanban-details',
    i18nKey: 'route.visualization_kanban-details'
  }
},
```

#### `src/router/elegant/imports.ts`
删除以下两行（约第 85-86 行）：

```ts
// 删除
"visualization_kanban-details": () => import("@/views/visualization/kanban-details/index.vue"),
visualization_kanban: () => import("@/views/visualization/kanban/index.vue"),
```

#### `src/router/elegant/transform.ts`
删除以下两行（约第 255-256 行）：

```ts
// 删除
"visualization_kanban": "/visualization/kanban",
"visualization_kanban-details": "/visualization/kanban-details",
```

### 2.4 类型声明修改（MODIFY）

#### `src/typings/elegant-router.d.ts`
删除以下类型映射和联合类型成员：

```ts
// 删除（约第 111-112 行）
"visualization_kanban": "/visualization/kanban";
"visualization_kanban-details": "/visualization/kanban-details";

// 删除（约第 260-261 行）
| "visualization_kanban-details"
| "visualization_kanban"
```

#### `src/typings/app.d.ts`
删除以下 i18n 类型字段（共 4 处）：

```ts
// 删除（在 dashboard_panel 接口内，约第 1157-1158 行）
addKanBan: string
editKanban: string

// 删除（在 custom.home 接口内，约第 1337 行）
kanbanNameNull: string

// 删除（kanban 路由 namespace，约第 1982 行）
kanban: {
  // ... 全块删除
}
```

#### `src/typings/modules.d.ts`
删除 PanelManage 的全局组件声明（约第 106 行）：

```ts
// 删除
PanelManage: (typeof import('./../components/panel/panel-manage.vue'))['default']
```

### 2.5 国际化文件修改（MODIFY）

#### `src/locales/langs/zh-cn/route.json`
删除：
```json
"route.visualization_kanban": "看板",
"route.visualization_kanban-details": "看板详情",
```

#### `src/locales/langs/en-us/route.json`
删除：
```json
"route.visualization_kanban": "Boards",
"route.visualization_kanban-details": "Kanban Details",
```

#### `src/locales/langs/zh-cn/dashboard_panel.json`
删除：
```json
"dashboard_panel.addKanBan": "新建看板",
"dashboard_panel.editKanban": "编辑看板",
```

#### `src/locales/langs/en-us/dashboard_panel.json`
删除：
```json
"dashboard_panel.addKanBan": "Create Dashboard",
"dashboard_panel.editKanban": "Edit Dashboard",
```

#### `src/locales/langs/zh-cn/custom.json`
删除：
```json
"custom.home.kanbanNameNull": "看板名称不能为空",
```

#### `src/locales/langs/en-us/custom.json`
删除：
```json
"custom.home.kanbanNameNull": "Dashboard name cannot be empty",
```

#### `src/locales/locale.ts`
删除第 32 行的 `'kanban'` 模块加载项：
```ts
// 在 modules 数组中删除
'kanban',
```

### 2.6 其他文件修改（MODIFY）

#### `src/main.ts`
从 `excludedPaths` 数组中删除 `/visualization/kanban-details`（约第 17 行）：

```ts
// 修改前
const excludedPaths = ['/login/*', '/404', '/home', '/visualization/kanban-details']

// 修改后
const excludedPaths = ['/login/*', '/404', '/home']
```

#### `src/card/builtin-card/operation-guide-card/index.ts`
删除或替换指向旧看板的链接（约第 39 行）：

```ts
// 修改前
link: '/visualization/kanban'

// 修改后（替换为 ThingsVis 列表页）
link: '/visualization/thingsvis'
```

---

## 三、Task B — ThingsVis 品牌解耦

### 3.1 核心 Schema 修改

#### `packages/thingsvis-schema/src/datasource/platform-field-config.ts`

**变更要点**：`source` 字段从 `z.literal('ThingsPanel')` 改为 `z.string()`，并将 default 值从 `'ThingsPanel'` 改为 `'platform'`。这是向后不兼容变更（已有存储的配置中 source 字段将不再通过新 Schema parse），需配套迁移策略（见 §3.4）。

```ts
// 修改前
/**
 * Platform Field Config Schema
 * Represents a field provided by the host platform (e.g., ThingsPanel)
 */
export const PlatformFieldConfigSchema = z.object({
    source: z.literal('ThingsPanel'),
    fieldMappings: z.record(z.string()),
    deviceContext: z.string().optional(),
});

export const DEFAULT_PLATFORM_FIELD_CONFIG: PlatformFieldConfig = {
    source: 'ThingsPanel',
    fieldMappings: {},
};

// 修改后
/**
 * Platform Field Config Schema
 * Represents a field provided by the host platform.
 * The `source` string identifies the originating platform (e.g., 'thingspanel', 'custom').
 */
export const PlatformFieldConfigSchema = z.object({
    source: z.string().min(1),
    fieldMappings: z.record(z.string()),
    deviceContext: z.string().optional(),
});

export const DEFAULT_PLATFORM_FIELD_CONFIG: PlatformFieldConfig = {
    source: 'platform',
    fieldMappings: {},
};
```

> **JSDoc 修改**（`PlatformFieldSchema`，第 5 行）：将 `(e.g., ThingsPanel)` 改为 `(e.g., the host IoT platform)`。

### 3.2 SSO 验证器开放

#### `apps/server/src/lib/validators/auth.ts`

将 `platform` 字段从 `z.literal('thingspanel')` 改为 `z.string().min(1)`，使 SSO 接口接受任意平台标识符：

```ts
// 修改前
export const SSOExchangeSchema = z.object({
  platform: z.literal('thingspanel'),
  // ...
})

// 修改后
export const SSOExchangeSchema = z.object({
  platform: z.string().min(1),  // e.g. 'thingspanel', 'custom', 'other-iot-platform'
  // ...
})
```

### 3.3 平台集成模块重命名

#### `apps/server/src/lib/thingspanel.ts` → `apps/server/src/lib/platform.ts`

当前文件中所有函数均为 TODO stub，未被任何源文件实际导入（仅在 markdown 文档中引用）。执行以下操作：

1. **重命名文件**：`thingspanel.ts` → `platform.ts`
2. **重命名函数**：
   - `verifyThingsPanelToken` → `verifyPlatformToken`
   - `getThingsPanelUserInfo` → `getPlatformUserInfo`
3. **更新 JSDoc**：将所有 `ThingsPanel` 文字替换为通用描述（"the host platform"）
4. 若无任何文件实际 import 此模块（当前确认为未使用），可选择直接删除该文件

### 3.4 JSDoc 注释更新

#### `packages/thingsvis-kernel/src/datasources/PlatformFieldAdapter.ts`

将 JSDoc 中的 `(e.g., ThingsPanel device attributes/telemetry)` 改为 `(e.g., host platform device attributes/telemetry)`：

```ts
// 修改前
/**
 * Platform Field Adapter
 * Adapts platform-provided fields (e.g., ThingsPanel device attributes/telemetry)
 * to ThingsVis data source format
 */

// 修改后
/**
 * Platform Field Adapter
 * Adapts platform-provided fields (e.g., host platform device attributes/telemetry)
 * to ThingsVis data source format
 */
```

### 3.5 Docker 镜像命名空间

#### `docker-compose.yml`（thingsvis 仓库根目录）

```yaml
# 修改前
server:
  image: ghcr.io/thingspanel/thingsvis-server:latest

studio:
  image: ghcr.io/thingspanel/thingsvis-studio:latest

# 修改后（需先在 GitHub 创建 thingsvis org 并迁移镜像）
server:
  image: ghcr.io/thingsvis/thingsvis-server:latest

studio:
  image: ghcr.io/thingsvis/thingsvis-studio:latest
```

> ⚠️ **部署注意**：镜像 registry namespace 变更需要先在 `ghcr.io/thingsvis` 下重新发布镜像，并更新 CI/CD pipeline，再替换 compose 文件。**如 GitHub org 尚未创建，此项可推迟**，优先处理源码解耦。

### 3.6 后向兼容迁移策略（Schema 变更）

由于 `source: z.literal('ThingsPanel')` → `source: z.string().min(1)` 是 Schema 放宽（而非收紧），**已有数据不会 parse 失败**。旧数据中 `source: 'ThingsPanel'` 仍可被新 Schema 正常解析，无需数据库迁移。

未来若业务需要区分接入平台，可在运行时通过传入的宿主配置覆盖 `source` 字段（如 ThingsPanel 宿主在 `tv:init` message 中传入 `source: 'thingspanel'`）。

---

## 四、受波及文件完整清单

### thingspanel-frontend-community

| 操作 | 文件路径 |
|------|---------|
| DELETE | `src/views/visualization/kanban/index.vue` |
| DELETE | `src/views/visualization/kanban/index copy.vue` |
| DELETE | `src/views/visualization/kanban-details/index.vue` |
| DELETE | `src/components/panel/panel-manage.vue` |
| DELETE | `src/components/panel/PANEL_ANALYSIS.md` |
| DELETE | `src/locales/langs/zh-cn/kanban.json` |
| DELETE | `src/locales/langs/en-us/kanban.json` |
| MODIFY | `src/router/elegant/routes.ts` |
| MODIFY | `src/router/elegant/imports.ts` |
| MODIFY | `src/router/elegant/transform.ts` |
| MODIFY | `src/typings/elegant-router.d.ts` |
| MODIFY | `src/typings/app.d.ts` |
| MODIFY | `src/typings/modules.d.ts` |
| MODIFY | `src/locales/langs/zh-cn/route.json` |
| MODIFY | `src/locales/langs/en-us/route.json` |
| MODIFY | `src/locales/langs/zh-cn/dashboard_panel.json` |
| MODIFY | `src/locales/langs/en-us/dashboard_panel.json` |
| MODIFY | `src/locales/langs/zh-cn/custom.json` |
| MODIFY | `src/locales/langs/en-us/custom.json` |
| MODIFY | `src/locales/locale.ts` |
| MODIFY | `src/main.ts` |
| MODIFY | `src/card/builtin-card/operation-guide-card/index.ts` |

### thingsvis

| 操作 | 文件路径 |
|------|---------|
| MODIFY | `packages/thingsvis-schema/src/datasource/platform-field-config.ts` |
| MODIFY | `apps/server/src/lib/validators/auth.ts` |
| RENAME/DELETE | `apps/server/src/lib/thingspanel.ts` → `platform.ts` |
| MODIFY | `packages/thingsvis-kernel/src/datasources/PlatformFieldAdapter.ts` |
| MODIFY (defer) | `docker-compose.yml` |

---

## 五、级联影响分析

### 5.1 编译错误（预期，需同步修复）

删除 `kanban-details` 路由后，`elegant-router` 的类型定义会有残留引用。按 §2.4 清单更新 `.d.ts` 文件后可消除。

删除 `panel-manage.vue` 后，`src/typings/modules.d.ts` 中的全局组件声明也需同步删除（§2.4）。

### 5.2 未受影响的功能

- **设备模板卡片系统**（`src/card/`、`src/store/modules/panel`、`src/components/panel/ui/`）：完整保留，不受影响。
- **ThingsVis 四个路由**（`thingsvis/`、`thingsvis-dashboards/`、`thingsvis-editor/`、`thingsvis-preview/`）：不受影响。
- **ultra-kanban 路由**（若存在）：`PanelEditor.vue` 和 `usePanelDataManager.ts` 继续使用 `getBoard/PutBoard`，`src/service/api/panel.ts` 保留。

### 5.3 ThingsVis Schema 变更影响

`source: z.literal('ThingsPanel')` → `z.string().min(1)` 是 Schema **放宽**操作：
- 已有 `source: 'ThingsPanel'` 数据继续可解析 ✅
- ThingsPanel 宿主端（`thingspanel-frontend-community`）无需代码改动
- `packages/thingsvis-schema` 重新 `pnpm build` 后，所有 `node_modules` 中的 dist 副本将自动更新

### 5.4 `thingspanel.ts` 函数删除影响

当前 `verifyThingsPanelToken` 和 `getThingsPanelUserInfo` 均为 TODO stub，在 `sso/route.ts` 中被注释引用（`// const isValid = await verifyThingsPanelToken(...)`）。删除后 sso/route.ts 无编译错误，SSO 功能不受影响（仍需实现真正的 token 验证逻辑）。

---

## 六、实施顺序

```
Step 1  删除 kanban 视图文件               # 无编译依赖
Step 2  删除 panel-manage.vue + docs     # 无编译依赖
Step 3  修改 router (routes/imports/transform)
Step 4  修改 typings (elegant-router / app.d.ts / modules.d.ts)
Step 5  修改 locale 文件 (zh-cn / en-us)
Step 6  修改 main.ts / operation-guide-card
Step 7  pnpm build --workspace 验证编译
Step 8  修改 thingsvis platform-field-config.ts
Step 9  修改 thingsvis auth.ts validator
Step 10 重命名/删除 thingsvis thingspanel.ts
Step 11 更新 PlatformFieldAdapter.ts JSDoc
Step 12 pnpm build (thingsvis) 验证编译
Step 13 更新 docker-compose.yml（待 ghcr.io/thingsvis org 就绪）
```
