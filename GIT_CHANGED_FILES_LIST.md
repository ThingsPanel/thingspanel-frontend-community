# Kanban2分支合并决策依据文档

基于分支创建点(feb4cc78)到当前的实际变更分析，排除指定目录和.claude目录

## ✅ 建议合并的核心功能文件

### 应用核心功能 (重要功能变更)
- **src/main.ts** - 新增GridStack CSS导入、ECharts管理器初始化、Card2.1组件注册系统导入
- **packages/axios/src/index.ts** - HTTP错误处理逻辑优化：增加后端业务错误处理和错误信息简化
- **src/store/modules/app/index.ts** - 新增setFullContent方法用于程序化控制全屏状态
- **src/layouts/hooks/use-mix-menu.ts** - 修复路由名称为undefined时的错误，增加安全检查
- **src/App.vue** - 修复组件嵌套结构，NMessageProvider包裹优化

### 组件系统增强
- **src/components/device-selectors/index.ts** - 新增设备选择器组件统一导出文件

### 配置文件 (需要谨慎评估)
- **package.json** - 依赖项更新，主要涉及开发工具
- **pnpm-lock.yaml** - 依赖锁定文件自动更新 (2306行变更)
- **scripts/dev-quality-check.js** - 开发质量检查脚本功能增强

### 项目文档 (可选合并)
- **CLAUDE.md** - 项目开发规范和架构指南大幅更新 (833行新增)
- **CLAUDE.local.md** - 新增用户私有项目开发强制规则 (131行新增)

## ⚠️ 需要谨慎评估的文件

### 构建和部署配置
- **Dockerfile** - Docker构建配置优化 (9行变更)
- **nginx.conf** - Nginx配置文件更新
- **.github/workflows/*.yml** - 多个GitHub Actions工作流配置文件更新

### 开发工具配置 (轻微更新)
- **.editorconfig** - 编辑器配置更新 (11行变更)
- **.prettierrc** - 代码格式化配置调整 (19行变更)
- **.env.development** - 开发环境配置更新
- **eslint.config.js** - ESLint配置优化
- **.gitignore** - Git忽略规则轻微调整 (2行变更)
- **pnpm-workspace.yaml** - pnpm工作区配置微调 (2行变更)

### 国际化微调 (轻微更新)
- **src/locales/index.ts** - 国际化配置文件轻微调整 (2行变更)
- **src/locales/langs/en-us/*.json** - 英文语言包轻微调整 (2-8行变更)
- **src/locales/langs/zh-cn/*.json** - 中文语言包轻微调整 (2-8行变更)

### 布局组件微调 (轻微更新)
- **src/layouts/modules/global-header/index.vue** - 全局头部组件轻微调整 (3行变更)
- **src/layouts/modules/global-menu/horizontal-mix-menu.vue** - 水平混合菜单轻微优化 (4行变更)
- **src/layouts/base-layout/index.vue** - 基础布局组件轻微调整

## ❌ 不建议合并的文件

### SVG图标格式化 (非功能性变更，建议不合并)
- **src/assets/svg-icon/*.svg** - 100+ 图标文件格式化，从单行转为多行格式
  - 示例: AddLocationAltOutlined.svg (6行变更)
  - 示例: AdjustRound.svg (6行变更)
  - 等100+个类似文件

### 临时调试文件 (绝对不合并)
- **architecture-integration-test.html** - 架构集成测试页面 (284行)
- **debug-configuration-editor.html** - 配置编辑器调试页面 (271行)
- **debug-pathparam-input-fix.html** - 路径参数输入修复调试页面 (165行)
- **test-*.html** - 其他多个测试HTML文件
- **pathparam-focus-fix-final.html** - 参数焦点修复测试文件

### 文档和迁移指南 (可不合并)
- **devReadme.md** - 开发文档大幅更新 (1714行变更)
- **README.md/README_ZH.md** - 项目说明文档更新 (168行变更)
- **docs/*.md** - 各种技术文档和迁移指南
- **project-tasks/** - 项目任务文档目录
- **MIGRATION_GUIDE.md** - 各种组件迁移指南
- **LICENSE** - 许可证文件格式调整 (201行变更)

### 其他配置文件 (影响不大)
- **.cursor/rules/my-rulse.mdc** - Cursor编辑器规则配置 (71行变更)
- **.i18nrc.json** - 国际化工具配置更新 (156行变更)
- **.vercel/project.json** - Vercel部署配置轻微调整
- **.npmrc** - npm配置轻微调整
- **build/plugins/router.ts** - 构建路由插件配置
- **eslint-report.json** - ESLint报告文件

## ⚡ 关键决策建议

### 必须合并的核心功能 (共6个文件)
1. **src/main.ts** - 应用启动核心功能
2. **packages/axios/src/index.ts** - HTTP处理优化
3. **src/store/modules/app/index.ts** - 状态管理增强
4. **src/layouts/hooks/use-mix-menu.ts** - 路由安全修复
5. **src/App.vue** - 组件结构修复
6. **src/components/device-selectors/index.ts** - 组件导出文件

### 可选合并的配置文件
- package.json/pnpm-lock.yaml (依据具体依赖情况决定)
- CLAUDE.md/CLAUDE.local.md (项目规范文档)
- scripts/dev-quality-check.js (开发工具)

### 建议不合并的文件
- 所有HTML测试文件 (临时调试用)
- 100+ SVG图标格式化文件 (非功能性变更)
- 大量文档和迁移指南 (可在主分支单独维护)

## 🎯 合并风险评估

### 低风险 (建议合并)
- 6个核心功能文件 - 经过测试的功能增强
- 项目文档更新 - 不影响运行时

### 中风险 (谨慎评估)
- 依赖更新文件 - 可能影响构建和依赖关系
- 构建配置文件 - 可能影响部署流程

### 高风险 (建议不合并)
- 大量格式化文件 - 容易引起合并冲突
- 临时调试文件 - 污染主分支代码库