# main-1.3.0 原生物模型合并

用户确认的目标：从社区当前主线建立独立 main-1.3.0 测试分支，合入原生物模型。使用独立新数据库做后续服务器测试，不以旧库迁移为此次代码合并前置条件。本次未操作服务器。

## 来源与冲突

- base：origin/master e49f49acca69d318cf9ed32976e98bae8f97539c。
- candidate：origin/codex/native-device-metadata ee5aab55ba604165d99a07734d92b2705e97e0c1。
- ThingsVisAppFrame.vue 字段请求冲突采用原生绑定快照路径，保留主线 mapFieldIds 对未声明遥测字段的处理；移除合并后没有调用方的 mergeDeviceFields。
- 后端同名分支合并提交：99c17f621c144fb2e890a5833ee64021330ac4a2。
- 配套 Encore 候选：37fbb5e8e83c47fa98a1eea59fefa38ceff97737；不在这次前后端两仓的合并范围内。

## 验证

- 锁定 pnpm 10.8.0，pnpm install --frozen-lockfile 成功；未修改依赖锁文件。
- 通过：tsx --test 运行原生 API、绑定传输、字段映射、模型资源、设备模型契约、图表初始化、服务设备导入七个测试文件，42 项全部通过。
- 全仓 vue-tsc --noEmit --skipLibCheck：主线 1233 条，合并分支 1223 条，均 exit 2。两者使用同一安装的依赖；主线在独立 detached worktree 中检查。
- 对照忽略诊断行列变化、共享依赖工作区路径变化，以及旧路由报错中因新增路由产生的目标联合类型变化后，未发现新的诊断签名；不能将此视为全仓类型检查成功。
- 通过：NODE_OPTIONS=--max-old-space-size=8192 VITE_SERVICE_ENV=prod vite build；清空自动登录环境变量，产物在 dist。存在既有组件重名及图标加载警告。该命令验证 bundle，不代表含 typecheck 门禁的 npm run build 通过。

日志保存在两仓父目录：frontend-native-tests.log、frontend-main-typecheck.log、frontend-merged-typecheck.log、frontend-typecheck-diff.json、frontend-production-build.log。

预提交 lint-staged 会自动修改大量合入文件；本次保留候选代码格式，使用上述明确检查记录验证，不运行全仓自动修复。现有自动部署仅监听 master，未新增 main-1.3.0 自动部署。

## 后续环境验收

配套后端及 Encore、鉴权、接口转发、固定快照读取、设备消息和命令、市场完整往返需在测试服务器验证。市场旧包、新包的兼容边界及后台无用户会话命令限制见后端交付说明。
