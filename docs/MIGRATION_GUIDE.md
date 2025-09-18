# 从 `card` 迁移到 `card2.1` 指南

本文档旨在帮助开发者将旧版 `card` 组件平滑迁移到新版 `card2.1` 架构。

## 1. 核心概念变化

`card2.1` 引入了全新的架构，旨在提高组件的可复用性、可维护性和可扩展性。核心变化包括：

*   **组件注册机制**: 所有卡片组件都需要通过 `card2.1/core/component-registry.ts` 进行注册，以便在系统中使用。
*   **结构化分类**: 组件被组织在 `card2.1/components` 目录下，并按照 `业务领域/功能` 的方式进行分类。
*   **数据源抽象**: 数据获取和管理逻辑被抽象到 `card2.1/core/data-source` 中，实现了数据逻辑与视图的解耦。
*   **标准化配置**: 组件的配置项通过 `card2.1/core/config-manager.ts` 进行管理，提供了统一的配置接口。

## 2. 迁移步骤

### 2.1 组件迁移路径

为了帮助您快速定位新旧组件，下表列出了 `builtin-card` 中常见的数字展示类组件到 `card2.1` 的迁移路径。

| 功能描述 | 源路径 (from `src/card`) | 目标路径 (to `src/card2.1`) |
| :--- | :--- | :--- |
| **告警统计** | `builtin-card/alarm-count` | `components/alarm/management/alarm-count` |
| **CPU 使用率** | `builtin-card/cpu-usage` | `components/system/monitoring/cpu-usage` |
| **硬盘使用率** | `builtin-card/disk-usage` | `components/system/monitoring/disk-usage` |
| **内存使用率** | `builtin-card/mem-usage` | `components/system/monitoring/mem-usage` |
| **消息总数** | `builtin-card/message-count` | `components/system/monitoring/message-count` |
| **离线设备数** | `builtin-card/on-line` | `components/device/status/on-off-line` |
| **在线设备数** | `builtin-card/on-line` | `components/device/status/on-off-line` |
| **租户数量** | `builtin-card/tenant-count` | `components/system/multi-tenancy/tenant-count` |
| **版本信息** | `builtin-card/version` | `components/system/info/version` |