# 用户授权状态管理

## 📊 当前授权状态

**当前状态**: execution_approved  
**最后更新时间**: 2024-08-27  
**授权用户**: 项目负责人  

---

## 🔐 授权状态说明

### 状态枚举
- `no_active_task` - 无活跃任务，等待用户制定大任务
- `waiting_for_breakdown_approval` - 大任务已制定，等待用户确认任务拆解
- `waiting_for_execution_approval` - 任务拆解完成，等待用户授权开始执行
- `execution_approved` - 用户已授权执行，可以开始当前小任务
- `waiting_for_next_approval` - 当前小任务已完成，等待用户确认继续下一个
- `adjustment_needed` - 发现需要调整大任务，等待用户确认调整方案
- `breakdown_update_needed` - 大任务已调整，等待用户确认新的任务拆解

### 状态转换流程
```
no_active_task 
    ↓ (用户制定大任务)
waiting_for_breakdown_approval
    ↓ (用户确认拆解方案)  
waiting_for_execution_approval
    ↓ (用户授权开始执行)
execution_approved
    ↓ (完成当前小任务)
waiting_for_next_approval
    ↓ (用户确认继续)
execution_approved
    ↓ (发现需要调整)
adjustment_needed
    ↓ (用户确认调整)
breakdown_update_needed
    ↓ (用户确认新拆解)
waiting_for_execution_approval
```

## 📝 授权记录

### 当前授权详情
- **大任务授权**: ✅ 已授权 - "多数据源配置系统完整实现"
- **任务拆解授权**: ✅ 已授权 - 小任务已拆解完成  
- **执行授权**: ⏸️ 等待用户授权 - 等待用户确认开始执行第一个小任务
- **继续授权**: ❌ 未授权 - 尚未开始执行

### 授权历史记录
```
2024-08-27: 用户确认现有大任务"多数据源配置系统完整实现"，状态更新为waiting_for_execution_approval
```

---

## 🎯 用户确认模板

### 大任务制定确认
```markdown
用户确认: "我确认制定以下大任务：[大任务名称和描述]"
Claude响应: 更新状态为 waiting_for_breakdown_approval
```

### 任务拆解确认  
```markdown
用户确认: "我确认任务拆解方案，授权开始执行"
Claude响应: 更新状态为 waiting_for_execution_approval
```

### 执行授权确认
```markdown
用户确认: "授权开始执行第一个小任务"
Claude响应: 更新状态为 execution_approved，开始执行current-subtask.md中的任务
```

### 继续执行确认
```markdown
用户确认: "继续执行下一个小任务" 
Claude响应: 更新状态为 execution_approved，开始下一个小任务
```

### 大任务调整确认
```markdown
用户确认: "我确认大任务调整方案：[调整内容]"
Claude响应: 更新状态为 breakdown_update_needed，更新大任务并重新拆解
```

---

## ⚠️ Claude 执行约束

### 必须等待用户确认的情况
- ✋ 制定大任务后 - 等待拆解确认
- ✋ 完成任务拆解后 - 等待执行授权
- ✋ 开始第一个小任务前 - 等待明确授权
- ✋ 完成每个小任务后 - 等待继续确认
- ✋ 发现需要调整大任务时 - 等待调整确认
- ✋ 完成大任务调整后 - 等待新拆解确认

### Claude 禁止的自主行为
- ❌ 自行决定开始任务执行
- ❌ 跳过用户确认步骤
- ❌ 自行调整任务优先级
- ❌ 主动扩展任务范围
- ❌ 在未授权状态下进行任务相关工作

### 授权状态检查要求
```markdown
Claude每次执行任务前必须检查：
□ 读取当前授权状态
□ 确认有对应的用户授权
□ 确认授权状态与要执行的操作匹配
□ 如无授权，只能汇报状态不能执行
```

---

## 📊 状态更新日志

| 时间 | 状态变更 | 授权内容 | 操作用户 |
|------|----------|----------|----------|
| 2024-08-27 | 初始化 | 创建授权状态管理系统 | 项目负责人 |

---

**🚨 重要提醒: Claude 必须严格检查此文档的授权状态，未获得明确授权不得执行任何任务相关工作！**