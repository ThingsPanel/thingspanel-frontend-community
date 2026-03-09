# 技术实现计划 (Implementation Plan)

## 核心实现路径

### 步骤 1: ThingsVis 响应逻辑支持 (apps/studio/src/embed/message-router.ts 等)
- 在 `processEmbedInitPayload` 和针对 `tv:init` (或者特定的 `TV_SET_CREDENTIALS` 消息) 的事件处理器中，支持提取传入的 `token`。
- 调用 `configureEmbedApiClient` 实现 API 层鉴权注册。

### 步骤 2: ThingsPanel 构建器精简 (src/utils/thingsvis/url-builder.ts)
- 从构建参数 `params.set('token', ...)` 移除。
- 可以增加一个包装方法，用于统一发送初始化 Message（如将原来需要挂载的 `platformFields`、`token` 聚合到 `postMessage` 内发给 iframe 的 `contentWindow`）。

### 步骤 3: ThingsPanel Iframe 发送侧整合 (Vue 组件)
- 通过监听 Iframe onload 或 ThingsVis 端发回的 `READY` 消息，立刻调取 `url-builder.ts` 或对应封装发送初始化 Payload `messageRouter.send('tv:init', { token, apiBaseUrl, ... })`。

## 关键代码预期变更
- `url-builder.ts` (Host)
- `message-router.ts` 或相关入口 (Guest)

## 验证方法
1. [x] 查看控制台 URL，验证不再包含 `token=` 串。
2. [x] 捕获 Network 检查 8000 端口（或其他后端代理端口）API 请求时是否正常携带有 `Bearer Token`。
3. [x] 页面的 Widget 或 DataSource 数据回显正常，代表 Token 传达成功。

🟢 **开发与全链路测试均已验证通过。**
