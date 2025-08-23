# 数据流架构重构计划

本文档基于《可视化编辑器、卡片与数据源系统数据流分析报告》，旨在提供一份详细的、可落地的开发与重构计划。

## 1. 核心目标

- **引入 `DataRepository` (数据仓库)**：创建一个统一的、主动的数据管理层，负责数据源的生命周期管理、数据缓存和订阅分发。
- **解耦数据获取与组件渲染**：将数据请求的复杂逻辑从组件中剥离，使组件更专注于 UI 渲染。
- **提升性能与可维护性**：通过引用计数和统一管理，避免不必要的数据请求，并使数据流更加清晰、可追溯。

## 2. 开发任务分解

### 任务一：创建核心 `DataRepository` 模块

这是本次重构的核心，我们将创建一个全新的模块来承载数据仓库的职责。

- **操作**: 在 `src/core/` 目录下创建新目录 `data-repository`。
- **创建文件**:
    1.  `src/core/data-repository/index.ts`
    2.  `src/core/data-repository/types.ts`

#### **文件 1: `src/core/data-repository/types.ts`**

- **目的**: 定义 `DataRepository` 所需的类型和接口。
- **修改内容**:
  ```typescript
  // src/core/data-repository/types.ts

  /**
   * @description 订阅者的回调函数类型
   * @param data - 数据源返回的最新数据
   * @param error - 错误信息
   */
  export type SubscriberCallback = (data: any, error?: Error) => void;

  /**
   * @description 订阅信息记录
   */
  export interface Subscription {
    // 订阅者回调函数列表
    callbacks: Set<SubscriberCallback>;
    // 引用计数
    refCount: number;
  }
  ```

#### **文件 2: `src/core/data-repository/index.ts`**

- **目的**: 实现 `DataRepository` 类的逻辑并导出单例。
- **修改内容**:
  ```typescript
  // src/core/data-repository/index.ts

  import { ExecutorFactory } from '@/core/data-source-system/executors';
  import type { DataSourceExecutor } from '@/core/data-source-system/DataSourceExecutor';
  import type { SubscriberCallback, Subscription } from './types';

  class DataRepository {
    // 私有属性：缓存数据源数据
    private readonly _dataSourceCache = new Map<string, any>();
    // 私有属性：管理执行器实例
    private readonly _executorRegistry = new Map<string, DataSourceExecutor>();
    // 私有属性：管理订阅信息和引用计数
    private readonly _subscriptionRegistry = new Map<string, Subscription>();

    /**
     * @description 根据数据源配置生成唯一标识
     * @param config - 数据源配置
     * @returns 唯一字符串标识
     */
    private _generateKey(config: any): string {
      // 注意：这里需要一个稳定的序列化方法，确保相同配置总能生成相同 key
      return JSON.stringify(config);
    }

    /**
     * @description 订阅数据源
     * @param config - 数据源配置
     * @param callback - 数据更新时的回调函数
     */
    public subscribe(config: any, callback: SubscriberCallback) {
      const key = this._generateKey(config);
      let subscription = this._subscriptionRegistry.get(key);

      if (!subscription) {
        // 如果是首次订阅，创建新的执行器和订阅记录
        const executor = ExecutorFactory.create(config, (data, error) => {
          // 当执行器获取到新数据时，更新缓存并通知所有订阅者
          this._dataSourceCache.set(key, data);
          this._subscriptionRegistry.get(key)?.callbacks.forEach(cb => cb(data, error));
        });

        if (!executor) {
          console.error('Failed to create DataSourceExecutor for config:', config);
          return;
        }

        this._executorRegistry.set(key, executor);
        executor.start(); // 启动执行器

        subscription = { callbacks: new Set(), refCount: 0 };
        this._subscriptionRegistry.set(key, subscription);
      }

      // 添加回调并增加引用计数
      subscription.callbacks.add(callback);
      subscription.refCount++;

      // 如果缓存中已有数据，立即回调一次
      if (this._dataSourceCache.has(key)) {
        callback(this._dataSourceCache.get(key));
      }
    }

    /**
     * @description 取消订阅
     * @param config - 数据源配置
     * @param callback - 添加时使用的同一个回调函数
     */
    public unsubscribe(config: any, callback: SubscriberCallback) {
      const key = this._generateKey(config);
      const subscription = this._subscriptionRegistry.get(key);

      if (!subscription || !subscription.callbacks.has(callback)) {
        return; // 如果没有订阅记录或回调不存在，则直接返回
      }

      // 移除回调并减少引用计数
      subscription.callbacks.delete(callback);
      subscription.refCount--;

      if (subscription.refCount === 0) {
        // 如果引用计数归零，则销毁执行器并清理注册表
        const executor = this._executorRegistry.get(key);
        executor?.destroy(); // 停止并销毁执行器

        this._executorRegistry.delete(key);
        this._subscriptionRegistry.delete(key);
        this._dataSourceCache.delete(key); // 可选：在没有订阅者时清除缓存
      }
    }
  }

  // 导出 DataRepository 的全局单例
  export const dataRepository = new DataRepository();
  ```

### 任务二：重构 `DataSourceExecutor`

修改执行器，使其不再与全局 `dataSourceCenter` 耦合，而是接受一个回调函数来传递数据。

- **操作**: 修改 `data-source-system` 目录下的相关文件。
- **修改文件**:
    1.  `src/core/data-source-system/executors/index.ts` (`ExecutorFactory`)
    2.  `src/core/data-source-system/DataSourceExecutor.ts` (基类)
    3.  `src/core/data-source-system/executors/http.ts` (以及其他具体执行器)

#### **文件 1: `src/core/data-source-system/DataSourceExecutor.ts`**

- **目的**: 修改基类构造函数，接收回调。
- **修改内容**:
  ```typescript
  // ... 其他 import ...

  // 定义回调函数类型
  export type ExecutorDataCallback = (data: any, error?: Error) => void;

  export abstract class DataSourceExecutor {
    // ... 其他属性 ...
    protected readonly _dataCallback: ExecutorDataCallback;

    // 修改构造函数，增加 dataCallback 参数
    constructor(config: any, dataCallback: ExecutorDataCallback) {
      // ... 其他初始化 ...
      this._dataCallback = dataCallback;
    }

    // 在获取到数据的地方（例如 _onDataReceived 方法）
    protected _onDataReceived(data: any) {
      // 调用回调，而不是推送到全局 center
      this._dataCallback(data);
    }

    // 在出错的地方
    protected _onError(error: Error) {
      this._dataCallback(null, error);
    }

    // ... 其他方法 ...
  }
  ```

#### **文件 2: `src/core/data-source-system/executors/index.ts`**

- **目的**: 修改工厂方法，使其能传递回调函数。
- **修改内容**:
  ```typescript
  // ... 其他 import ...
  import type { ExecutorDataCallback } from '../DataSourceExecutor';

  export class ExecutorFactory {
    // 修改 create 方法签名
    public static create(config: any, dataCallback: ExecutorDataCallback): DataSourceExecutor | null {
      // ... 内部逻辑 ...
      switch (config.type) {
        case 'HTTP':
          // 在创建实例时，将 dataCallback 传递进去
          return new HttpItemExecutor(config, dataCallback);
        // ... 其他 case ...
        default:
          return null;
      }
    }
    // ... 其他方法 ...
  }
  ```
  *需要对所有具体的执行器（如 `HttpItemExecutor`）的构造函数进行相应的修改，以接收并传递 `dataCallback` 给父类 `DataSourceExecutor`。*

### 任务三：创建新的 `useWidgetData` Hook

这个新的 Hook 将封装与 `DataRepository` 的交互逻辑。

- **操作**: 在 `src/card2.1/hooks/` 目录下创建新文件。
- **创建文件**: `src/card2.1/hooks/use-widget-data.ts`
- **修改内容**:
  ```typescript
  // src/card2.1/hooks/use-widget-data.ts

  import { useState, useEffect, useCallback } from 'vue'; // 或 React
  import { dataRepository } from '@/core/data-repository';

  export function useWidgetData(dataSourceConfig: any) {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    // 使用 useCallback 确保回调函数实例的稳定性
    const handleDataUpdate = useCallback((newData: any, newError?: Error) => {
      setData(newData);
      setError(newError || null);
      setIsLoading(false);
    }, []);

    useEffect(() => {
      if (!dataSourceConfig) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      dataRepository.subscribe(dataSourceConfig, handleDataUpdate);

      // 返回一个清理函数，在组件卸载或配置变更时取消订阅
      return () => {
        dataRepository.unsubscribe(dataSourceConfig, handleDataUpdate);
      };
    }, [dataSourceConfig, handleDataUpdate]); // 依赖项包含配置和回调

    return { data, isLoading, error };
  }
  ```

### 任务四：重构 `useWidgetProps` Hook

这是改造的最后一环，让 `useWidgetProps` 使用新的 `useWidgetData` 来获取动态数据。

- **操作**: 修改 `src/card2.1/hooks/useWidgetProps.ts`。
- **修改内容**:
  ```typescript
  // src/card2.1/hooks/useWidgetProps.ts

  // ... 其他 import ...
  import { useWidgetData } from './use-widget-data';
  // 移除对 dataSourceCenter 的引用

  export function useWidgetProps(props: any) {
    // ... 原有的静态 props 处理逻辑保留 ...

    // 1. 提取数据源配置
    const dataSourceConfig = props.dataSource; // 假设数据源配置在 props.dataSource

    // 2. 调用新的 Hook 获取动态数据
    const { data: dynamicData, isLoading, error } = useWidgetData(dataSourceConfig);

    // 3. 移除所有旧的、手动的订阅和数据绑定逻辑
    // (删除对 DataBindingManager 的订阅调用，删除对 dataSourceCenter 的直接交互)

    // 4. 合并处理 props
    const finalProps = computed(() => {
      const result = { ...props.staticProps };
      // 旧的 DataBindingManager 可能仍可用于数据转换
      // 但现在它处理的是来自 useWidgetData 的数据，而不是自己去订阅
      if (dynamicData) {
        // ... 使用 DataBindingManager 或其他逻辑处理 dynamicData ...
        // ... 并将结果合并到 result 中 ...
      }
      return result;
    });

    // 返回最终的 props、加载状态和错误信息
    return {
      finalProps,
      isLoading,
      error,
    };
  }
  ```

### 任务五：清理和废弃

- **操作**: 在整个项目中搜索 `dataSourceCenter` 的引用。
- **结果**: 一旦确认所有引用都已被 `DataRepository` 的逻辑替代，就可以安全地删除 `dataSourceCenter` 模块文件。

## 3. 总结

完成以上步骤后，系统的数据流将变得更加清晰和健壮。`DataRepository` 将作为唯一的数据源管理中心，组件通过 `useWidgetData` Hook 以声明式的方式消费数据，极大地降低了系统的复杂度和维护成本。
