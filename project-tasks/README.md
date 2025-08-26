# 项目任务管理系统

## 🎯 系统目的

确保开发任务规范化、防止跑偏、保证任务完成度，建立可追踪的任务执行机制。

## 📁 目录结构

```
project-tasks/
├── README.md                           # 本文件 - 任务管理规则和使用说明
├── 01-task-pool/                      # 任务池管理
│   ├── pending-tasks.md               # 待处理任务列表
│   ├── in-progress-tasks.md          # 进行中任务（同时只能有1个）
│   ├── task-breakdown/               # 任务拆解目录
│   │   ├── active-breakdown.md       # 当前大任务的小任务拆解
│   │   └── breakdown-template.md     # 任务拆解模板
│   └── task-template.md              # 标准任务模板格式
├── 02-main-objectives/               # 主线任务管理
│   ├── current-main-objective.md     # 当前唯一大任务
│   ├── main-objectives-queue.md      # 大任务队列（等待执行）
│   └── objective-switch-log.md       # 主线任务切换记录
├── 03-execution-control/             # 执行控制
│   ├── current-subtask.md           # 当前正在执行的小任务
│   ├── subtask-completion-log.md    # 小任务完成记录
│   └── execution-rules.md           # 执行规则说明
├── 04-completed-tasks/               # 已完成任务归档
│   ├── 2024-08/                      # 按月归档已完成任务
│   └── archive-index.md              # 归档索引
├── 05-temporary-tasks/               # 临时任务管理
│   ├── bugs/                         # bug修复类临时任务
│   │   ├── active-bugs.md            # 活跃bug列表
│   │   └── resolved-bugs.md          # 已解决bug
│   ├── quick-fixes/                  # 快速修复类临时任务
│   └── interruption-log.md          # 中断记录（防止忘记主线）
└── 06-workflow-rules/                # 工作流程规则
    ├── task-entry-rules.md          # 任务准入规则
    ├── task-breakdown-rules.md      # 任务拆解规则
    ├── single-task-execution.md     # 单任务执行原则
    ├── priority-guidelines.md       # 优先级指导
    ├── completion-criteria.md       # 完成标准
    └── emergency-procedures.md      # 紧急情况处理流程
```

## 🔑 核心原则

### 1. 单大任务原则
- **同时只能有1个大任务**：避免多线程混乱
- **大任务队列**：其他大任务在队列中等待

### 2. 任务拆解原则
- **所有大任务必须拆解**：拆解为1-2小时可完成的小任务
- **明确验收标准**：每个小任务都有明确的完成标准
- **边界清晰**：明确做什么、不做什么

### 3. 单小任务执行原则
- **一次只执行1个小任务**：执行完即停止
- **等待确认**：完成后等待验收和下一个任务指令
- **不得延展**：不能在执行过程中扩展任务范围

### 4. 规则文档驱动
- **规则文档是唯一标准**：开发者每次参考规则文档执行
- **严格按规则执行**：不得偏离规则文档要求
- **规则优先级最高**：规则文档 > 个人判断

## 🔄 标准执行流程

```
1. 确定大任务 → current-main-objective.md
2. 拆解小任务 → active-breakdown.md
3. 选择1个小任务 → current-subtask.md
4. 执行完成 → subtask-completion-log.md
5. 停止，等待下一个小任务指令
6. 所有小任务完成 → 归档到completed-tasks/
```

## 🚨 重要约束

### 禁止行为
- ❌ 同时处理多个大任务
- ❌ 执行未在任务池中的任务
- ❌ 在执行过程中扩展任务范围
- ❌ 主动建议架构重构（除非是任务要求）
- ❌ 跳过任务拆解直接执行大任务

### 必须行为
- ✅ 严格按照规则文档执行
- ✅ 每次开始前确认当前任务
- ✅ 完成后立即标记和汇报
- ✅ 临时任务处理完后回到主线
- ✅ 保持任务边界清晰

## 📋 使用方法

### 对于项目负责人
1. 在 `current-main-objective.md` 中定义大任务
2. 在 `active-breakdown.md` 中拆解小任务
3. 在 `current-subtask.md` 中指定当前要执行的小任务
4. 通过规则文档控制开发者行为

### 对于开发者
1. **每次开始工作前**：阅读 `current-subtask.md` 确认当前任务
2. **执行过程中**：严格按照任务边界执行，不扩展范围
3. **完成后**：更新 `subtask-completion-log.md` 并停止
4. **遇到临时问题**：记录到 `interruption-log.md`，处理完回到主线

## 🎯 成功标准

- **任务完成率**：95%以上的小任务按时完成
- **跑偏率**：0% - 不允许任何跑偏行为
- **任务追溯**：100%的工作都有对应的任务记录
- **规则遵循**：100%按照规则文档执行