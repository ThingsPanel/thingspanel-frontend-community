# Card 2.1 文档导航中心

> **📚 文档体系概览**  
> 为不同的使用场景提供专门的文档支持

---

## 📖 文档分类

### 🚀 **开发者指南** (推荐优先阅读)

| 文档名称 | 用途 | 适用场景 |
|---------|------|---------|
| **[可迭代开发指南](./ITERATIVE_DEVELOPMENT_GUIDE.md)** | 实际开发工作流程 | ✅ 新组件开发<br>✅ 系统架构理解<br>✅ 快速上手 |
| **[组件开发指南](./COMPONENT_DEVELOPMENT_GUIDE.md)** | 详细的组件开发规范 | 📋 详细开发规范<br>📋 最佳实践参考 |

### 🔧 **维护和管理**

| 文档名称 | 用途 | 适用场景 |
|---------|------|---------|
| **[文档更新检查清单](./DOCUMENTATION_UPDATE_CHECKLIST.md)** | 代码变更时的文档同步 | 🔄 代码修改后<br>🔄 文档维护<br>🔄 版本更新 |

### 📋 **详细参考** (按需阅读)

| 文档名称 | 用途 | 适用场景 |
|---------|------|---------|
| **[完整开发指南](./DEVELOPMENT_GUIDE.md)** | 系统完整功能说明 | 📚 深入了解系统<br>📚 功能全览<br>📚 故障排除 |
| **[交互测试指南](./INTERACTION_TEST_GUIDE.md)** | 组件交互功能测试 | 🧪 交互功能开发<br>🧪 测试验证 |

---

## 🎯 使用路径推荐

### 🆕 **新手开发者路径**
```
1. 📖 阅读《可迭代开发指南》了解系统架构
2. 🛠️ 按照《可迭代开发指南》创建第一个组件  
3. 🧪 使用测试页面验证组件功能
4. 📚 需要时参考《完整开发指南》获取详细信息
```

### 🔄 **代码维护者路径**
```
1. 🔍 修改代码后，运行《文档更新检查清单》
2. 📝 根据检查清单更新相应文档章节
3. ✅ 验证文档示例代码的正确性
4. 📋 提交代码时同时提交文档更新
```

### 🚀 **系统集成路径**
```
1. 📖 阅读《可迭代开发指南》→ 系统集成模式
2. 🔗 参考集成示例代码进行系统对接
3. 🧪 使用测试页面验证集成效果
```

---

## 🛠️ 快速开发工具

### 组件开发脚手架
```bash
# 快速创建组件目录结构
create_card2_component() {
  local name=$1
  local dir="src/card2.1/components/$name"
  
  mkdir -p "$dir"
  cd "$dir"
  
  # 创建基础文件
  cat > definition.ts << 'EOF'
import type { ComponentDefinition } from '@/card2.1/core/types'
import MyComponent from './MyComponent.vue'
import MyComponentConfig from './MyComponentConfig.vue'

const definition: ComponentDefinition = {
  type: 'COMPONENT_NAME',
  name: 'COMPONENT_DISPLAY_NAME',
  description: 'COMPONENT_DESCRIPTION',
  category: '基础组件',
  component: MyComponent,
  configComponent: MyComponentConfig,
  permission: '不限',
  supportedDataSources: ['static'],
  defaultConfig: {},
  tags: ['basic'],
  version: '1.0.0'
}

export default definition
EOF

  echo "✅ 组件 $name 脚手架创建完成！"
  echo "📍 位置：$dir"
  echo "📝 下一步：编辑 definition.ts 完善组件定义"
}

# 使用方法
# create_card2_component "my-new-widget"
```

### 文档同步检查
```bash
# 检查文档是否需要更新
check_doc_sync() {
  local doc_file="src/card2.1/ITERATIVE_DEVELOPMENT_GUIDE.md"
  local core_files=(
    "src/card2.1/core/types.ts"
    "src/card2.1/index.ts"
    "src/card2.1/hooks/useVisualEditorIntegration.ts"
  )
  
  echo "🔍 检查文档同步状态..."
  
  for file in "${core_files[@]}"; do
    if [[ "$file" -nt "$doc_file" ]]; then
      echo "⚠️  $file 比开发指南更新，建议检查文档同步"
    fi
  done
  
  echo "✅ 检查完成"
}
```

---

## 📍 重要链接快速访问

### 🌐 **测试页面**
- [Visual Editor 集成测试](http://localhost:5002/test/editor-integration) - 测试编辑器集成功能
- [数据绑定系统测试](http://localhost:5002/test/data-binding-system-integration) - 测试数据绑定功能  
- [数据源系统测试](http://localhost:5002/test/data-source-system) - 测试数据源功能

### 🔧 **开发命令**
```bash
pnpm dev              # 启动开发服务器
pnpm quality-check    # 代码质量检查
pnpm typecheck       # TypeScript 类型检查
pnpm lint            # ESLint 检查
```

### 📂 **关键目录**
```
src/card2.1/
├── components/       # 📦 组件开发
├── core/            # ⚙️  核心系统
├── hooks/           # 🔗 Vue 集成
└── integration/     # 🌉 外部集成
```

---

## 💡 使用技巧

### ⚡ **快速定位信息**
- **开发组件**: 直接查看 [可迭代开发指南](./ITERATIVE_DEVELOPMENT_GUIDE.md) → 开发工作流
- **集成系统**: 直接查看 [可迭代开发指南](./ITERATIVE_DEVELOPMENT_GUIDE.md) → 系统集成模式
- **故障排除**: 直接查看 [完整开发指南](./DEVELOPMENT_GUIDE.md) → 故障排除
- **维护文档**: 直接使用 [文档更新检查清单](./DOCUMENTATION_UPDATE_CHECKLIST.md)

### 🔄 **版本控制建议**
- 每次重大代码变更后，同时更新文档版本号
- 使用 Git 标签标记文档重要版本
- 定期检查文档与代码的一致性

### 📝 **文档贡献**
- 发现文档错误时，直接修改对应文档文件
- 添加新功能时，按照检查清单更新文档
- 提交时使用清晰的 commit 信息（如 `docs(card2.1): 更新组件开发模板`）

---

**🎯 推荐使用流程**：
1. **日常开发** → 使用《可迭代开发指南》
2. **代码变更** → 运行《文档更新检查清单》
3. **深入学习** → 参考《完整开发指南》
4. **问题排查** → 查看测试页面和故障排除部分