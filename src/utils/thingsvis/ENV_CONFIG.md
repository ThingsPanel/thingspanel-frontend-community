# ThingsVis 环境配置说明

## 环境变量

在项目根目录的 `.env` 或 `.env.local` 文件中添加以下配置：

```bash
# ThingsVis 编辑器画布地址 (用于嵌入 iframe)
VITE_THINGSVIS_STUDIO_URL=http://localhost:3000/main#/editor

# ThingsVis SSO API 地址 (用于 Token 交换)
VITE_THINGSVIS_API_URL=http://localhost:3001
```

## 服务地址说明

- **localhost:3001** - ThingsVis 后端 API 服务
  - SSO Token 交换: `POST http://localhost:3001/api/v1/auth/sso`
  - 其他 API 接口

- **localhost:3000** - ThingsVis 前端编辑器
  - 编辑器画布: `http://localhost:3000/main#/editor`
  - 嵌入模式: `http://localhost:3000/main#/editor?mode=embedded&token=...`

## 生产环境配置示例

```bash
# 生产环境配置
VITE_THINGSVIS_STUDIO_URL=https://studio.thingsvis.com/main#/editor
VITE_THINGSVIS_API_URL=https://api.thingsvis.com
```

## 默认值

如果未设置环境变量，将使用以下默认值：
- `VITE_THINGSVIS_STUDIO_URL`: `http://localhost:3000/main#/editor`
- `VITE_THINGSVIS_API_URL`: `http://localhost:3001`

## 验证配置

启动项目后，在浏览器控制台查看：
```javascript
// 查看 SSO API 地址
// 应该输出: http://localhost:3001
```

Token 交换时会请求: `http://localhost:3001/api/v1/auth/sso`
