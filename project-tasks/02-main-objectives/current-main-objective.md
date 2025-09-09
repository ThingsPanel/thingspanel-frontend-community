# 当前主线任务

## 📊 任务状态

**当前大任务**：DataItemFetcher HTTP实现修复与完善  
**任务状态**：waiting_for_breakdown_approval  
**最后更新时间**：2025-08-29  
**任务ID**：TASK-2025-08-29-HTTP-FETCHER-FIX  
**任务类型**：bug修复与系统完善  
**预计完成时间**：0.5天（4小时）

---

## 🎯 大任务：DataItemFetcher HTTP实现修复与完善

### 任务基本信息
- **任务ID**：TASK-2025-08-29-HTTP-FETCHER-FIX
- **创建日期**：2025-08-29  
- **任务类型**：bug修复与系统完善
- **优先级**：高
- **当前状态**：waiting_for_breakdown_approval

### 任务背景与价值

#### ✅ 继承之前任务的优秀成果
通过深入代码分析，发现之前的工作成果非常丰富且质量优秀：

1. **完整的类型系统** - `src/core/data-architecture/types/http-config.ts`
   - HttpParameter、HttpHeader、HttpParam 接口完整定义
   - generateVariableName、convertValue 等工具函数完备
   - HTTP_CONFIG_TEMPLATES 模板系统完整

2. **完整的UI组件** - `src/core/data-architecture/components/modals/HttpConfigForm.vue`
   - 5页签完整实现（基础/请求头/参数/请求脚本/响应脚本）
   - 动态参数配置、脚本编辑器、国际化全部完成
   - 模板系统集成，用户体验优秀

3. **正确的系统集成** - `src/core/data-architecture/components/modals/RawDataConfigModal.vue`
   - 已正确集成为第三种数据获取方式
   - JSON → 脚本 → **HTTP接口** 的完整选择体系
   - 数据流连接正确

#### ❌ 发现的唯一问题
**DataItemFetcher.ts:112** 中的HTTP实现bug：
```javascript
// 错误：GET请求包含body导致浏览器报错
TypeError: Failed to execute 'fetch' on 'Window': Request with GET/HEAD method cannot have body.
```

### 核心任务目标

#### 主要目标
修复 DataItemFetcher 中的HTTP请求实现，使其与已完成的 HttpConfigForm 完美配合工作。

#### 具体工作内容
1. **修复HTTP方法处理逻辑**：
   - 修复GET/HEAD请求不能包含body的问题
   - 完善POST/PUT/PATCH请求的body数据处理
   - 实现GET请求参数的URL query string处理

2. **集成新的类型系统**：
   - 使用已完成的 http-config.ts 类型定义
   - 确保与 HttpConfigForm 的数据结构完全兼容
   - 利用现有的类型转换和验证机制

3. **端到端功能验证**：
   - 在 RawDataConfigModal 中测试HTTP数据源配置流程
   - 验证配置 → 执行 → 数据返回的完整数据流
   - 确保所有HTTP方法都能正常工作

### 成功标准

#### 技术标准
- [ ] DataItemFetcher.fetchHttpData 方法修复完成
- [ ] GET请求不再包含body参数，使用URL参数
- [ ] POST/PUT/PATCH请求正确处理body和headers
- [ ] 与HttpConfigForm生成的配置数据结构完全兼容
- [ ] 代码通过TypeScript检查和ESLint规范

#### 功能标准  
- [ ] 用户在RawDataConfigModal中选择"HTTP接口"能正常配置和执行
- [ ] 所有HTTP方法（GET/POST/PUT/DELETE/PATCH）都能成功执行
- [ ] HTTP请求返回的数据能正确处理和显示
- [ ] 错误处理机制完善，异常情况有明确提示
- [ ] 性能表现良好，请求响应及时

#### 系统集成标准
- [ ] 不影响现有的JSON和脚本数据源功能  
- [ ] 与已完成的HttpConfigForm组件无缝配合
- [ ] 符合项目代码规范和架构设计
- [ ] 支持明暗主题切换（如有UI变更）

### 任务价值与优势

#### 继承价值最大化
- **UI组件完整**：HttpConfigForm 是功能完善的企业级组件，无需重做
- **类型系统完备**：http-config.ts 提供了完整的类型支持和工具函数
- **集成架构正确**：在RawDataConfigModal中的集成方式完全正确
- **用户体验优秀**：5页签设计、国际化、主题支持、模板系统都已完成

#### 快速交付价值
- **技术风险极低**：问题明确具体，修复方案清晰
- **工作量最小**：只需修复一个HTTP实现bug
- **成果显著**：能够激活所有已完成的HTTP配置功能
- **用户价值直接**：解决后用户立即获得完整的HTTP数据源功能

### 技术实现策略

#### 核心修复方案
```typescript
// DataItemFetcher.ts 修复策略
async fetchHttpData(config: any): Promise<any> {
  const requestConfig: RequestInit = {
    method: config.method,
    headers: {
      'Content-Type': 'application/json',
      ...config.headers
    }
  }

  // 修复：GET/HEAD不能有body，POST/PUT/PATCH才能有body
  if (!['GET', 'HEAD'].includes(config.method) && config.body) {
    requestConfig.body = JSON.stringify(config.body)
  }

  // 修复：GET请求用URL参数  
  let finalUrl = config.url
  if (['GET', 'HEAD'].includes(config.method) && config.params) {
    const urlParams = new URLSearchParams(config.params)
    finalUrl += `?${urlParams.toString()}`
  }

  const response = await fetch(finalUrl, requestConfig)
  // ... 其余处理逻辑
}
```

#### 集成验证策略
1. **单元测试**：验证各种HTTP方法的正确处理
2. **集成测试**：验证与HttpConfigForm的数据兼容性
3. **端到端测试**：验证完整的用户使用流程
4. **边界测试**：验证错误处理和异常情况

### 风险评估

#### 技术风险（极低）
- **问题明确**：具体的HTTP实现bug，修复方案清晰
- **影响范围小**：只影响DataItemFetcher的HTTP功能
- **有现成参考**：可参考标准HTTP客户端实现

#### 时间风险（极低）  
- **工作量准确**：基于具体问题分析，工作量评估准确
- **无复杂依赖**：不依赖其他组件或系统的修改

#### 集成风险（极低）
- **向后兼容**：修复不影响现有JSON和脚本功能
- **接口稳定**：不改变对外接口，只修复内部实现

---

## 📊 任务进度跟踪

### 当前状态
- **大任务制定**：✅ 已完成
- **任务拆解**：⏳ 等待用户确认后进行
- **执行授权**：📋 待任务拆解完成后申请
- **任务执行**：📋 待获得授权后开始

### 下一步行动
**等待用户确认任务拆解方案，获得授权后将拆解为具体可执行的小任务**

---

## 🎯 任务成功的重要意义

1. **激活已有成果**：让所有已完成的HTTP配置功能真正可用
2. **用户价值实现**：用户将获得完整的HTTP数据源配置能力  
3. **系统完整性**：JSON、脚本、HTTP三种数据源全部可用
4. **开发效率**：基于已有优秀成果，快速解决关键问题

**🎯 通过最小的工作量，实现最大的用户价值和系统完整性**

---

**✅ 大任务已制定完成，当前状态：waiting_for_breakdown_approval**  
**📋 等待用户确认任务拆解方案**