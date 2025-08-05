# TelemetryDataHistoryListFilter 组件

这是一个 Vue 3 组件，用于为指定设备的遥测数据历史记录提供筛选功能。它允许用户按时间范围（预设或自定义）和聚合方式（时间窗口和聚合函数）筛选数据，并可选择导出数据。

## 功能

*   选择预设的时间范围（如最近1小时、最近24小时等）或自定义时间范围。
*   选择数据聚合的时间窗口（如不聚合、30秒、1分钟、1小时等）。
*   当选择聚合窗口时，可以选择聚合函数（平均值、最大值、最小值、总和、差值）。
*   根据所选时间范围自动禁用不合适的聚合窗口选项（例如，查询1小时数据时不能按天聚合）。
*   自动根据选择调整聚合窗口，防止选择无效组合。
*   提供两种显示模式：`detailed`（显示带标签的按钮）和 `simple`（显示带 Tooltip 的图标按钮）。
*   可选的导出按钮，用于触发数据导出流程。
*   在筛选条件变化或组件挂载时自动获取数据。
*   当设备 ID (`deviceId`) 或数据键 (`theKey`) 变化时自动重新获取数据。
*   发出数据更新事件 (`update:data`) 和加载状态更新事件 (`update:loading`)。

## Props

| Prop               | 类型                             | 默认值      | 描述                                                                 | 是否必须 |
| :----------------- | :------------------------------- | :---------- | :------------------------------------------------------------------- | :------- |
| `deviceId`         | `string`                         | -           | 要查询数据的设备 ID。                                                | 是       |
| `theKey`           | `string`                         | -           | 要查询的遥测数据键名。                                               | 是       |
| `showExportButton` | `boolean`                        | `false`     | 是否显示导出按钮。                                                   | 否       |
| `displayMode`      | `'detailed' \| 'simple'`        | `'detailed'`| 组件的显示模式：`'detailed'` 显示完整按钮，`'simple'` 显示图标按钮。 | 否       |

## Emits

| 事件名            | 参数类型             | 描述                                                                 |
| :---------------- | :------------------- | :------------------------------------------------------------------- |
| `update:data`     | `TimeSeriesItem[]`   | 当筛选后的数据加载完成时触发，传递获取到的时间序列数据数组。             |
| `update:loading`  | `boolean`            | 当数据加载状态发生变化时触发（开始加载为 `true`，加载结束为 `false`）。 |
| `update:filterParams`| `FilterParams`       | 当内部验证通过，筛选参数准备就绪（用于获取数据或导出）时触发。父组件可以监听此事件以获取当前的筛选条件。 |

## TimeSeriesItem 结构

```typescript
interface TimeSeriesItem {
  x: number; // 时间戳 (毫秒)
  x2?: number; // 可选的第二个时间戳 (用于差值聚合等)
  y: number; // 遥测数值
}
```

## 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue';
import TelemetryDataHistoryListFilter from '@/components/TelemetryDataHistoryListFilter/index.vue'; // 确保路径正确

const deviceId = ref('your-device-id');
const telemetryKey = ref('temperature');
const historyData = ref([]);
const isLoading = ref(false);

const handleDataUpdate = (data) => {
  historyData.value = data;
  console.log('Data updated:', data);
};

const handleLoadingUpdate = (loading) => {
  isLoading.value = loading;
  console.log('Loading state:', loading);
};
</script>

<template>
  <div>
    <h2>Telemetry Data for {{ telemetryKey }}</h2>
    <TelemetryDataHistoryListFilter
      :device-id="deviceId"
      :the-key="telemetryKey"
      :show-export-button="true"
      display-mode="detailed"
      @update:data="handleDataUpdate"
      @update:loading="handleLoadingUpdate"
    />

    <div v-if="isLoading">
      Loading data...
    </div>
    <div v-else>
      <!-- 在这里展示 historyData -->
      <pre>{{ JSON.stringify(historyData, null, 2) }}</pre>
    </div>
  </div>
</template>
```

## 注意事项

*   组件依赖 Naive UI (`naive-ui`) 和 `@vicons/material` 图标库。请确保这些依赖已安装并正确配置。
*   组件依赖一个名为 `telemetryDataHistoryList` 的 API 服务函数来获取数据，以及一个 `useLoading` hook 和 `createLogger` 工具函数。请确保这些服务和工具在项目中可用且路径正确。
*   导出功能 (`handleExport`) 目前仅打印日志并显示提示信息 (`window.$message`)，实际的文件下载逻辑可能需要根据后端 API 的响应来实现。
*   国际化（i18n）目前标记为 `// TODO`，需要根据项目需求进行实现。 