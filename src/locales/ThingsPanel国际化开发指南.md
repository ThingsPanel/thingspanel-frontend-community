# ThingsPanel 国际化开发指南

## 🌐 项目国际化介绍

ThingsPanel 前端项目采用了现代化的模块化国际化架构，支持中英双语，为全球用户提供本地化体验。

### 🏗️ 架构特点

- **模块化管理**: 按功能拆分为18个模块，便于维护
- **双语支持**: 中文（zh-CN）和英文（en-US）
- **自动合并**: 运行时自动合并所有模块文件
- **智能提示**: 配合 i18n Ally 提供强大的开发支持

### 📁 目录结构

```
src/locales/
├── langs/                        # 语言包目录
│   ├── zh-cn/                   # 中文模块文件 (18个)
│   │   ├── basic.json           # 基础配置 (2个键)
│   │   ├── common.json          # 通用文本 (279个键)
│   │   ├── page.json            # 页面相关 (532个键)
│   │   ├── custom.json          # 自定义功能 (177个键)
│   │   ├── card.json            # 卡片组件 (332个键)
│   │   └── ... (其他13个模块)
│   └── en-us/                   # 英文模块文件 (18个)
│       ├── basic.json
│       ├── common.json
│       ├── page.json
│       └── ... (对应中文模块)
├── locale.ts                    # 语言包合并导出
├── index.ts                     # 国际化入口
├── i18n-ally-config.json       # i18n Ally 配置副本
└── 配置说明.md                  # 本指南文件
```

### 📊 模块分布统计

| 模块 | 键数 | 说明 | 主要用途 |
|------|------|------|----------|
| `page.json` | 532 | 页面相关 | 各页面专用文本 |
| `generate.json` | 481 | 生成相关 | 动态生成内容 |
| `card.json` | 332 | 卡片组件 | 仪表板卡片 |
| `common.json` | 279 | 通用文本 | 按钮、提示等 |
| `custom.json` | 177 | 自定义功能 | 业务逻辑相关 |
| `route.json` | 121 | 路由相关 | 导航和菜单 |
| 其他12个模块 | 256 | 专项功能 | 设备、告警等 |
| **总计** | **2198** | **18个模块** | **完整覆盖** |

## 🔧 i18n Ally 插件安装指导

### 第一步：安装插件

1. **打开 VS Code**
2. **访问扩展市场**：按 `Ctrl+Shift+X` 或点击左侧扩展图标
3. **搜索插件**：在搜索框输入 `i18n Ally`
4. **安装插件**：点击 [i18n Ally](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally) 的"安装"按钮

### 第二步：复制配置文件

将项目配置复制到根目录：

**Windows 用户**:
```powershell
# 在项目根目录执行
Copy-Item "src/locales/i18n-ally-config.json" ".i18nrc.json"
```

**Linux/Mac 用户**:
```bash
# 在项目根目录执行  
cp src/locales/i18n-ally-config.json .i18nrc.json
```

**手动复制**:
1. 打开 `src/locales/i18n-ally-config.json`
2. 复制全部内容
3. 在项目根目录创建 `.i18nrc.json` 文件
4. 粘贴内容并保存

### 第三步：重新加载 VS Code

1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 `Developer: Reload Window`
3. 回车执行重新加载

### 验证安装成功

打开任意包含 `$t()` 函数的文件，应该能看到：
- 💡 翻译内容的实时预览
- 🔍 翻译键的智能提示  
- ⚠️ 缺失翻译的警告标识

## 📖 使用指导

### 🎯 基本使用

#### 1. 在代码中使用翻译

```vue
<template>
  <!-- 在模板中 -->
  <h1>{{ $t('page.dashboard.title') }}</h1>
  <button>{{ $t('common.buttons.save') }}</button>
  
  <!-- 动态翻译 -->
  <span>{{ $t('custom.devicePage.status', { status: deviceStatus }) }}</span>
</template>

<script setup>
import { $t } from '@/locales'

// 在脚本中
const message = $t('common.messages.success')
console.log($t('page.device.createDevice'))
</script>
```

#### 2. 添加新翻译

**步骤一**：确定模块
根据功能选择合适的模块文件：
- 页面标题、内容 → `page.json`
- 设备相关功能 → `custom.json`  
- 通用按钮、提示 → `common.json`
- 卡片组件文本 → `card.json`

**步骤二**：添加中文翻译
在 `src/locales/langs/zh-cn/模块.json` 中添加：
```json
{
  "custom.devicePage.newFeature": "新功能",
  "custom.devicePage.description": "这是一个新功能的描述"
}
```

**步骤三**：添加英文翻译
在 `src/locales/langs/en-us/模块.json` 中添加：
```json
{
  "custom.devicePage.newFeature": "New Feature", 
  "custom.devicePage.description": "This is a description of the new feature"
}
```

#### 3. 翻译键命名规范

```
{模块}.{页面/组件}.{具体功能}

✅ 正确示例：
- custom.devicePage.deviceName
- page.dashboard.title
- common.buttons.save
- card.chart.dataSource

❌ 错误示例：
- deviceName (缺少模块前缀)
- custom_device_page_name (使用下划线)
- custom.DevicePage.name (大写字母)
```

### 🛠️ 高级功能

#### 1. 带参数的翻译

```json
// zh-cn/common.json
{
  "common.welcome": "欢迎 {name}，今天是 {date}"
}

// en-us/common.json  
{
  "common.welcome": "Welcome {name}, today is {date}"
}
```

```vue
<template>
  <div>{{ $t('common.welcome', { name: userName, date: currentDate }) }}</div>
</template>
```

#### 2. 复数形式处理

```json
// zh-cn/common.json
{
  "common.itemCount": "共 {count} 个项目"
}

// en-us/common.json
{
  "common.itemCount": "{count} item | {count} items"
}
```

#### 3. 命名空间使用

```vue
<script setup>
// 使用命名空间提高性能
const deviceTexts = $tm('custom.devicePage')
console.log(deviceTexts.deviceName) // "设备名称"
</script>
```

### 🔍 i18n Ally 功能详解

#### 1. 实时预览
在代码中悬停 `$t()` 函数，查看当前语言的翻译内容

#### 2. 快速跳转
- `Ctrl+点击` 翻译键快速跳转到对应的JSON文件
- 在侧边栏查看所有翻译文件的结构

#### 3. 缺失检测
- 自动检测缺失的翻译键
- 在侧边栏显示翻译完成度
- 高亮显示未翻译的文本

#### 4. 批量操作
- 批量添加缺失的翻译
- 批量重命名翻译键
- 导出/导入翻译文件

#### 5. 翻译建议
- 自动翻译建议（需配置翻译引擎）
- 术语库匹配
- 翻译一致性检查

## ⚙️ 配置说明

### 语言设置
```json
{
  "sourceLanguage": "zh-CN",      // 源语言（开发语言）
  "targetLanguages": ["en-US"]    // 目标语言列表
}
```

### 文件路径配置
```json
{
  "locales": {
    "zh-CN": "src/locales/langs/zh-cn/*.json",
    "en-US": "src/locales/langs/en-us/*.json"
  }
}
```

### 翻译术语库
```json
{
  "termBase": {
    "设备": "device",
    "告警": "alarm", 
    "仪表盘": "dashboard",
    "自动化": "automation",
    "可视化": "visualization",
    "管理": "management"
  }
}
```

## 🎨 最佳实践

### ✅ 推荐做法

1. **保持同步**：添加新键时同时更新中英文文件
2. **命名规范**：使用统一的键名格式
3. **模块划分**：按功能将翻译放入合适的模块
4. **及时测试**：添加翻译后及时测试显示效果
5. **代码审查**：翻译也需要进行代码审查

### ❌ 避免事项

1. **硬编码文本**：避免在代码中直接写中文文本
2. **重复键名**：不同模块避免使用相同的键名
3. **过长翻译**：避免翻译文本过长影响界面布局
4. **特殊字符**：避免在翻译中使用特殊字符
5. **忘记英文**：添加中文时忘记添加对应英文

## 🚨 故障排除

### 常见问题

#### 1. 看不到翻译预览
**原因**: 配置文件位置不正确或格式错误
**解决**:
- 确认 `.i18nrc.json` 在项目根目录
- 检查 JSON 语法是否正确
- 重新加载 VS Code 窗口

#### 2. 提示翻译缺失
**原因**: 对应语言文件中没有该翻译键
**解决**:
- 检查文件路径配置
- 确认翻译键是否正确添加
- 验证文件编码为 UTF-8

#### 3. 插件功能异常
**原因**: 插件版本不兼容或配置冲突
**解决**:
- 更新 i18n Ally 到最新版本
- 重启 VS Code
- 重新安装插件

### 调试步骤

1. **检查配置文件**：确认 `.i18nrc.json` 存在且格式正确
2. **验证文件路径**：确认语言文件路径匹配配置
3. **查看插件状态**：在 VS Code 状态栏查看 i18n Ally 状态
4. **检查控制台**：打开开发者工具查看错误信息

## 📞 支持与帮助

### 技术支持
- **项目文档**: 查看根目录相关文档
- **官方文档**: [i18n Ally GitHub](https://github.com/lokalise/i18n-ally)
- **社区支持**: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally)

### 团队协作
- **代码规范**: 遵循项目翻译键命名规范
- **协作流程**: 翻译修改也需要 PR 审查
- **同步更新**: 定期同步最新的配置文件

---

**文档维护**: ThingsPanel 开发团队  
**最后更新**: 2025年1月1日  
**适用版本**: ThingsPanel Frontend Community v1.0+ 