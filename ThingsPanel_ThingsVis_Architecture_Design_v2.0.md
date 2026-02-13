# ThingsPanel × ThingsVis 集成架构诊断与设计文档 v2.0

> **版本**: 2.0.0
> **日期**: 2026-02-13
> **方法论**: architecture-diagnosis-design (6-Step Workflow)
> **范围**: 两个仓库 (`thingspanel-frontend-community` + `thingsvis`) 之间的全部集成代码

---

## 目录

1. [Step 1: 问题陈述与约束 (Intake & Constraints)](#step-1-问题陈述与约束)
2. [Step 2: 架构盘点 (Architecture Inventory)](#step-2-架构盘点)
3. [Step 3: 诊断 (Diagnosis)](#step-3-诊断)
4. [Step 4: 目标架构设计 (Target Architecture Design)](#step-4-目标架构设计)
5. [Step 5: 迁移计划 (Migration Plan)](#step-5-迁移计划)
6. [Step 6: 验证 (Validation)](#step-6-验证)

---

## Step 1: 问题陈述与约束

### 1.1 产品目标

ThingsPanel (IoT设备管理平台) 需要集成 ThingsVis (可视化编辑引擎) 来提供两种能力：

| # | 场景名称 | 白皮书称谓 | 本质 |
|---|---------|-----------|------|
| A | 物模型组件配置 | **Widget Mode** | 一个**无状态 UI 编辑器**，Host 管数据，Guest 只负责渲染和编辑 |
| B | 可视化大屏编辑 | **App Mode** | 一个**完整的 SaaS 应用**嵌入 iframe，自行管理云端数据 |

**核心需求**: 两种模式都要"彻底好"——集成稳定无 Bug，独立运行也完整。

### 1.2 症状 (Symptoms)

从近 20 次会话记录中提取的高频 Bug 类型：

| 症状 | 出现频率 | 影响 |
|------|---------|------|
| 保存 ID 不一致 (Save ID Mismatch) | 多次 | 保存后数据查不到 |
| iframe 内容截断 / 滚动失效 | 多次 | 用户无法看到完整编辑器 |
| 首页仪表板渲染异常 (Fixed/Infinite 布局) | 多次 | 预览页面白屏 |
| Token 401 / 过期 | 多次 | 编辑器加载失败 |
| 发布功能在嵌入模式异常 | 至少1次 | publish 消息丢失 |
| 独立运行模式下 Editor.tsx Hook 错误 | 至少1次 | React 报 Hook Order 异常 |

### 1.3 约束

- **不能重写 ThingsVis 核心**：Kernel、Schema、UI 包保持不变
- **不能改变 ThingsPanel 的路由结构**：路由页面保持稳定
- **必须同时兼容"独立运行"和"嵌入运行"**
- **前端无自动化测试**：验证依赖手动跑通
- **团队规模小**：所有改动需要一个人能理解和维护

---

## Step 2: 架构盘点 (Architecture Inventory)

### 2.1 仓库结构概览

```
┌───────────────────────────────────────────┐
│ thingspanel-frontend-community (Vue 3)    │
│                                           │
│  src/components/thingsvis/                │
│    ├── ThingsVisWidget.vue    ← Track A   │
│    ├── ThingsVisAppFrame.vue  ← Track B   │
│    ├── ThingsVisViewer.vue    ← 预览/首页 │
│    └── ThingsVisEditor.deprecated.vue     │
│                                           │
│  src/utils/thingsvis/sdk/                 │
│    └── client.ts              ← SDK 类    │
│                                           │
│  src/service/api/thingsvis.ts ← SSO Token │
└────────────────────┬──────────────────────┘
                     │ iframe + postMessage
┌────────────────────▼──────────────────────┐
│ thingsvis (React + Monorepo)              │
│                                           │
│  apps/studio/src/                         │
│    ├── App.tsx                 ← 路由入口 │
│    ├── components/Editor.tsx  ← ★ 2199行  │
│    ├── pages/EmbedPage.tsx    ← 535行     │
│    ├── embed/                             │
│    │   ├── embed-mode.ts      ← 通信层   │
│    │   └── embed-init.ts      ← 初始化   │
│    ├── lib/embedded/                      │
│    │   ├── host-bridge.ts     ← 保存桥接  │
│    │   ├── save-target-handler.ts         │
│    │   └── service-config.ts  ← UI 配置   │
│    ├── lib/storage/                       │
│    │   ├── saveStrategy.ts    ← 保存策略  │
│    │   └── adapter/           ← 存储适配  │
│    ├── lib/embed/                         │
│    │   └── ThingsVisEmbed.ts  ← 另一套SDK │
│    └── hooks/useStorage.ts    ← 存储Hook  │
└───────────────────────────────────────────┘
```

### 2.2 路由入口 (ThingsVis 侧)

| 路由 | 入口组件 | 职责 |
|------|---------|------|
| `/#/editor` | `Editor.tsx` | 完整编辑器 (同时服务于独立和嵌入) |
| `/#/editor/:id` | `Editor.tsx` | 编辑指定项目 |
| `/#/embed` | `EmbedPage.tsx` | 轻量预览，仅做渲染 (不含编辑器 UI) |
| `/#/preview` | `PreviewPage.tsx` | 预览模式 |
| `/#/` | `HomePage.tsx` | 项目列表 |

### 2.3 Host 端组件使用关系

| Host 组件 | 加载的 Guest 路由 | 通信方式 | 对应模式 |
|-----------|------------------|---------|---------|
| `ThingsVisWidget.vue` | `/#/editor?saveTarget=host` | SDK (`client.ts`) → `thingsvis:editor-init` | Widget |
| `ThingsVisAppFrame.vue` | `/#/editor/:id?mode=embedded&token=...` | 原生 `postMessage` (直接硬编码) | App |
| `ThingsVisViewer.vue` | `/#/embed` | 原生 `postMessage` (`LOAD_DASHBOARD`) | 预览 |

### 2.4 消息协议盘点

Guest 端（ThingsVis）实际监听的消息类型有 **3 套不重叠的协议**：

```
Protocol A: embed-mode.ts (Editor.tsx 使用)
  ├── thingsvis:editor-init          ← 初始化
  ├── thingsvis:editor-trigger-save  ← 触发保存
  ├── thingsvis:editor-event         ← 通用事件(updateData, updateSchema)
  └── thingsvis:host-save            ← 向 Host 发送保存 (outbound)

Protocol B: EmbedPage.tsx (自己直接 addEventListener)
  ├── LOAD_DASHBOARD                 ← 加载 schema
  ├── UPDATE_VARIABLES               ← 更新变量
  ├── SET_TOKEN                      ← 设置 Token
  ├── READY / LOADED / ERROR         ← 状态回调
  ├── thingsvis:editor-init          ← 兼容 Protocol A
  └── thingsvis:editor-event         ← 兼容 Protocol A

Protocol C: host-bridge.ts (又一套独立实现)
  ├── thingsvis:host-save            ← 保存到 Host (重复)
  ├── thingsvis:requestSave          ← 请求保存 (带 requestId + timeout)
  └── thingsvis:saveResponse         ← 保存响应
```

**另外**：`ThingsVisEmbed.ts`（位于 `lib/embed/`）定义了**第 4 套** SDK 接口，使用 `READY/LOADED/ERROR` + `LOAD_DASHBOARD/UPDATE_VARIABLES` 协议，与 Protocol B 类似但不完全一致。

### 2.5 保存逻辑路径盘点

当用户在编辑器中触发"保存"时，数据流经的路径：

```
Widget Mode (saveTarget=host):
  Editor.tsx → useAutoSave → DISABLED (isWidgetMode=true)
  Editor.tsx → subscribe(store) → embed-mode.requestSave() → postMessage → Host

  但同时存在:
  Editor.tsx Line 1127 → 另一个 useEffect → 监听 'thingsvis:request-save' → 手动构建 payload → postMessage

  结论: 有 2 条互不相关的保存路径

App Mode (saveTarget=self):
  Editor.tsx → useAutoSave → useStorage → cloudAdapter → ThingsVis API

  但 embed 初始化时 (Line 983):
  Editor.tsx 在 Widget 的 useEffect 里插入了 App 的云端获取逻辑 (saveTarget='self')

  结论: Widget 初始化代码里偷跑 App 逻辑
```

---

## Step 3: 诊断 (Diagnosis)

### 3.1 核心问题列表 (按严重性排序)

#### 🔴 P0: "三套协议" — 通信合约碎裂

**evidence**:
- `embed-mode.ts` (Protocol A) 由 `Editor.tsx` 使用
- `EmbedPage.tsx` (Protocol B) 自行 addEventListener
- `host-bridge.ts` (Protocol C) 又独立实现了保存和请求保存
- `ThingsVisEmbed.ts` (Protocol D) 还有一套

**impact**:
- Host 端 `ThingsVisViewer.vue` 发送 `LOAD_DASHBOARD` → 只有 EmbedPage 能收到
- Host 端 `ThingsVisWidget.vue` 发送 `thingsvis:editor-init` → 只有 Editor 能收到
- Host 端混用协议时，消息石沉大海，**无报错无提示**

**root cause**:
没有单一的 Message Router。每个组件各自 `addEventListener('message')` 各解析各的。

---

#### 🔴 P0: "God Component" — Editor.tsx 2199 行混合双模式

**evidence**:
- `isEmbedMode()` 在 Editor.tsx 中出现 **22 次**（包括注释中的逻辑引用）
- Widget 初始化 useEffect (Line 858-1039) 近 200 行，在 Widget 代码块中混入了 App 模式逻辑 (`saveTarget='self'` 云端获取)
- Line 470 有 `// Hotfix` 注释，跳过云端加载
- Line 484 有 `// Ideally: if (isEmbedMode()) { return; }` — **开发者自己都知道该拆但没拆**

**impact**:
- 改 Widget 逻辑会破坏 App 模式（因为代码互相纠缠）
- 改 App 逻辑会破坏 Widget（因为 Widget 偷跑 App 逻辑）
- 这就是**集成反复改、反复坏**的根本原因

**root cause**:
一个组件试图同时服务两种数据流模式（Host-Managed vs Self-Managed），违反了单一职责原则。

---

#### 🟠 P1: 幽灵保存通道 — 2 条并行保存路径

**evidence**:
- 路径 1: `store.subscribe()` → `requestSave()` (Line 793-856，通过 `embed-mode.ts`)
- 路径 2: `window.addEventListener('message')` → 监听 `thingsvis:request-save` (Line 1127-1156，绕开 embed-mode)

**impact**:
- 修改路径 1 的保存格式，路径 2 不会跟着变
- 二者发送的 payload 结构**不一致**（路径 1 发 exportData，路径 2 发 getProjectState）
- 导致 Host 端收到的数据结构不确定，需要大量兼容代码

---

#### 🟠 P1: 双重状态源 — canvasConfig vs kernelState

**evidence**:
- `canvasConfig` 是 React setState 管理的状态
- `kernelState` (store) 是 Zustand 管理的状态
- 二者之间通过 `useEffect` 手动同步 (Line 1180-1197)

**impact**:
- 任何一方忘了同步，就会出现"编辑器看到的"和"保存的"不一致
- 初始化时两套状态的加载顺序不确定，容易出现时序 Bug

---

#### 🟡 P2: 入口配置寻址混乱 — 4 种方式确定 ProjectID

**evidence** (Editor.tsx `resolveInitialProjectId`):
1. Route Params: `useParams().dashboardId`
2. Hash Query: `#/editor?id=xxx`
3. LocalStorage: `CURRENT_PROJECT_ID_KEY`
4. Recent Projects 列表的第一个
5. 兜底: `crypto.randomUUID()`

再加上嵌入模式下 Host 通过 `thingsvis:editor-init` 传来的 `meta.id`...

**impact**:
- 曾经出现的 "Save ID Mismatch" Bug 正是因为 resolveInitialProjectId 先算了一个 ID，然后 Host 的 init 消息又覆盖了一个 ID，但保存时用的是哪一个取决于时序。

---

#### 🟡 P2: "两套 SDK" 并存

**evidence**:
- `src/utils/thingsvis/sdk/client.ts` (291行) — Host 端 SDK，被 ThingsVisWidget.vue 使用
- `src/lib/embed/ThingsVisEmbed.ts` (233行) — 另一套独立 SDK，使用 Protocol B

**impact**:
- 维护者不知道该用哪一套
- 新场景接入时无法参考"标准做法"

---

#### 🟡 P2: EmbedPage.tsx 与 Editor.tsx 重复实现平台数据桥接

**evidence**:
- EmbedPage.tsx (Line 410-418): `window.postMessage({ type: 'thingsvis:platformData', ... })`
- Editor.tsx (Line 942-948): 完全相同的代码
- embed-mode.ts (Line 52-63): **又做了一遍相同的事**

**impact**:
同一条实时数据被转发 2~3 次，可能导致组件重渲染抖动。

---

#### 🟠 P1: Base64 缩略图膨胀 — 导致编辑器"闪一下默认页面"

**用户可见症状**:

ThingsPanel → 可视化 → 打开一个仪表板编辑器时，**先看到一个默认空白编辑器**，大约 1-3 秒后才看到真正的内容。这不是简单的加载慢——是 **"闪烁"——从默认状态跳变到真实状态**。

**数据流路径分析**:

```
ThingsPanel (Host)                              ThingsVis (Guest)
─────────────────                              ──────────────────
ThingsVisAppFrame.vue
  ├── getThingsVisToken()   ← SSO 交换 (~200ms)
  └── 构造 iframe URL:
      /main#/editor/{id}?mode=embedded&token={token}
                                                Editor.tsx
                                                  ├── resolveInitialProjectId()
                                                  │   → 拿到 dashboardId
                                                  ├── 🟡 先渲染 DEFAULT canvasConfig
                                                  │   (空白编辑器立刻出现)
                                                  │
                                                  └── useEffect → bootstrap
                                                      ├── storage.get(projectId)
                                                      │   → GET /api/v1/dashboards/{id}
                                                      │   → 响应 payload 包含:
                                                      │     {
                                                      │       name, canvasConfig, nodes,
                                                      │       dataSources,
                                                      │       thumbnail: "data:image/jpeg;base64,/9j/4A..."
                                                      │                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                      │                   ~50-200KB 的纯文本 Base64 字符串
                                                      │     }
                                                      │
                                                      ├── 🔴 JSON.parse() 整个响应 (~300KB-2MB)
                                                      │   → 网络传输慢 + 解析慢
                                                      │
                                                      └── setCanvasConfig({...loaded...})
                                                          → 🟢 真实编辑器内容出现 (闪烁!)
```

**问题拆解**:

| # | 问题 | 证据 | 影响 |
|---|------|------|------|
| T1 | **缩略图与主数据耦合** | `GET /dashboards/{id}` 一次性返回 `thumbnail` + `nodes` + `canvasConfig` | 响应体膨胀 50-200KB，增加首次传输时间 |
| T2 | **缩略图未压缩** | `thumbnail.ts` 的 `processThumbnailFile()` 只在用户上传时处理 (Line 285-316)，`compressThumbnail()` 需要 `HTMLCanvasElement` 参数——**自动保存时从不调用** | 编辑器自动生成的截图直接存为 JPEG 0.7 quality、128×72 尺寸，但未验证结果大小 |
| T3 | **Schema 校验限制过大** | `schemas.ts` 定义 `thumbnail: z.string().max(70000).optional()` — 允许 **70KB** 的 Base64 | 即使有压缩工具也形同虚设，因为限制值太大 |
| T4 | **保存时 thumbnail 嵌入 payload** | `cloudAdapter.save()` (Line 107): `thumbnail: project.meta.thumbnail` 随每次 `updateDashboard` 一起发送 | 每次 auto-save（10秒间隔）都把 50-200KB 的缩略图重新上传——浪费带宽 |
| T5 | **列表页也受影响** | `thingsvis-dashboards/index.vue` (Line 117): 判断 `item.thumbnail.length > 1000` 才跳过加载 — 说明**列表 API 有时也返回大 thumbnail** | 仪表板列表页加载也被拖慢 |
| T6 | **App Mode 初始化的竞态** | `Editor.tsx` 先用 `resolveInitialProjectId()` 渲染默认 UI，然后 `useEffect` 异步加载云端数据 → **渲染两次** | 用户看到"闪烁"：默认空白 → 真实内容跳变 |

**根因总结**:

1. **缩略图存储方案有缺陷**: 用 Base64 内嵌数据库字段，而非独立存储（如文件系统/OSS/独立 API）
2. **缩略图随主数据同传**: 没有分离 thumbnail 的获取路径——Dashboard 列表和详情 API 都会连带 thumbnail 返回
3. **未做自动压缩**: 只有手动上传有压缩，自动截图和保存透传不做压缩
4. **前端未做骨架屏**: Editor.tsx 在数据未就绪时直接渲染默认 canvasConfig，没有 loading 状态

**影响量化估算**:

| 场景 | 无 thumbnail | 有 thumbnail (128×72, JPEG 0.7) | 有 thumbnail (未压缩/大图) |
|------|-------------|-------------------------------|--------------------------|
| Dashboard 详情 API 响应体 | ~20-80KB | ~25-100KB (+5-20KB) | ~100-300KB (+80-200KB) |
| Auto-save 每次上传 | ~20KB | ~40-100KB | ~100-300KB |
| 仪表板列表 (10个) | ~5KB | ~50-200KB | ~800KB-2MB |

---

### 3.3 缩略图问题的目标方案 (Thumbnail Fix Design)

#### 方案 A: 短期修复 (可立即实施, 不改后端)

| # | 措施 | 实现位置 | 效果 |
|---|------|---------|------|
| T-FIX-1 | **自动压缩**: 在 `getProjectState()` 中保存前，对 thumbnail 做二次压缩 — 如果 Base64 长度 > 10KB，自动缩尺寸到 64×36、降 quality 到 0.5 | `Editor.tsx` Line 394 (`getProjectState`) | 缩略图从 ~50KB 降到 ~3-5KB |
| T-FIX-2 | **懒传 thumbnail**: `cloudAdapter.save()` 中，仅在 thumbnail 变化时传递（对比前后值），否则不发送 | `cloudAdapter.ts` Line 102 | auto-save 减少 50-200KB/次 |
| T-FIX-3 | **渲染加 loading 态**: 在 bootstrap 完成前，显示骨架屏而非默认 canvasConfig | `Editor.tsx` (已有 `isBootstrapping` state, 但 UI 仍然渲染默认值) | 消除"闪烁" |
| T-FIX-4 | **列表 API 不返回 thumbnail**: 后端 `/dashboards` 列表接口排除 thumbnail 字段，前端用独立的 `GET /dashboards/{id}/thumbnail` 懒加载 | `thingsvis-dashboards/index.vue` (已部分实现, Line 107-136) | 列表加载提速 |

#### 方案 B: 长期方案 (需改后端)

| # | 措施 | 说明 |
|---|------|------|
| T-LONG-1 | **缩略图独立存储**: 后端将 thumbnail 存到文件系统/OSS，DB 只存 URL | 彻底解耦，API 响应体不再包含 Base64 |
| T-LONG-2 | **后端自动生成缩略图**: 保存 dashboard 后，后端用 Puppeteer/Sharp 异步生成缩略图 | 前端不再负责截图，缩略图质量一致 |
| T-LONG-3 | **CDN 缓存**: 缩略图 URL 走 CDN，带缓存头 | 二次加载秒出 |

#### 短期修复实现细节:

**T-FIX-1: 自动压缩函数**

```typescript
// lib/storage/thumbnail.ts — 新增函数

/**
 * 压缩 Base64 缩略图字符串
 * 如果已经足够小 (<= maxBytes)，直接返回
 * 否则通过 Canvas 重绘降质量
 */
export async function compressThumbnailBase64(
  base64Str: string,
  maxBytes: number = 10000  // 10KB
): Promise<string> {
  if (!base64Str || base64Str.length <= maxBytes) return base64Str;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // 缩到 64×36 (比当前 128×72 更小)
      canvas.width = 64;
      canvas.height = 36;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(base64Str); return; }

      ctx.drawImage(img, 0, 0, 64, 36);

      // 递减 quality 直到满足大小要求
      let quality = 0.6;
      let result = canvas.toDataURL('image/jpeg', quality);
      while (result.length > maxBytes && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(result);
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
}
```

**T-FIX-3: 骨架屏 (消除闪烁)**

```tsx
// Editor.tsx — 在 bootstrap 阶段显示 loading 而非默认编辑器
if (isBootstrapping) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">加载项目中...</p>
      </div>
    </div>
  );
}
```

---

### 3.2 依赖关系图 (Dependency Overview)

```
ThingsVisWidget.vue ──→ client.ts ──→ iframe ──→ Editor.tsx
                                                    ↓
                                               embed-mode.ts
                                               embed-init.ts
                                               saveStrategy.ts
                                               host-bridge.ts (unused by Widget?)
                                               service-config.ts

ThingsVisAppFrame.vue ──→ (raw postMessage) ──→ iframe ──→ Editor.tsx
                                                             ↓
                                                        (same mess)

ThingsVisViewer.vue ──→ (raw postMessage) ──→ iframe ──→ EmbedPage.tsx
                                                            ↓
                                                       (own message listener)
                                                       (duplicates platformData bridge)
```

**关键发现**: `host-bridge.ts` 和 `save-target-handler.ts` 实际上**没有被 Widget 流程使用**——Widget 保存走的是 `embed-mode.ts` 的 `requestSave()`。这两个文件是"幽灵代码"。

---

## Step 4: 目标架构设计 (Target Architecture Design)

### 4.1 设计原则

1. **物理隔离**: Widget 和 App 的代码路径不允许在同一个文件中交叉
2. **单一协议**: 所有 postMessage 通信经过同一个 Message Router
3. **单一状态源**: 消除 canvasConfig 和 kernelState 的双重管理
4. **SDK 归一**: Host 端只有一套 SDK，Guest 端只有一个入口

### 4.2 目标架构

```
┌─────────────────────────────────────────────────┐
│ thingspanel-frontend-community                  │
│                                                 │
│  ThingsVisWidget.vue ──┐                        │
│  ThingsVisAppFrame.vue ─┼→ ThingsVisSDK (统一)  │
│  ThingsVisViewer.vue  ──┘   └→ 协议标准化        │
└────────────────────────────┬────────────────────┘
                             │ iframe + postMessage
                             │ (唯一通信协议)
┌────────────────────────────▼────────────────────┐
│ thingsvis/apps/studio                           │
│                                                 │
│  App.tsx (路由)                                  │
│    ├── /editor/:id     → EditorShell.tsx         │
│    │                       ├── 检测模式           │
│    │                       ├── App? → AppEditor   │
│    │                       └── Widget?→ WidgetEd  │
│    │                                              │
│    ├── /embed/:id      → EmbedPage.tsx (纯预览)   │
│    └── /preview/:id    → PreviewPage.tsx          │
│                                                   │
│  ┌─ strategies/ ──────────────────────────────┐   │
│  │                                            │   │
│  │  EditorStrategy.ts (interface)             │   │
│  │    ├── AppModeStrategy.ts                  │   │
│  │    │   ├── load(): Cloud API               │   │
│  │    │   ├── save(): Cloud API               │   │
│  │    │   └── 不导入任何 embed 模块            │   │
│  │    │                                       │   │
│  │    └── WidgetModeStrategy.ts               │   │
│  │        ├── load(): 等待 Host init 消息      │   │
│  │        ├── save(): postMessage to Host     │   │
│  │        └── 不导入任何 cloud API 模块        │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  ┌─ embed/ ───────────────────────────────────┐   │
│  │  message-router.ts (唯一通信中心)           │   │
│  │    ├── 注册消息处理器                        │   │
│  │    ├── 类型安全的消息分发                     │   │
│  │    └── 日志 / 错误上报                       │   │
│  └────────────────────────────────────────────┘   │
│                                                   │
│  废弃文件:                                         │
│    ❌ embed-mode.ts (合并入 message-router)        │
│    ❌ embed-init.ts (合并入 WidgetModeStrategy)    │
│    ❌ host-bridge.ts (合并入 message-router)       │
│    ❌ save-target-handler.ts (删除)                │
│    ❌ ThingsVisEmbed.ts (删除, 功能由 SDK 覆盖)    │
└───────────────────────────────────────────────────┘
```

### 4.3 核心设计决策

#### ADR-1: 使用 Strategy Pattern 拆分 Editor

**决策**: 将当前 2199 行的 `Editor.tsx` 拆为：
- `EditorShell.tsx` (~300行): 纯 UI 外壳 (Toolbar, Canvas, Panels)
- `AppModeStrategy.ts` (~200行): 云端数据管理
- `WidgetModeStrategy.ts` (~200行): Host 通信管理

**理由**:
- 物理隔离 > 运行时判断。编译器能检查的错误不要留到运行时。
- Widget 文件中 `import` 不了 CloudAdapter → 想调 API 也不行 → 编译报错。

**替代方案 (不采用)**: 继续用 `isEmbedMode()` 做运行时判断。
- 缺点：已经证明了 22 处 `isEmbedMode()` 检查无法阻止逻辑泄漏。

---

#### ADR-2: 统一消息协议

**决策**: 合并 4 套协议为 1 套，由 `message-router.ts` 统一管理。

| 消息类型 | 方向 | 触发场景 |
|---------|------|---------|
| `tv:init` | Host→Guest | Widget 初始化 |
| `tv:save-request` | Host→Guest | Host 主动请求保存 |
| `tv:save-response` | Guest→Host | 保存数据回传 |
| `tv:push-data` | Host→Guest | 实时数据推送 |
| `tv:update-schema` | Host→Guest | 字段定义更新 |
| `tv:ready` | Guest→Host | Guest 就绪 |
| `tv:error` | Guest→Host | 错误上报 |
| `tv:load-dashboard` | Host→Guest | 加载 schema (预览) |

**理由**:
- 前缀统一为 `tv:` 避免命名空间冲突
- 消除 `LOAD_DASHBOARD` / `thingsvis:editor-init` / `READY` / `thingsvis:ready` 等同义消息
- `message-router.ts` 提供类型安全和日志

---

#### ADR-3: 消除双重状态

**决策**: 废弃 `canvasConfig` React state，所有画布配置直接存入 Kernel Store。

**理由**:
- 当前 `canvasConfig` 和 `store.canvas` 之间的手动同步代码 (Line 1180-1197) 是 Bug 温床
- Kernel Store (Zustand) 已经支持 canvas 作为 first-class state

---

### 4.4 EditorStrategy 接口定义

```typescript
// strategies/EditorStrategy.ts

export interface EditorStrategy {
  /** 模式标识 */
  mode: 'app' | 'widget';

  /**
   * 初始化: 加载项目数据到 Store
   * AppMode: 从 Cloud API 加载
   * WidgetMode: 等待 Host postMessage
   */
  bootstrap(store: KernelStore, projectId: string): Promise<void>;

  /**
   * 保存: 持久化当前状态
   * AppMode: PUT /api/v1/projects/:id
   * WidgetMode: postMessage({ type: 'tv:save-response', payload })
   */
  save(store: KernelStore): Promise<void>;

  /**
   * 获取 UI 可见性配置
   * AppMode: 全部显示
   * WidgetMode: 根据 URL 参数决定
   */
  getUIVisibility(): UIVisibilityConfig;

  /**
   * 清理: 卸载时释放资源
   * WidgetMode: 移除 message listener
   */
  dispose(): void;
}
```

### 4.5 SDK 统一设计 (Host 端)

```typescript
// ThingsVisSDK (client.ts 重构后)

export class ThingsVisClient {
  constructor(options: {
    container: HTMLElement;
    mode: 'widget' | 'app' | 'viewer';
    url: string;
  });

  // ─── Widget Mode ───
  loadConfig(config: WidgetConfig): void;
  onSave(callback: (config: WidgetConfig) => void): void;
  pushData(data: Record<string, any>): void;
  updateFields(fields: PlatformField[]): void;
  requestSave(): void;

  // ─── App Mode ───
  setToken(token: string): void;

  // ─── Viewer Mode ───
  loadDashboard(schema: DashboardSchema): void;

  // ─── Common ───
  on(event: string, handler: Function): void;
  destroy(): void;
}
```

---

## Step 5: 迁移计划 (Migration Plan)

### Phase 0: 稳定化与可观测性 (1-2天)

**目标**: 不改架构，先止血，给后续改动建立安全网。

| # | 任务 | 风险 |
|---|------|------|
| 0.1 | 在 `message-router.ts` 中添加统一的消息日志 (仅新增文件，不改现有代码) | 零风险 |
| 0.2 | 给 Editor.tsx 中的每个 useEffect 添加生命周期日志 (仅 console 输出) | 零风险 |
| 0.3 | 创建手动测试 Checklist (see Step 6) | 零风险 |

**回滚策略**: 此阶段仅新增文件和日志，删除即可回滚。

---

### Phase 1: 边界隔离与提取 (3-5天)

**目标**: 实现 Strategy Pattern，将 Editor.tsx 从 2199 行缩减到 ~800 行。

| # | 任务 | 风险 | 回滚 |
|---|------|------|------|
| 1.1 | 创建 `EditorStrategy.ts` 接口 | 低 | 删除文件 |
| 1.2 | 提取 `AppModeStrategy.ts`: 将 bootstrap/save 的云端逻辑从 Editor 迁出 | **中** | git revert |
| 1.3 | 提取 `WidgetModeStrategy.ts`: 将 embed 初始化/保存的 postMessage 逻辑迁出 | **中** | git revert |
| 1.4 | 创建 `EditorShell.tsx`: 保留纯 UI 渲染，通过 `useEditorStrategy()` hook 获取策略 | **高** | git revert |
| 1.5 | 在 `App.tsx` 中将 `/editor` 路由指向 EditorShell | 低 | 改回 Editor |

**执行顺序**:
```
1.1 → 1.2 → 1.3 → 验证独立运行 → 1.4 → 1.5 → 全量验证
```

**风险缓解**:
- 每一步完成后跑一次完整的手动 Checklist
- 保留旧 `Editor.tsx` 作为 fallback，新路由生效后再删除
- Phase 1.2 和 1.3 可以**并行开发** (互不依赖)

---

### Phase 2: 数据归属与合约 (2-3天)

**目标**: 统一消息协议，消除双重状态。

| # | 任务 | 风险 |
|---|------|------|
| 2.1 | 创建 `message-router.ts`，定义类型安全的消息类型 | 低 |
| 2.2 | 迁移 Widget 通信到统一协议 (Host SDK + Guest MessageRouter) | **中** |
| 2.3 | 迁移 Viewer 通信到统一协议 (ThingsVisViewer → 使用 SDK) | 低 |
| 2.4 | 废弃 `canvasConfig` state，改写为直接读取 Kernel Store | **中** |

**回滚策略**: 每个子任务一个 commit，可单独 revert。

---

### Phase 3: 清理与性能 (1-2天)

**目标**: 删除废弃代码，确保代码库干净。

| # | 任务 |
|---|------|
| 3.1 | 删除旧 `Editor.tsx` (已被 EditorShell 替代) |
| 3.2 | 删除 `embed-mode.ts`、`embed-init.ts`、`host-bridge.ts`、`save-target-handler.ts` |
| 3.3 | 删除 `ThingsVisEmbed.ts` (lib/embed/) |
| 3.4 | 删除 `ThingsVisEditor.deprecated.vue` |
| 3.5 | 合并 `saveStrategy.ts` 到对应 Strategy 文件中 |
| 3.6 | 更新本白皮书文档为 v2.1 (标记为已完成) |

---

## Step 6: 验证 (Validation)

### 6.1 手动测试 Checklist

#### Track A: Widget Mode (物模型组件)

| # | 测试步骤 | 预期结果 | Pass? |
|---|---------|---------|-------|
| A1 | ThingsPanel → 设备模板 → Web 图表配置 → 打开编辑器 | Editor 加载成功，使用 WidgetModeStrategy | ☐ |
| A2 | 拖入一个图表组件 | 组件渲染正常 | ☐ |
| A3 | 修改组件属性 | 属性面板实时反映变化 | ☐ |
| A4 | 点击保存 → 检查 Console | 应看到 `tv:save-response`，**不应**看到 `PUT /api/v1/projects` | ☐ |
| A5 | 检查 Network Tab | **零** ThingsVis API 调用 (除了静态资源) | ☐ |
| A6 | 关闭编辑器 → 重新打开 | 之前保存的组件应恢复 (Host 管理数据) | ☐ |
| A7 | 推送实时数据 (如果有绑定) | 组件数值实时更新 | ☐ |

#### Track B: App Mode (可视化大屏)

| # | 测试步骤 | 预期结果 | Pass? |
|---|---------|---------|-------|
| B1 | ThingsPanel → 可视化 → 新建大屏 | Editor 加载成功，使用 AppModeStrategy | ☐ |
| B2 | 拖入多个组件 | 组件渲染正常 | ☐ |
| B3 | 等待 3 秒 (Auto-Save 触发) | Console 显示 Auto-Save completed | ☐ |
| B4 | 检查 Network Tab | 应看到 `PUT /api/v1/projects/:id` | ☐ |
| B5 | 点击预览 | 新标签页打开预览，渲染正确 | ☐ |
| B6 | 点击发布 | 发布成功提示 | ☐ |
| B7 | 关闭 → 重新打开 | 所有组件和配置恢复 | ☐ |

#### Track C: 独立运行 (ThingsVis Standalone)

| # | 测试步骤 | 预期结果 | Pass? |
|---|---------|---------|-------|
| C1 | 直接打开 `localhost:3000` | 首页项目列表正常 | ☐ |
| C2 | 不登录 → 新建项目 | 使用 IndexedDB 保存 | ☐ |
| C3 | 登录 → 新建项目 | 使用 Cloud API 保存 | ☐ |
| C4 | 所有工具栏按钮可用 | 无 UI 残缺 | ☐ |
| C5 | Undo/Redo 正常 | 历史记录无异常 | ☐ |

#### Track D: 预览 (Viewer)

| # | 测试步骤 | 预期结果 | Pass? |
|---|---------|---------|-------|
| D1 | ThingsPanel 首页 → 仪表板预览 | ThingsVisViewer 加载，内容渲染正确 | ☐ |
| D2 | Grid 布局仪表板 | 正常渲染，自适应宽度 | ☐ |
| D3 | Fixed 布局仪表板 | 正常渲染，fullWidthPreview 生效 | ☐ |
| D4 | 窗口缩放 | 布局自适应，无截断 | ☐ |

### 6.2 架构适配度检查 (Architecture Fitness Functions)

| 检查项 | 规则 | 自动化可行性 |
|--------|------|-------------|
| Widget 无 Cloud API 导入 | `WidgetModeStrategy.ts` 不 import `adapter/cloudAdapter` | `grep -r` |
| AppMode 无 postMessage 发送 | `AppModeStrategy.ts` 不 import `embed-mode` | `grep -r` |
| 消息类型未碎片化 | 所有 `postMessage` 调用都经过 `message-router.ts` | `grep -r` |
| Editor 行数 < 1000 | `EditorShell.tsx` 不超过 1000 行 | `wc -l` |
| `isEmbedMode()` 调用次数 | 整个 `components/` 目录下 0 次 | `grep -c` |

### 6.3 成功标准

完成迁移后，以下条件必须全部满足：

1. ✅ Track A-D 所有 Checklist 通过
2. ✅ `isEmbedMode()` 在 `components/` 目录下出现 **0 次**
3. ✅ `Editor.tsx` (或 `EditorShell.tsx`) 行数 < **1000 行**
4. ✅ 消息协议只有 **1 套** (`tv:*` 前缀)
5. ✅ Host 端 SDK 只有 **1 个** (`client.ts`)
6. ✅ 无 `// Hotfix` 注释残留

---

## 附录: 文件影响范围清单

### 将被修改的文件

| 文件 | 修改类型 | 所属阶段 |
|------|---------|---------|
| `Editor.tsx` | 大幅精简 → `EditorShell.tsx` | Phase 1 |
| `App.tsx` | 路由调整 | Phase 1 |
| `client.ts` (Host SDK) | 协议迁移 | Phase 2 |
| `ThingsVisWidget.vue` | 使用新 SDK API | Phase 2 |
| `ThingsVisAppFrame.vue` | 使用新 SDK API | Phase 2 |
| `ThingsVisViewer.vue` | 使用新 SDK API | Phase 2 |

### 将被新增的文件

| 文件 | 所属阶段 |
|------|---------|
| `strategies/EditorStrategy.ts` | Phase 1 |
| `strategies/AppModeStrategy.ts` | Phase 1 |
| `strategies/WidgetModeStrategy.ts` | Phase 1 |
| `components/EditorShell.tsx` | Phase 1 |
| `hooks/useEditorStrategy.ts` | Phase 1 |
| `embed/message-router.ts` | Phase 2 |

### 将被删除的文件

| 文件 | 所属阶段 |
|------|---------|
| `embed/embed-mode.ts` | Phase 3 |
| `embed/embed-init.ts` | Phase 3 |
| `lib/embedded/host-bridge.ts` | Phase 3 |
| `lib/embedded/save-target-handler.ts` | Phase 3 |
| `lib/embed/ThingsVisEmbed.ts` | Phase 3 |
| `ThingsVisEditor.deprecated.vue` | Phase 3 |
| `Editor.tsx` (旧版) | Phase 3 |
