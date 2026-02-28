# 任务需求说明 (Task Specification)

## 1. 任务边界
本次任务旨在将 ThingsPanel-前端项目与 ThingsVis-可视化集成时的通信方式进行重构：
- **移除** 敏感信息（如 Token、API URL 和复杂的配置字段）在 URL Query Parameter 中的传递。
- **引入** 使用 `postMessage` 事件总线作为完整的沙箱级联通信机制，完成诸如初始化配置、传递鉴权 Token 的流程。

## 2. 子任务拆分

### 子任务 1: 重构 ThingsVis 中的 Embed 初始化逻辑 (Guest 端)
- 在 ThingsVis `message-router.ts` 中增强对 `tv:init` 消息的处理，支持在消息体中直接接收 `token` 和 `apiBaseUrl`。
- 移除只依赖 URL Query Parameter 获取 token 和 apiBaseUrl 的限制，变为支持从 `postMessage` 获取并在接收时自动配置 `configureEmbedApiClient(token, baseUrl)`。

### 子任务 2: 重构 ThingsPanel 的 URL 构建和 Iframe 挂载逻辑 (Host 端)
- 修改 `src/utils/thingsvis/url-builder.ts`，不再将 `token`、`apiBaseUrl`、`platformFields` 拼接到 URL 字符串中。仅保留环境判断的简单标识（如 `mode=embedded`）。
- 梳理对应的组件（如 `ThingsVisWidget.vue` / `ThingsVisAppFrame.vue` 等使用 Iframe 的入口），在 iframe `load` 事件后（或接收到 Guest 端的 `READY` 信号后），向子 iframe 发送带 Token 信息的 `postMessage`。

## 3. 验收标准
- [x] `url-builder.ts` 构建的最终 URL 取消掉了 `token` 字段的拼接，URL 不再冗长且不会泄露敏感信息。
- [x] ThingsVis 集成页面能够正常渲染，不报错 401。
- [x] SSO Token 及其它初始化参数均通过安全的事件总线成功在 Iframe 间传递。
