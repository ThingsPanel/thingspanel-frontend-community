# 数据源解锁与数组绑定全链路架构设计书

**版本**: v1.0
**日期**: 2026-03-11
**问题触发点**: 属性面板「数据源」被锁定为「平台字段」，无法选择自定义数据源，也无法绑定数组/JSON 子路径字段

---

## 一、问题根因分析

### 1.1 症状（用户截图还原）

| 面板项 | 当前状态 | 期望状态 |
|--------|---------|---------|
| 数据集  | `字段` (已选，无法切换数据源) | 可以选择不同数据源 |
| 数据源  | `平台字段`（只读锁定，灰色 cursor-not-allowed） | 下拉选择，含 `__platform__` + 已注册 DS |
| 字段    | flat 下拉（只能选一级 key） | 支持子路径（`sensor.readings[0]`）、历史数组（`temp__history`） |

### 1.2 根因代码定位

**根因 1 — `FieldPicker.tsx` 强制锁定数据源选择器**

```typescript
// apps/studio/src/components/RightPanel/FieldPicker.tsx  ~Line 80

const usePlatformFieldsMode = hasPlatformFields;  // ← 只要有平台字段就锁定
const effectiveDataSourceId =
  usePlatformFieldsMode && !selectedDataSourceId ? '__platform__' : selectedDataSourceId;

// ~Line 165：平台字段模式下渲染为只读 div，不是 <select>
{usePlatformFieldsMode ? (
  <div className="cursor-not-allowed">平台字段</div>  // ← 用户无法操作
) : (
  <select>...</select>  // ← 正常情况
)}
```

后果：嵌入 ThingsPanel 后，**任何 `tv:init` 带 `platformFields` 的场景**都会触发锁定，用户永远无法切换数据源，也无法使用自定义 HTTP/WS 数据源。

**根因 2 — 平台字段路径枚举不遍历 JSON 子结构**

当 `isPlatformSource` 时（~Line 125），FieldPicker 使用 `platformFieldStore.fields` 中的 **flat 字段 ID** 作为路径列表，而非从活跃的 `__platform__` adapter 快照中派生真实路径：

```typescript
// 当前：flat 枚举（不遍历）
const platformPathInfos: FieldPathInfo[] = platformFields.map((f) => ({
  path: f.id,   // e.g. "temperature", "sensor" — 没有子路径
  type: 'string',
}));
```

实际上 `DataSourceManager` 已经在 `states['__platform__'].data` 里存了完整快照（包含 JSON 字段的嵌套值），但 FieldPicker 绕过了它。

**根因 3 — `bufferSize` 恒为 0，历史数组永不产生**

`EmbedPage.tsx` 自动注入的 `__platform__` 数据源配置中：

```typescript
// apps/studio/src/pages/EmbedPage.tsx ~Line 370
schema.dataSources.push({
  id: '__platform__',
  type: 'PLATFORM_FIELD',
  config: { fieldMappings: {} },  // ← bufferSize 缺失，默认 0
});
```

`PlatformFieldAdapter` 只有当 `bufferSize > 0` 时才填充 `${fieldId}__history` 环形缓冲区。
ThingsPanel SDK `loadWidgetConfig()` 也从未传递 `bufferSize`，所以折线图等图表 Widget 永远拿不到历史数组数据。

---

## 二、数据模型层 (Schema)

### 2.1 PlatformField 扩展 — 支持 JSON 子字段描述

**文件**: `src/utils/thingsvis/types.ts`（ThingsPanel）
**文件**: `packages/thingsvis-schema/src/datasource/platform-field-config.ts`（ThingsVis）

```typescript
// src/utils/thingsvis/types.ts (ThingsPanel 侧修改)
export interface PlatformField {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'json';
  dataType: 'attribute' | 'telemetry' | 'command';
  unit?: string;
  description?: string;
  /**
   * 新增: JSON 类型字段的子字段描述。
   * key = 子路径（点分格式，e.g. "readings", "readings.0.value"）
   * value = 子路径叶节点数据类型
   * 用途: 在 ThingsVis FieldPicker 中静态提示子路径（无需等待运行时数据）
   */
  jsonSchema?: Record<string, 'number' | 'string' | 'boolean'>;
}
```

```typescript
// packages/thingsvis-schema/src/datasource/platform-field-config.ts (ThingsVis 侧修改)
export const PlatformFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['number', 'string', 'boolean', 'json']),
  dataType: z.enum(['attribute', 'telemetry', 'command']),
  unit: z.string().optional(),
  description: z.string().optional(),
  jsonSchema: z.record(z.enum(['number', 'string', 'boolean'])).optional(), // 新增
});
```

### 2.2 PlatformFieldConfig 扩展 — `bufferSize` 从 Host 传入

**文件**: `packages/thingsvis-schema/src/datasource/platform-field-config.ts`（ThingsVis）

> 此 Schema 已有 `bufferSize` 字段，无需修改 Schema 本身。
> 问题在于 Host 从未在 `tv:init` payload 中传入 `bufferSize`，导致 Adapter 始终使用默认值 0。

### 2.3 FieldPicker 内部状态契约

```typescript
// FieldPicker 内部：解锁后的数据源选择逻辑

// 新逻辑：__platform__ 作为普通选项，不再强制锁定
const effectiveDataSourceId = selectedDataSourceId || (hasPlatformFields ? '__platform__' : '');
const isPlatformSource = effectiveDataSourceId === '__platform__';

// 路径推导优先级（isPlatformSource 时）：
// 1. states['__platform__']?.data 存在 → listFieldPaths(snapshot) （含子路径 + history）
// 2. platformFields 的 jsonSchema 提示 → 静态子路径合并到 flat list
// 3. 降级 → flat platformFields IDs
```

---

## 三、后端服务层 (API)

ThingsPanel 后端无需改动。历史数据已由 `PlatformFieldAdapter.bufferSize` 环形缓冲区在 ThingsVis 内部处理。
折线图所需历史数组来自 `${fieldId}__history` key，由 Adapter 内存维护，不走后端 API。

> 注：若需要跨会话持久化历史（如大时间跨度趋势图），应走 `GET /api/v1/telemetry/datas/statistic` 接口（见 device-data-binding-spec.md §三，TASK-6），本 spec 不重复覆盖。

---

## 四、前端交互层 (View) — 改动设计

### TASK-A: `FieldPicker.tsx` 解锁数据源选择（核心修复）

**修改文件**: `f:\coding\thingsvis\apps\studio\src\components\RightPanel\FieldPicker.tsx`

**改动意图**:
1. 删除 `usePlatformFieldsMode` 变量及其引入的只读 div 渲染分支
2. 将 `__platform__` 作为 `<select>` 下拉项，当 `hasPlatformFields` 时自动置顶且为默认初始值
3. 当 `isPlatformSource` 时，优先从 `states['__platform__']?.data` 派生字段路径（`listFieldPaths`），而非 flat `platformFieldStore.fields`
4. 当 `states['__platform__']` 尚无数据（首次连接前），降级使用 `platformFields` store 中的 flat IDs + `jsonSchema` 提示合并的子路径

**关键代码变更**:

```typescript
// 删除：
// const usePlatformFieldsMode = hasPlatformFields;

// 新增：非锁定式默认值逻辑
const effectiveDataSourceId =
  selectedDataSourceId || (hasPlatformFields ? '__platform__' : '');
const isPlatformSource = effectiveDataSourceId === '__platform__';

// 新增：__platform__ DS 的实时快照
const platformDsState = states['__platform__'] ?? null;
const platformSnapshot = platformDsState?.data ?? null;

// 路径推导：isPlatformSource 时优先用实时快照
const { paths, pathInfos, truncated } = useMemo(() => {
  if (isPlatformSource) {
    if (platformSnapshot && typeof platformSnapshot === 'object') {
      // 实时快照存在 → 遍历完整结构（含 JSON 子路径和 __history 数组键）
      return listFieldPaths(platformSnapshot, { maxDepth: maxDepth ?? 5, maxNodes: maxNodes ?? 200 });
    }
    // 降级：静态枚举（flat fields + jsonSchema 子路径提示）
    const staticInfos: FieldPathInfo[] = [];
    platformFields.forEach((f: any) => {
      staticInfos.push({ path: f.id, type: f.type ?? 'string' });
      if (f.jsonSchema) {
        Object.entries(f.jsonSchema as Record<string, string>).forEach(([subPath, subType]) => {
          staticInfos.push({ path: `${f.id}.${subPath}`, type: subType as FieldPathInfo['type'] });
        });
      }
    });
    return { paths: staticInfos.map((i) => i.path), pathInfos: staticInfos, truncated: false };
  }
  // 原有逻辑（非平台数据源）...
  if (fieldSchema && fieldSchema.length > 0) { /* ... */ }
  return listFieldPaths(snapshot, { maxDepth: maxDepth ?? 5, maxNodes: maxNodes ?? 200 });
}, [isPlatformSource, platformSnapshot, platformFields, fieldSchema, snapshot, maxDepth, maxNodes]);

// 数据源 <select> 渲染：去掉 usePlatformFieldsMode 分支，统一用 <select>
<select
  value={effectiveDataSourceId}
  onChange={(e) => {
    const nextId = e.target.value;
    safeOnChange(nextId ? { dataSourceId: nextId, fieldPath: '' } : null);
  }}
>
  <option value="">{t('binding.selectDataSource')}</option>
  {hasPlatformFields && (
    <option value="__platform__">🔌 {t('binding.platformFieldsLabel', '平台字段')}</option>
  )}
  {dataSourceIds.length > 0 && hasPlatformFields && <option disabled>──────────</option>}
  {dataSourceIds.filter(id => id !== '__platform__').map((id) => (
    <option key={id} value={id}>{id}</option>
  ))}
</select>
```

**效果**:
- 用户可以在「数据源」下拉中自由切换：`平台字段 / myRestDS / myWsDS`
- 选择过平台字段后，字段列表自动包含 JSON 子路径（`sensor.readings.0.value`）和历史数组键（`temperature__history`）

---

### TASK-B: `EmbedPage.tsx` — 保留 `bufferSize` 配置注入

**修改文件**: `f:\coding\thingsvis\apps\studio\src\pages\EmbedPage.tsx`

**改动意图**: 当 `tv:init` payload 中的 `dataSources` 已携带 `__platform__` 配置时（包含 `bufferSize`），不应覆盖而应复用。

```typescript
// 当前（有风险的覆盖注入）：
if (!schema.dataSources?.some((ds: any) => ds.id === '__platform__')) {
  schema.dataSources.push({
    id: '__platform__',
    name: 'System Platform',
    type: 'PLATFORM_FIELD',
    config: { fieldMappings: {} },  // ← 丢失了 bufferSize
  });
}

// 修改后（保留 Host 传入的配置）：
const existingPlatformDs = schema.dataSources?.find((ds: any) => ds.id === '__platform__');
if (!existingPlatformDs) {
  schema.dataSources = schema.dataSources ?? [];
  schema.dataSources.push({
    id: '__platform__',
    name: 'System Platform',
    type: 'PLATFORM_FIELD',
    config: { source: 'platform', fieldMappings: {}, bufferSize: 0 },
  });
}
// 若 existingPlatformDs 已存在（Host 传入了 bufferSize），直接使用，不覆盖
```

---

### TASK-C: ThingsPanel SDK `client.ts` — `loadWidgetConfig` 支持 `bufferSize`

**修改文件**: `f:\coding\thingspanel-frontend-community\src\utils\thingsvis\sdk\client.ts`

**改动意图**: `loadWidgetConfig()` 新增可选的 `options` 参数，允许调用方控制 `__platform__` 数据源的 `bufferSize`（历史环形缓冲区大小）。

```typescript
export interface WidgetLoadOptions {
  /**
   * `__platform__` 数据源的历史缓冲区大小。
   * 0 = 仅保留最新单点值（默认，适合仪表盘/状态 Widget）
   * > 0 = 保留最近 N 条数据，`${fieldId}__history` 中以时序数组形式暴露（适合折线图 Widget）
   */
  platformBufferSize?: number;
}

public loadWidgetConfig(config: any, platformFields?: any[], options?: WidgetLoadOptions) {
  // ...（保持已有防御性处理逻辑）

  // __platform__ 数据源配置（携带 bufferSize 到 ThingsVis Adapter）
  const platformDs = {
    id: '__platform__',
    name: 'System Platform',
    type: 'PLATFORM_FIELD',
    config: {
      source: 'platform',
      fieldMappings: {},
      bufferSize: options?.platformBufferSize ?? 0,
    },
  };

  // 合并入 dataSources（如 config 中已有自定义 DS，也保留）
  const existingDataSources: any[] = safeConfig.dataSources ?? [];
  const mergedDataSources = [
    platformDs,  // __platform__ 优先
    ...existingDataSources.filter((ds: any) => ds.id !== '__platform__'),
  ];

  const payload = {
    data: {
      meta: safeConfig.meta || { id: 'widget', name: 'Widget' },
      canvas: safeCanvas,
      nodes: safeNodes,
      dataSources: mergedDataSources,  // ← 携带 bufferSize
      platformFields,
    },
    config: {
      saveTarget: 'host',
      apiBaseUrl: window.location.origin + '/thingsvis-api',
    },
  };

  this.send(TV_MSG.INIT, payload);
}
```

---

### TASK-D: ThingsPanel `web-chart-config.vue` — 按图表类型启用 `bufferSize`

**修改文件**: `f:\coding\thingspanel-frontend-community\src\views\device\template\components\step\web-chart-config.vue`

**改动意图**: 加载 Widget 配置时，根据图表类型决定是否传入 `platformBufferSize`。折线图/趋势图需要历史数组，仪表盘/指示灯等只需单点值。

```typescript
// 加载 Widget 时（调用 client.loadWidgetConfig 处）
const chartType = currentWidgetConfig.value?.type  // e.g. 'LineChart', 'Gauge'

const HISTORY_CHART_TYPES = new Set([
  'LineChart', 'BarChart', 'AreaChart', 'TrendLine', 'SparkLine'
])

const bufferSize = HISTORY_CHART_TYPES.has(chartType) ? 200 : 0

client.loadWidgetConfig(
  currentWidgetConfig.value,
  platformFields.value,
  { platformBufferSize: bufferSize }  // ← 新增
)
```

---

### TASK-E: ThingsPanel `platform-fields.ts` — JSON 物模型子字段提取

**修改文件**: `f:\coding\thingspanel-frontend-community\src\utils\thingsvis\platform-fields.ts`

**改动意图**: 当物模型字段的 `data_type` 为 JSON/object 时，若字段定义中含有 `properties` 或 `specs`（ThingsPanel 物模型结构体描述），提取其子字段生成 `jsonSchema`。这使 FieldPicker 在无运行时数据时也能展示静态子路径提示。

```typescript
function extractJsonSchema(item: any): Record<string, 'number' | 'string' | 'boolean'> | undefined {
  // 物模型结构体：{ properties: { key: { type, ... } } } 或 specs 数组
  const properties = item?.properties ?? item?.specs;
  if (!properties) return undefined;

  const schema: Record<string, 'number' | 'string' | 'boolean'> = {};

  const extract = (props: any, prefix = '') => {
    if (Array.isArray(props)) {
      props.forEach((spec: any) => {
        const key = spec.id || spec.identifier || spec.key;
        if (!key) return;
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const mappedType = mapDataType(spec.dataType || spec.data_type || spec.type);
        if (mappedType !== 'json') {
          schema[fullKey] = mappedType as 'number' | 'string' | 'boolean';
        } else {
          // 递归嵌套结构体
          extract(spec.properties ?? spec.specs, fullKey);
        }
      });
    } else if (typeof props === 'object') {
      Object.entries(props).forEach(([key, def]: [string, any]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const mappedType = mapDataType(def.type);
        if (mappedType !== 'json') {
          schema[fullKey] = mappedType as 'number' | 'string' | 'boolean';
        }
      });
    }
  };

  extract(properties);
  return Object.keys(schema).length > 0 ? schema : undefined;
}

// normalizeField 中增加 jsonSchema 提取：
const normalizeField = (item: any, dataType: PlatformField['dataType']): PlatformField | null => {
  const id = item?.key || item?.data_identifier || item?.identifier || item?.id;
  const name = item?.name || item?.data_name || item?.label || id;
  if (!id) return null;

  const type = mapDataType(item?.data_type || item?.type);
  return {
    id,
    name: name || id,
    type,
    dataType,
    unit: item?.unit,
    description: item?.description || item?.define,
    jsonSchema: type === 'json' ? extractJsonSchema(item) : undefined,  // 新增
  };
};
```

---

## 五、全栈受波及文件清单

### ThingsVis (thingsvis)

| 文件路径 | 动作 | 改动意图 |
|---------|------|---------|
| `apps/studio/src/components/RightPanel/FieldPicker.tsx` | **修改** | 删除 `usePlatformFieldsMode` 只读锁；<br>数据源下拉改为含 `__platform__` + 其他 DS 的交互式 `<select>`；<br>`isPlatformSource` 时优先从 `states['__platform__'].data` 派生路径（支持 JSON 子路径、`__history` 键） |
| `apps/studio/src/pages/EmbedPage.tsx` | **修改** | 自动注入 `__platform__` DS 时检查是否已存在（保留 Host 传入的 `bufferSize`），不覆盖 |
| `packages/thingsvis-schema/src/datasource/platform-field-config.ts` | **修改** | `PlatformFieldSchema` 新增 `jsonSchema` 可选字段 |

### ThingsPanel (thingspanel-frontend-community)

| 文件路径 | 动作 | 改动意图 |
|---------|------|---------|
| `src/utils/thingsvis/types.ts` | **修改** | `PlatformField` 新增 `jsonSchema?: Record<string, 'number' \| 'string' \| 'boolean'>` |
| `src/utils/thingsvis/platform-fields.ts` | **修改** | `extractJsonSchema()` 新增函数；`normalizeField()` 对 `json` 类型字段填充 `jsonSchema` |
| `src/utils/thingsvis/sdk/client.ts` | **修改** | `loadWidgetConfig()` 新增 `options?: WidgetLoadOptions` 参数；构造含 `bufferSize` 的 `__platform__` DS 配置后传入 `tv:init` |
| `src/views/device/template/components/step/web-chart-config.vue` | **修改** | 调用 `loadWidgetConfig` 时，按 Widget 类型决定 `platformBufferSize`（折线图等历史图表 = 200，其他 = 0） |

---

## 六、数据流示意（解锁后）

```
ThingsPanel → tv:init → { dataSources: [{ id:'__platform__', bufferSize: 200 }], platformFields: [...] }
                                        │
                              EmbedPage.tsx: 保留 bufferSize，注册 DS
                                        │
                              PlatformFieldAdapter.connect({ bufferSize: 200 })
                                        │
                              ThingsPanel → tv:platform-data → { fieldId: 'temp', value: 25.3 }
                                        │
                              PlatformFieldAdapter.updateData():
                                dataCache.set('temp', 25.3)
                                dataBuffers.get('temp').push({ value: 25.3, ts: now })
                                emitData({ temp: 25.3, temp__history: [{value:25.3, ts:...}, ...] })
                                        │
                              states['__platform__'].data = { temp: 25.3, temp__history: [...] }
                                        │
                              FieldPicker（解锁后）:
                                数据源下拉: [🔌 平台字段 ▼]  ← 可切换
                                字段下拉:
                                  temp [number]
                                  temp__history [array]    ← 折线图用此路径
                                  humidity [number]
                                  sensor.readings [array]  ← JSON 子路径
                                  sensor.unit [string]
```

---

## 七、MVP 执行顺序

1. **TASK-A** (`FieldPicker.tsx`) — 解除 UI 锁，覆盖最核心的用户痛点，zero-DS 单测即可验证
2. **TASK-B** (`EmbedPage.tsx`) — 一行防御性检查，防止 Host 传的 `bufferSize` 被覆盖为 0
3. **TASK-C** (`client.ts`) — SDK 层支持 `bufferSize` 参数传递
4. **TASK-D** (`web-chart-config.vue`) — 按图表类型启用历史缓冲
5. **TASK-E** (`platform-fields.ts` + `types.ts`) — 增量优化：物模型 JSON 字段静态子路径提示（无运行时数据时的降级体验）
