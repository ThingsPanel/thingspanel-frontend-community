# Card 2.1 文档迭代更新检查清单

> **🎯 使用说明**  
> 当你修改 Card 2.1 相关代码时，使用此检查清单确保文档保持同步更新

---

## 📋 代码变更检测

### 🔍 Step 1: 识别变更类型

根据你的代码修改，勾选对应的变更类型：

#### 核心系统变更
- [ ] **类型定义变更** (`core/types.ts`)
  - [ ] 新增 `ComponentDefinition` 字段
  - [ ] 修改权限类型 `ComponentPermission`
  - [ ] 新增数据源类型或接口
  
- [ ] **自动注册系统变更** (`core/auto-registry.ts`)
  - [ ] 注册逻辑变更
  - [ ] 组件发现机制修改
  - [ ] 分类逻辑调整

- [ ] **权限系统变更** (`core/permission-utils.ts`)
  - [ ] 权限等级调整
  - [ ] 权限检查逻辑修改
  - [ ] 新增权限管理功能

#### 组件相关变更
- [ ] **新组件添加** (`components/*/`)
  - [ ] 新增组件目录
  - [ ] 新的组件定义模式
  - [ ] 特殊配置需求

- [ ] **组件开发规范变更**
  - [ ] `definition.ts` 结构调整
  - [ ] 默认配置格式变更
  - [ ] 新的必填字段

#### 集成系统变更
- [ ] **Hooks 变更** (`hooks/`)
  - [ ] 新增 Hook
  - [ ] Hook API 变更
  - [ ] Hook 使用方式调整

- [ ] **Visual Editor 集成变更**
  - [ ] 集成接口变更
  - [ ] 新增集成功能
  - [ ] 集成配置调整

#### 数据绑定系统变更
- [ ] **数据绑定类型变更** (`core/data-binding/types.ts`)
- [ ] **数据处理管道调整**
- [ ] **响应式绑定机制变更**

#### 测试和调试
- [ ] **新增测试页面**
- [ ] **调试工具更新**
- [ ] **测试路由变更**

---

## 📝 Step 2: 文档更新执行

根据上述勾选的变更类型，执行对应的文档更新：

### 🎯 核心系统变更处理

#### ✅ 类型定义变更
**更新文件**: `ITERATIVE_DEVELOPMENT_GUIDE.md`
**更新章节**: **开发工作流** → 组件定义模板

**检查项目**:
- [ ] 更新 `definition.ts` 模板中的类型定义
- [ ] 检查新字段是否需要在模板中体现
- [ ] 验证示例代码的类型正确性

**更新示例**:
```typescript
// 如果新增字段，更新模板
const definition: ComponentDefinition = {
  // 原有字段...
  newField: 'newValue', // 新增字段说明
}
```

#### ✅ 自动注册系统变更
**更新文件**: `ITERATIVE_DEVELOPMENT_GUIDE.md`
**更新章节**: **系统架构映射** → 数据流架构

**检查项目**:
- [ ] 更新数据流程图
- [ ] 调整注册流程说明
- [ ] 检查初始化代码示例

#### ✅ 权限系统变更
**更新文件**: `ITERATIVE_DEVELOPMENT_GUIDE.md`
**更新章节**: **系统集成模式** → 权限系统集成

**检查项目**:
- [ ] 更新权限等级说明
- [ ] 调整权限集成代码示例
- [ ] 检查权限过滤逻辑

### 🧩 组件相关变更处理

#### ✅ 新组件添加
**更新文件**: `ITERATIVE_DEVELOPMENT_GUIDE.md`
**更新章节**: **开发工作流** → 组件定义模板

**检查项目**:
- [ ] 检查新组件是否引入了新的开发模式
- [ ] 验证现有模板是否适用于新组件类型
- [ ] 更新组件分类信息（如有新分类）

#### ✅ 组件开发规范变更
**更新文件**: `ITERATIVE_DEVELOPMENT_GUIDE.md`
**更新章节**: **开发工作流** → 全部组件模板

**检查项目**:
- [ ] 更新 `definition.ts` 模板
- [ ] 更新 `MyWidget.vue` 模板
- [ ] 更新 `MyWidgetConfig.vue` 模板
- [ ] 检查 `index.ts` 导出格式

### 🔗 集成系统变更处理

#### ✅ Hooks 变更
**更新文件**: `ITERATIVE_DEVELOPMENT_GUIDE.md`
**更新章节**: **系统集成模式**

**检查项目**:
- [ ] 更新 Hook 使用示例
- [ ] 检查 Hook API 文档
- [ ] 验证集成代码的正确性

#### ✅ Visual Editor 集成变更
**更新文件**: `ITERATIVE_DEVELOPMENT_GUIDE.md`
**更新章节**: **系统集成模式** → Visual Editor 集成

**检查项目**:
- [ ] 更新集成代码示例
- [ ] 检查配置参数说明
- [ ] 验证集成流程

### 🔄 数据绑定系统变更处理

#### ✅ 数据绑定变更
**更新文件**: `ITERATIVE_DEVELOPMENT_GUIDE.md`
**更新章节**: **系统集成模式** → 数据绑定系统

**检查项目**:
- [ ] 更新数据绑定示例代码
- [ ] 检查类型定义是否同步
- [ ] 验证绑定配置格式

### 🧪 测试调试变更处理

#### ✅ 测试页面变更
**更新文件**: `ITERATIVE_DEVELOPMENT_GUIDE.md`
**更新章节**: **测试和调试** + **快速参考**

**检查项目**:
- [ ] 更新测试页面访问路径
- [ ] 检查测试命令是否正确
- [ ] 验证调试示例代码

---

## 🚀 Step 3: 验证更新质量

### 代码示例验证
- [ ] 所有代码示例能够正常运行
- [ ] TypeScript 类型检查通过
- [ ] 导入路径正确无误

### 文档一致性检查
- [ ] 文档描述与实际代码实现一致
- [ ] 示例代码使用了最新的 API
- [ ] 版本信息已更新

### 实用性验证  
- [ ] 按照文档能够成功创建新组件
- [ ] 集成示例能够正常工作
- [ ] 调试代码能够提供有用信息

---

## 📅 Step 4: 完成更新

### 更新文档元信息
```markdown
**📋 文档状态**  
✅ **当前版本**：v1.0.1  <!-- 递增版本号 -->
✅ **最后更新**：2025-01-XX  <!-- 更新日期 -->
✅ **验证状态**：已验证所有代码示例  
🔄 **下次更新**：代码重大变更时
```

### 提交变更
```bash
git add src/card2.1/docs/ITERATIVE_DEVELOPMENT_GUIDE.md
git commit -m "docs(card2.1): 更新开发指南以反映[具体变更内容]"
```

---

## 🔧 自动化检查工具

### 快速检查脚本
你可以创建以下检查脚本来辅助检测文档是否需要更新：

```bash
#!/bin/bash
# card2.1-doc-check.sh

echo "🔍 检查 Card 2.1 文档同步状态..."

# 检查核心文件最后修改时间
CORE_FILES="src/card2.1/core/types.ts src/card2.1/index.ts src/card2.1/hooks/useVisualEditorIntegration.ts"
DOC_FILE="src/card2.1/docs/ITERATIVE_DEVELOPMENT_GUIDE.md"

for file in $CORE_FILES; do
  if [[ $file -nt $DOC_FILE ]]; then
    echo "⚠️  $file 比文档更新，建议检查文档同步"
  fi
done

echo "✅ 文档同步检查完成"
```

### TypeScript 类型检查
```bash
# 验证文档中的代码示例类型正确性
pnpm typecheck
```

### 实际测试验证
```bash
# 启动开发服务器测试集成功能
pnpm dev

# 访问测试页面验证功能
# http://localhost:5002/test/editor-integration
```

---

**使用建议**：
1. 每次修改 Card 2.1 相关代码后，运行此检查清单
2. 重大更新后，完整执行一遍所有检查项目
3. 定期（如每周）检查文档与代码的一致性
4. 提交代码时，同时提交相关的文档更新