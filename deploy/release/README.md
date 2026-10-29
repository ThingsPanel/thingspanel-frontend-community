# Release 构建

发布带 v 前缀的明确版本 Release 后，两个工作流分别构建静态包、双架构镜像。工具版本与测试部署一致：Node 20.19.0、pnpm 10.8.0，使用冻结锁文件并保留完整类型检查。手工触发必须指定已有发布标签，不猜最新标签。

前端先发布并等待镜像/静态包成功，再发布后端同版本。镜像成功后附加 frontend-image.json，记录源码提交及三个仓库的摘要；后端 Linux 打包流程依此核对同版本前端，不混用 latest。

镜像 Nginx 要求同网络 backend:9999、encore-api:14000、notification-core:18091、thingsvis-studio:3000、thingsvis-server:8000。/automation-core 剥前缀转发；内部服务路径拒绝浏览器访问。新增代理只影响容器镜像，测试服现行宿主机 Nginx 不因此改变。

未执行真实 Release、镜像构建和推送；发布时检查 Docker Image Build 与 Build and Release 两项结果。
