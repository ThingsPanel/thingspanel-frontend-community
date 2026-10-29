# ThingsPanel 社区前端仓库导航

本仓库是社区版管理界面，使用 Vue、TypeScript、Vite 和 pnpm workspace。页面对接社区后端、Encore 原生服务及市场相关接口。

## 目录地图

| 路径 | 用途 |
| --- | --- |
| `src/main.ts`、`src/App.vue` | 应用启动与根组件 |
| `src/views/` | 设备、物模型、看板、告警、自动化、资源中心等业务页面 |
| `src/components/`、`src/layouts/` | 公共组件与页面布局 |
| `src/router/` | 路由、菜单和守卫，含 `routes/`、`guard/`、`elegant/` |
| `src/service/api/`、`src/service/request/` | 业务 API 与请求封装；`src/service/` 还包含其他服务适配 |
| `src/store/`、`src/hooks/` | 状态管理和组合逻辑 |
| `src/core/`、`src/plugins/`、`src/utils/` | 核心能力、插件初始化与工具 |
| `src/config/`、`src/constants/`、`src/enum/`、`src/typings/` | 配置、常量、枚举和类型声明 |
| `src/locales/` | 国际化文本 |
| `src/assets/`、`src/styles/`、`src/theme/`、`public/` | 图片、样式、主题和直接发布的静态资源 |
| `packages/` | 工作区共享子包，如请求封装、工具、脚本与样式预设 |
| `build/`、`vite.config.ts`、`env.config.ts` | 构建插件、Vite 配置和环境配置 |
| `tests/`、`src/__tests__/`、业务目录测试文件 | 回归测试与模块测试 |
| `scripts/`、`.github/workflows/`、`docs/`、`.ai/` | 辅助脚本、CI、文档与已有任务记录 |
| `node_modules/`、`dist/` | 安装依赖与生成的构建产物，不作为源码修改入口 |

## 从哪里开始查

- 页面问题从 `src/views/` 找入口，再追踪组件、状态和 `src/service/` 的实际请求。
- 登录、刷新、菜单丢失等问题先看 `src/router/guard/`、路由注册与 `src/store/`。
- API 字段先核对请求映射和后端契约；区分社区后端与 Encore API，不在页面中猜测或补造业务状态。
- 修改文案同步检查 `src/locales/`，已有任务背景查 `.ai/` 与 `docs/`。

## 开发与验证

- 社区主线测试服自动部署说明：[部署入口](deploy/community-test/README.md)。`master` 推送必须先通过完整类型检查、回归和生产构建。

- 在仓库根目录用 Windows/PowerShell 执行；依赖管理以 `package.json`、`pnpm-lock.yaml` 和 `pnpm-workspace.yaml` 为准。
- 常用入口为 `pnpm dev`、`pnpm typecheck`、`pnpm build`；`build` 会先做类型检查。
- 修改后运行对应回归测试和必要的类型/构建检查；现有候选 CI 会比较基线类型诊断，不能把全量历史错误直接归因于本次改动。
- `pnpm lint` 对应脚本包含 `--fix`，会修改文件，使用前确认范围。
- 临时日志与对比数据按上级工作区 `AGENTS.md` 存放，任务结束清理；保留正常开发所需依赖和环境配置。

## 测试范围与效率

- 根据本次改动和风险选择最少且有效的验证，优先相关包、受影响路径和关键业务边界。
- 文档、注释、轻微样式等低风险改动以必要检查为主，不新增只复述实现的测试。
- 不运行无关测试，不为凑覆盖率增加测试，不反复运行已通过且未受后续改动影响的检查。
- 涉及数据、权限、接口契约、并发或状态流转时，保留能证明正确性的必要回归；不能以节省 token 为由跳过关键验证。
- 检查通过后继续交付；只有出现新改动、失败或未解决风险时才扩大测试。输出只报告结论与必要错误摘要，减少时间和 token 消耗。
