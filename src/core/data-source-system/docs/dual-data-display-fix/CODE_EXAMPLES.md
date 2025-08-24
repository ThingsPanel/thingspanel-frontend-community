# DualDataDisplay 修复代码示例和最佳实践

## 核心修复代码

### 1. ConfigurationPanel.vue 修复

#### 修复前（问题代码）

```vue
<template>
  <div class="configuration-panel">
    <!-- 其他配置组件 -->
    
    <!-- 问题：缺少 component-id 和 component-type 属性 -->
    <DataSourceConfigForm
      v-model="dataSourceConfig"
      :data-sources="dataSources"
      :selected-widget-id="selectedWidget?.id"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import DataSourceConfigForm from './DataSourceConfigForm.vue';

// 组件逻辑...
</script>
```

#### 修复后（正确代码）

```vue
<template>
  <div class="configuration-panel">
    <!-- 其他配置组件 -->
    
    <!-- 修复：添加必需的 component-id 和 component-type 属性 -->
    <DataSourceConfigForm
      v-model="dataSourceConfig"
      :data-sources="dataSources"
      :selected-widget-id="selectedWidget?.id"
      :component-id="selectedWidget?.id"
      :component-type="selectedWidget?.type"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import DataSourceConfigForm from './DataSourceConfigForm.vue';

// 组件逻辑...
</script>
```

### 2. DataSourceConfigForm.vue 完整实现

```vue
<template>
  <div class="data-source-config-form">
    <div class="form-section">
      <label for="raw-data">原始数据</label>
      <textarea
        id="raw-data"
        v-model="rawData"
        class="raw-data-input"
        rows="10"
        placeholder="请输入JSON格式的原始数据"
      />
    </div>
    
    <!-- 其他配置字段 -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ComponentExecutorManager } from '@/core/ComponentExecutorManager';

// Props 定义
interface Props {
  modelValue: any;
  dataSources: any[];
  selectedWidgetId?: string;
  componentId?: string;  // 关键属性
  componentType?: string; // 关键属性
}

const props = withDefaults(defineProps<Props>(), {
  dataSources: () => [],
});

// Emits 定义
const emit = defineEmits<{
  'update:modelValue': [value: any];
}>();

// 响应式数据
const currentModelValue = ref({ ...props.modelValue });
const selectedDataSourceId = ref('default');

// 计算属性：rawData 的 getter 和 setter
const rawData = computed({
  get() {
    const binding = currentModelValue.value.config?.dataSourceBindings?.[selectedDataSourceId.value];
    return binding?.rawData || '';
  },
  set(value: string) {
    console.log('[DataSourceConfigForm] rawData setter 被调用:', value);
    updateDataSourceConfig('rawData', value);
  }
});

// 核心方法：更新数据源配置
const updateDataSourceConfig = (field: string, value: any) => {
  console.log('[DataSourceConfigForm] updateDataSourceConfig 调用:', { field, value });
  
  // 获取当前绑定配置
  const currentBinding = currentModelValue.value.config?.dataSourceBindings?.[selectedDataSourceId.value] || {};
  
  // 更新配置数据
  if (!currentModelValue.value.config) {
    currentModelValue.value.config = {};
  }
  if (!currentModelValue.value.config.dataSourceBindings) {
    currentModelValue.value.config.dataSourceBindings = {};
  }
  
  currentModelValue.value.config.dataSourceBindings[selectedDataSourceId.value] = {
    ...currentBinding,
    [field]: value
  };
  
  // 设置强制更新标记
  currentModelValue.value.metadata = {
    ...currentModelValue.value.metadata,
    forceUpdate: true,
    lastChangedField: field,
    updatedAt: Date.now()
  };
  
  console.log('[DataSourceConfigForm] 更新后的配置:', currentModelValue.value);
  
  // 触发父组件更新
  emit('update:modelValue', currentModelValue.value);
  
  // 触发执行器更新
  triggerExecutorUpdate(currentModelValue.value);
};

// 核心方法：触发执行器更新
const triggerExecutorUpdate = (config: any) => {
  console.log('[DataSourceConfigForm] triggerExecutorUpdate 调用:', {
    componentId: props.componentId,
    componentType: props.componentType,
    hasForceUpdate: config.metadata?.forceUpdate
  });
  
  // 关键检查：确保有必要的组件标识
  if (!props.componentId || !props.componentType) {
    console.warn('[DataSourceConfigForm] 缺少 componentId 或 componentType，无法触发执行器更新');
    return;
  }
  
  // 调用组件执行器管理器
  ComponentExecutorManager.updateComponentExecutor(
    props.componentId,
    props.componentType,
    config
  );
};

// 监听 props.modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    currentModelValue.value = { ...newValue };
  },
  { deep: true }
);
</script>

<style scoped>
.data-source-config-form {
  padding: 16px;
}

.form-section {
  margin-bottom: 16px;
}

.raw-data-input {
  width: 100%;
  min-height: 200px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px;
}
</style>
```

### 3. ComponentExecutorManager.ts 核心实现

```typescript
/**
 * 组件执行器管理器
 * 负责管理组件的数据执行和更新
 */
export class ComponentExecutorManager {
  private static instance: ComponentExecutorManager;
  private componentCallbacks: Map<string, Function> = new Map();
  private lastConfigs: Map<string, any> = new Map();
  private executionCache: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): ComponentExecutorManager {
    if (!ComponentExecutorManager.instance) {
      ComponentExecutorManager.instance = new ComponentExecutorManager();
    }
    return ComponentExecutorManager.instance;
  }

  /**
   * 注册组件回调函数
   * @param componentId 组件ID
   * @param callback 回调函数
   */
  public registerComponent(componentId: string, callback: Function): void {
    console.log('[ComponentExecutorManager] 注册组件:', componentId);
    this.componentCallbacks.set(componentId, callback);
  }

  /**
   * 注销组件
   * @param componentId 组件ID
   */
  public unregisterComponent(componentId: string): void {
    console.log('[ComponentExecutorManager] 注销组件:', componentId);
    this.componentCallbacks.delete(componentId);
    this.lastConfigs.delete(componentId);
    this.executionCache.delete(componentId);
  }

  /**
   * 更新组件执行器
   * @param componentId 组件ID
   * @param componentType 组件类型
   * @param config 配置对象
   */
  public updateComponentExecutor(componentId: string, componentType: string, config: any): void {
    const hasForceUpdate = config.metadata?.forceUpdate;
    const lastChangedField = config.metadata?.lastChangedField;
    
    console.log('[ComponentExecutorManager] 强制更新检查:', {
      componentId,
      componentType,
      hasForceUpdate,
      lastChangedField,
      metadata: config.metadata
    });
    
    // 检查是否需要强制更新
    if (hasForceUpdate) {
      console.log('[ComponentExecutorManager] 执行强制更新');
      this.executeComponent(componentId, config);
      
      // 清除强制更新标记
      config.metadata.forceUpdate = false;
    } else {
      // 检查配置是否有变化
      const isChanged = this.isConfigChanged(componentId, config);
      if (isChanged) {
        console.log('[ComponentExecutorManager] 配置有变化，执行更新');
        this.executeComponent(componentId, config);
      } else {
        console.log('[ComponentExecutorManager] 配置无变化，跳过更新');
      }
    }
    
    // 更新最后配置
    this.lastConfigs.set(componentId, JSON.parse(JSON.stringify(config)));
  }

  /**
   * 检查配置是否有变化
   * @param componentId 组件ID
   * @param newConfig 新配置
   * @returns 是否有变化
   */
  private isConfigChanged(componentId: string, newConfig: any): boolean {
    const lastConfig = this.lastConfigs.get(componentId);
    
    if (!lastConfig) {
      return true; // 首次配置
    }
    
    // 深度比较配置对象
    const isChanged = !this.deepEqual(lastConfig.config, newConfig.config);
    
    if (isChanged) {
      console.log('[ComponentExecutorManager] 配置变化检测:', {
        componentId,
        lastConfig: lastConfig.config,
        newConfig: newConfig.config
      });
    }
    
    return isChanged;
  }

  /**
   * 执行组件数据处理
   * @param componentId 组件ID
   * @param config 配置对象
   */
  private executeComponent(componentId: string, config: any): void {
    console.log('[ComponentExecutorManager] 开始执行组件:', componentId);
    
    try {
      // 1. 转换配置为执行器格式
      const executorConfig = this.convertConfigToExecutorFormat(config);
      
      // 2. 执行数据处理
      const executorData = this.processData(executorConfig);
      
      // 3. 缓存执行结果
      this.executionCache.set(componentId, executorData);
      
      // 4. 通知组件更新
      this.notifyComponentUpdate(componentId, executorData);
      
      console.log('[ComponentExecutorManager] 组件执行完成:', componentId);
    } catch (error) {
      console.error('[ComponentExecutorManager] 组件执行失败:', componentId, error);
    }
  }

  /**
   * 转换配置为执行器格式
   * @param config 原始配置
   * @returns 执行器配置
   */
  private convertConfigToExecutorFormat(config: any): any {
    console.log('[ComponentExecutorManager] 转换配置格式:', config);
    
    const executorConfig = {
      dataSourceBindings: config.config?.dataSourceBindings || {},
      metadata: config.metadata || {},
      timestamp: Date.now()
    };
    
    console.log('[ComponentExecutorManager] 转换后的执行器配置:', executorConfig);
    return executorConfig;
  }

  /**
   * 处理数据
   * @param executorConfig 执行器配置
   * @returns 处理后的数据
   */
  private processData(executorConfig: any): any {
    console.log('[ComponentExecutorManager] 开始数据处理:', executorConfig);
    
    const processedData = {
      rawData: {},
      processedData: {},
      metadata: {
        processedAt: Date.now(),
        version: '1.0.0'
      }
    };
    
    // 处理每个数据源绑定
    Object.entries(executorConfig.dataSourceBindings).forEach(([key, binding]: [string, any]) => {
      if (binding.rawData) {
        try {
          // 尝试解析 JSON 数据
          const parsedData = typeof binding.rawData === 'string' 
            ? JSON.parse(binding.rawData) 
            : binding.rawData;
          
          processedData.rawData[key] = parsedData;
          processedData.processedData[key] = this.transformData(parsedData, binding);
        } catch (error) {
          console.error('[ComponentExecutorManager] 数据解析失败:', key, error);
          processedData.rawData[key] = binding.rawData;
          processedData.processedData[key] = binding.rawData;
        }
      }
    });
    
    console.log('[ComponentExecutorManager] 数据处理完成:', processedData);
    return processedData;
  }

  /**
   * 转换数据
   * @param data 原始数据
   * @param binding 绑定配置
   * @returns 转换后的数据
   */
  private transformData(data: any, binding: any): any {
    // 根据字段映射转换数据
    if (binding.fieldMappings && typeof data === 'object') {
      const transformedData = {};
      
      Object.entries(binding.fieldMappings).forEach(([targetField, sourceField]: [string, any]) => {
        if (data[sourceField] !== undefined) {
          transformedData[targetField] = data[sourceField];
        }
      });
      
      return transformedData;
    }
    
    return data;
  }

  /**
   * 通知组件更新
   * @param componentId 组件ID
   * @param executorData 执行器数据
   */
  private notifyComponentUpdate(componentId: string, executorData: any): void {
    const callback = this.componentCallbacks.get(componentId);
    
    if (callback) {
      console.log('[ComponentExecutorManager] 通知组件更新:', componentId);
      callback(executorData);
    } else {
      console.warn('[ComponentExecutorManager] 未找到组件回调函数:', componentId);
    }
  }

  /**
   * 深度比较两个对象
   * @param obj1 对象1
   * @param obj2 对象2
   * @returns 是否相等
   */
  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
      return true;
    }
    
    if (obj1 == null || obj2 == null) {
      return false;
    }
    
    if (typeof obj1 !== typeof obj2) {
      return false;
    }
    
    if (typeof obj1 !== 'object') {
      return obj1 === obj2;
    }
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false;
      }
      
      if (!this.deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }
    
    return true;
  }
}

// 导出单例实例
export default ComponentExecutorManager.getInstance();
```

### 4. Card2Wrapper.vue 集成示例

```vue
<template>
  <div class="card2-wrapper">
    <component
      :is="componentType"
      v-bind="componentProps"
      :executor-data="executorData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import ComponentExecutorManager from '@/core/ComponentExecutorManager';

// Props 定义
interface Props {
  componentType: string;
  nodeId: string;
  config: any;
}

const props = defineProps<Props>();

// 响应式数据
const executorData = ref<any>(null);

// 计算属性：组件属性
const componentProps = computed(() => {
  return {
    ...props.config,
    nodeId: props.nodeId
  };
});

// 处理执行器数据更新
const handleExecutorDataUpdate = (newExecutorData: any) => {
  console.log('[Card2Wrapper] 接收到执行器数据更新:', {
    nodeId: props.nodeId,
    componentType: props.componentType,
    newExecutorData
  });
  
  executorData.value = newExecutorData;
};

// 组件挂载时注册
onMounted(() => {
  console.log('[Card2Wrapper] 注册组件:', props.nodeId);
  
  // 注册组件到执行器管理器
  ComponentExecutorManager.registerComponent(
    props.nodeId,
    handleExecutorDataUpdate
  );
  
  // 初始化执行器
  if (props.config) {
    ComponentExecutorManager.updateComponentExecutor(
      props.nodeId,
      props.componentType,
      props.config
    );
  }
});

// 组件卸载时注销
onUnmounted(() => {
  console.log('[Card2Wrapper] 注销组件:', props.nodeId);
  ComponentExecutorManager.unregisterComponent(props.nodeId);
});
</script>

<style scoped>
.card2-wrapper {
  width: 100%;
  height: 100%;
}
</style>
```

## 最佳实践

### 1. 属性传递最佳实践

#### 使用 TypeScript 接口定义

```typescript
// 定义清晰的 Props 接口
interface ComponentProps {
  // 必需属性
  componentId: string;
  componentType: string;
  modelValue: any;
  
  // 可选属性
  dataSources?: any[];
  selectedWidgetId?: string;
}

// 使用 withDefaults 提供默认值
const props = withDefaults(defineProps<ComponentProps>(), {
  dataSources: () => [],
});
```

#### 运行时属性验证

```typescript
// 添加属性验证函数
const validateRequiredProps = () => {
  const required = ['componentId', 'componentType'];
  const missing = required.filter(key => !props[key]);
  
  if (missing.length > 0) {
    const error = `组件缺少必需属性: ${missing.join(', ')}`;
    console.error('[Props Validation]', error);
    throw new Error(error);
  }
};

// 在组件挂载时验证
onMounted(() => {
  validateRequiredProps();
});
```

### 2. 数据流管理最佳实践

#### 统一的数据更新接口

```typescript
// 定义统一的数据更新接口
interface DataUpdatePayload {
  field: string;
  value: any;
  metadata?: {
    forceUpdate?: boolean;
    lastChangedField?: string;
    updatedAt?: number;
  };
}

// 统一的数据更新方法
const updateData = (payload: DataUpdatePayload) => {
  const { field, value, metadata = {} } = payload;
  
  // 更新数据
  updateDataSourceConfig(field, value);
  
  // 设置元数据
  if (metadata.forceUpdate !== false) {
    metadata.forceUpdate = true;
    metadata.lastChangedField = field;
    metadata.updatedAt = Date.now();
  }
  
  // 触发更新
  triggerExecutorUpdate({
    config: currentConfig.value,
    metadata
  });
};
```

#### 防抖处理

```typescript
import { debounce } from 'lodash-es';

// 对频繁的数据更新进行防抖处理
const debouncedUpdateData = debounce((field: string, value: any) => {
  updateDataSourceConfig(field, value);
}, 300);

// 在 computed setter 中使用
const rawData = computed({
  get() {
    return getCurrentRawData();
  },
  set(value: string) {
    // 立即更新本地状态（用户体验）
    localRawData.value = value;
    
    // 防抖更新远程状态（性能优化）
    debouncedUpdateData('rawData', value);
  }
});
```

### 3. 错误处理最佳实践

#### 全局错误处理

```typescript
// 定义错误类型
interface DataFlowError {
  type: 'validation' | 'execution' | 'network' | 'unknown';
  message: string;
  componentId?: string;
  field?: string;
  originalError?: Error;
}

// 全局错误处理器
class ErrorHandler {
  static handle(error: DataFlowError) {
    console.error('[DataFlow Error]', error);
    
    // 根据错误类型进行不同处理
    switch (error.type) {
      case 'validation':
        // 显示验证错误提示
        showValidationError(error.message);
        break;
      case 'execution':
        // 显示执行错误提示
        showExecutionError(error.message);
        break;
      case 'network':
        // 显示网络错误提示
        showNetworkError(error.message);
        break;
      default:
        // 显示通用错误提示
        showGenericError(error.message);
    }
  }
}

// 在关键位置使用错误处理
const updateDataSourceConfig = (field: string, value: any) => {
  try {
    // 数据更新逻辑
    doUpdateDataSourceConfig(field, value);
  } catch (error) {
    ErrorHandler.handle({
      type: 'execution',
      message: `更新数据源配置失败: ${error.message}`,
      componentId: props.componentId,
      field,
      originalError: error
    });
  }
};
```

### 4. 性能优化最佳实践

#### 智能缓存策略

```typescript
// 缓存管理器
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  invalidate(pattern: string) {
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

const cacheManager = new CacheManager();

// 在数据处理中使用缓存
const processData = (executorConfig: any): any => {
  const cacheKey = generateCacheKey(executorConfig);
  
  // 检查缓存
  if (!executorConfig.metadata?.forceUpdate) {
    const cachedData = cacheManager.get(cacheKey);
    if (cachedData) {
      console.log('[Cache] 使用缓存数据:', cacheKey);
      return cachedData;
    }
  }
  
  // 处理数据
  const processedData = doProcessData(executorConfig);
  
  // 缓存结果
  cacheManager.set(cacheKey, processedData);
  
  return processedData;
};
```

#### 批量更新优化

```typescript
// 批量更新管理器
class BatchUpdateManager {
  private pendingUpdates = new Map<string, any>();
  private updateTimer: number | null = null;
  
  scheduleUpdate(componentId: string, config: any) {
    // 收集待更新的配置
    this.pendingUpdates.set(componentId, config);
    
    // 清除之前的定时器
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    
    // 设置新的定时器
    this.updateTimer = setTimeout(() => {
      this.flushUpdates();
    }, 16); // 下一个动画帧
  }
  
  private flushUpdates() {
    console.log('[BatchUpdate] 执行批量更新:', this.pendingUpdates.size);
    
    // 批量执行更新
    for (const [componentId, config] of this.pendingUpdates) {
      ComponentExecutorManager.updateComponentExecutor(
        componentId,
        config.componentType,
        config
      );
    }
    
    // 清空待更新队列
    this.pendingUpdates.clear();
    this.updateTimer = null;
  }
}

const batchUpdateManager = new BatchUpdateManager();

// 在触发更新时使用批量管理器
const triggerExecutorUpdate = (config: any) => {
  if (props.componentId && props.componentType) {
    batchUpdateManager.scheduleUpdate(props.componentId, {
      ...config,
      componentType: props.componentType
    });
  }
};
```

这些代码示例和最佳实践为 DualDataDisplay 组件的数据流管理提供了完整的解决方案，确保系统的稳定性、性能和可维护性。