# Card 2.0 架构

这是全新的Card 2.0架构实现，与原有的card组件完全独立，不会影响现有功能。

## 目录结构

```
card2.0/
├── README.md                 # 架构说明文档
├── core/                     # 核心架构层
│   ├── types/               # 类型定义
│   │   ├── index.ts         # 统一数据节点协议
│   │   ├── renderer.ts      # 渲染器接口
│   │   └── component.ts     # 组件接口
│   ├── registry/            # 组件注册管理
│   │   ├── index.ts         # 组件注册表
│   │   └── loader.ts        # 动态加载器
│   ├── data/               # 数据处理层
│   │   └── transform.ts     # 数据转换器
│   └── renderer/           # 渲染器实现
│       ├── manager.ts       # 渲染器管理器
│       └── vue-renderer.ts  # Vue渲染器
├── components/              # 组件实现层
│   ├── chart/              # 图表组件
│   │   └── bar/            # 柱状图组件
│   │       ├── index.ts    # 组件定义
│   │       └── BarChartView.vue # Vue视图
│   └── builtin/            # 内置组件
├── demo/                   # 演示示例
└── migration/              # 迁移工具
```

## 核心特性

1. **统一数据节点协议** - 所有数据都转换为标准的IDataNode格式
2. **渲染器解耦** - 支持Vue、React等多种渲染器
3. **组件逻辑分离** - 业务逻辑与视图完全分离
4. **动态加载** - 支持组件的懒加载和热更新
5. **类型安全** - 完整的TypeScript类型支持

## 使用方式

```typescript
import { componentRegistry, rendererManager } from '@/card2.0/core'
import barChartDefinition from '@/card2.0/components/chart/bar'

// 注册组件
componentRegistry.register(barChartDefinition)

// 创建渲染上下文
const context = rendererManager.createContext('demo', 'vue', containerElement)

// 渲染组件
const instance = componentRegistry.createInstance('chart-bar', config, data)
rendererManager.renderInstance('demo', instance)
```

## 迁移策略

1. **并行开发** - Card 2.0与现有card组件并存
2. **逐步迁移** - 按组件类型分批迁移
3. **兼容适配** - 提供适配器支持现有API
4. **平滑过渡** - 确保用户无感知升级