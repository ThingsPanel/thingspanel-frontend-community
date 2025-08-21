# 数据源配置表单修复验证测试

## 问题回顾

之前遇到的问题：
- 数据源配置标签页只显示"导入配置"和"导出配置"按钮
- 实际的数据源配置表单没有显示
- 根本原因：Card2.1组件使用`dataRequirements`格式，但ConfigurationPanel期望`dataSources`格式

## 修复方案

### 1. 格式转换修复
在`ConfigurationPanel.vue`的`componentDataSources`计算属性中添加了格式转换逻辑：

```typescript
// 🔥 修复：处理 Card2.1 组件的 dataRequirements 格式
if (definition?.dataRequirements) {
  // 从 dataRequirements 中提取字段信息并转换为 dataSources 格式
  const fieldsToMap = definition.dataRequirements.fields?.map((field: any) => field.name) || ['value', 'label', 'status']
  const fieldMappings: Record<string, any> = {}
  
  // 构建字段映射
  definition.dataRequirements.fields?.forEach((field: any) => {
    fieldMappings[field.name] = {
      path: field.name,
      type: field.type,
      description: field.description || '',
      required: field.required || false
    }
  })
  
  return [
    {
      key: 'main',
      name: definition.dataRequirements.primary?.name || '主数据源',
      type: definition.dataRequirements.primary?.type || 'object',
      fieldsToMap,
      fieldMappings,
      expectedDataFormat: definition.dataRequirements.primary?.type || 'object',
      validationRules: {},
      description: definition.dataRequirements.primary?.description || '组件的主要数据源'
    }
  ]
}
```

### 2. 数据结构匹配修复
修复了`fieldsToMap`数据结构不匹配问题：

```typescript
// 🔥 修复前：只提供字符串数组
const fieldsToMap = definition.dataRequirements.fields?.map((field: any) => field.name)

// ✅ 修复后：提供正确的对象结构
const fieldsToMap = definition.dataRequirements.fields?.map((field: any) => ({
  key: field.name,
  targetProperty: field.type || 'string'
})) || [
  { key: 'value', targetProperty: 'string' },
  { key: 'label', targetProperty: 'string' },
  { key: 'status', targetProperty: 'string' }
]
```

### 3. 防御性编程加强
在`DataSourceConfigForm.vue`中添加了安全检查：

```typescript
// 🔥 防御性编程：确保 targetProperty 存在且为字符串
if (targetProperty && typeof targetProperty === 'string') {
  if (targetProperty.includes('array') || targetProperty.includes('Array')) {
    return '数组'
  }
  // ...
}
```

## 测试步骤

### 1. 启动开发服务器
```bash
pnpm dev
```
服务器地址：http://localhost:5004/

### 2. 访问Visual Editor测试页面
导航路径：`菜单 → 测试 → 编辑器集成测试`
或直接访问：http://localhost:5004/test/editor-integration

### 3. 添加Card2.1组件进行测试

**测试组件1：IoT设备状态卡片**
- 在组件库中找到"IoT设备状态卡片"
- 拖拽到画布中
- 选中组件，查看配置面板

**测试组件2：实时图表卡片**
- 在组件库中找到"实时图表卡片" 
- 拖拽到画布中
- 选中组件，查看配置面板

### 4. 验证数据源配置标签页

在配置面板中，应该能看到以下标签页：
- [ ] 基础配置
- [ ] 组件配置  
- [ ] **数据源配置** ← 重点检查这个
- [ ] 交互配置

点击"数据源配置"标签页，应该显示：

#### 预期显示内容：
1. **数据源名称**：主数据源 (对于IoT设备状态卡片) 或 timeSeriesData (对于实时图表卡片)
2. **数据源类型选择器**：API、WebSocket、MQTT、静态数据等选项
3. **字段映射配置**：
   - IoT设备状态卡片：deviceName、deviceType、status、location、metrics等字段
   - 实时图表卡片：title、description、series、xAxis、yAxis等字段
4. **数据源URL/连接配置**
5. **数据处理脚本配置**
6. **保存/应用按钮**

#### 不应该看到的内容：
- ❌ 只有"导入配置"和"导出配置"按钮
- ❌ 空白页面
- ❌ 错误提示

### 5. 功能测试

**基础功能测试：**
- [ ] 选择不同的数据源类型 (API/WebSocket/静态数据)
- [ ] 配置字段映射
- [ ] 保存配置后重新选择组件，验证配置是否持久化

**字段映射测试：**
- [ ] 验证IoT设备状态卡片的字段列表是否正确显示
- [ ] 验证实时图表卡片的字段列表是否正确显示
- [ ] 字段类型和描述是否正确显示

### 6. 控制台日志检查

打开浏览器开发者工具，查看控制台，应该看到：

```
🔧 [ConfigurationPanel] 从 dataRequirements 转换数据源配置
```

如果看到错误日志，记录具体错误信息。

## 预期结果

✅ **修复成功的标志：**
1. 数据源配置标签页正常显示完整的配置表单
2. 字段映射部分显示组件定义中的所有字段
3. 可以正常切换数据源类型
4. 配置保存后可以正常持久化

❌ **仍有问题的标志：**
1. 数据源标签页仍然只显示导入/导出按钮
2. 控制台出现转换相关的错误
3. 字段映射为空或显示错误

## 问题排查

如果测试失败，检查以下方面：

1. **组件定义检查**：确认组件定义文件中有`dataRequirements`字段
2. **格式转换检查**：在控制台查看转换后的数据结构
3. **Props传递检查**：确认`componentDataSources`正确传递给DataSourceConfigForm
4. **组件注册检查**：确认DataSourceConfigForm组件正确注册

## 补充测试

如果基本测试通过，可以进行以下高级测试：

1. **多组件测试**：同时添加多个Card2.1组件，验证配置隔离
2. **配置导入导出测试**：测试配置的导入导出功能
3. **数据源执行测试**：配置API数据源，验证实际数据获取

## 测试完成报告

测试完成后，请报告：
- [ ] 基础显示是否正常
- [ ] 字段映射是否正确
- [ ] 配置保存是否有效
- [ ] 发现的任何问题

---

**测试时间**: [待填入]  
**测试人**: [待填入]  
**测试结果**: [待填入]  