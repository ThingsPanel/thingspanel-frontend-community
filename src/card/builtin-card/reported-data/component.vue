<template>
  <div class="reported-data-card p-4 bg-white rounded-lg shadow-sm border border-gray-100">
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-base font-semibold flex items-center text-gray-700">
        <!-- Header Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        {{ $t('cards.reportedData') }}
      </h2>
      <button class="text-xs text-blue-500 flex items-center hover:text-blue-700">
         <!-- Refresh Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        实时刷新中
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8 text-gray-500">加载中...</div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8 text-red-500">加载数据失败: {{ error.message }}</div>

    <!-- Data Display -->
    <div v-else class="space-y-3">
      <!-- No Data State -->
      <div v-if="!devices || devices.length === 0" class="text-center py-8 text-gray-400">暂无数据</div>
      <!-- Device List -->
      <div v-for="(device, index) in devices" :key="device.device_id" class="p-3 rounded-md" :class="getDeviceBgColor(index)">
        <!-- Device Header -->
        <div class="flex justify-between items-center mb-2 text-xs">
          <div class="flex items-center font-medium text-gray-800">
            <span class="mr-1.5 text-gray-600">
              <!-- Generic Device Icon Placeholder -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </span>
            <span class="text-sm truncate" :title="device.device_name">{{ device.device_name }}</span>
            <!-- Online Status Indicator -->
            <span v-if="device.is_online === 1" class="ml-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" title="在线"></span>
            <span v-else class="ml-1.5 w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" title="离线"></span>
          </div>
          <!-- Last Push Time -->
          <div class="text-gray-500 flex items-center flex-shrink-0 pl-2">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             {{ formatRelativeTime(device.last_push_time) }}
          </div>
        </div>
        <!-- Device Telemetry Data (Grid) -->
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-1">
           <div v-for="item in getDisplayTelemetry(device.telemetry_data)" :key="item.key" class="flex justify-between items-start col-span-2 mb-1 border-b border-gray-200/50 pb-1 last:border-b-0 md:col-span-1 md:border-b-0 md:pb-0">
             <!-- Label -->
             <span class="text-gray-500 mr-2 truncate pt-0.5 flex-shrink-0" :title="item.label || item.key">{{ item.label || item.key }}:</span>
             <!-- Value - Conditional Rendering -->
             <div class="text-right flex-grow font-medium text-gray-800 min-w-0 pl-2">
                 <!-- Case 1: Value is a JSON string -->
                 <template v-if="isJsonString(item.value)">
                   <template v-if="parseJson(item.value as string) !== null">
                      <!-- Use the Recursive Renderer Component -->
                      <RecursiveJsonRenderer :data="parseJson(item.value as string)" class="text-xs text-left mt-1" />
                   </template>
                   <!-- Fallback if JSON parsing fails -->
                   <span v-else class="whitespace-pre-wrap break-all text-xs text-red-600" :title="String(item.value)">{{ item.value }} (JSON 解析失败)</span>
                 </template>
                  <!-- Case 2: Value is NOT a JSON string -->
                  <span v-else class="whitespace-normal break-words" :title="String(item.value)">{{ formatValue(item) }}</span>
             </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Footer Link -->
    <div class="mt-4 text-center">
      <a href="#" class="text-blue-500 text-xs hover:underline">查看全部数据 ></a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { $t } from '@/locales';
import { getLatestTelemetryData } from '@/service/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { defineComponent, h } from 'vue';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

defineOptions({
  name: 'ReportedDataCard'
});

// --- 在组件内部定义数据结构接口 ---
interface TelemetryItem {
  key: string;
  label: string | null;
  unit: string | null;
  value: any;
}

interface DeviceData {
  device_id: string;
  device_name: string;
  is_online: number;
  last_push_time: string;
  telemetry_data: TelemetryItem[];
}

// 定义 API 响应的本地接口
interface ApiLatestTelemetryResponse {
  data: DeviceData[] | null;
  error: any; // 使用 any 避免复杂的错误类型定义
}
// --- 接口定义结束 ---

// --- 创建响应式变量 ---
const devices = ref<DeviceData[]>([]);
const loading = ref(true);
const error = ref<Error | null>(null);

// --- 组件挂载时获取数据 ---
onMounted(async () => {
  loading.value = true;
  error.value = null;
  try {
    // 调用 API 函数获取数据，使用本地定义的接口类型
    const response: ApiLatestTelemetryResponse = await getLatestTelemetryData();
    console.log('API Response:', response);

    // 检查 API 是否返回错误
    if (response.error) {
      let errorMessage = 'API 返回错误';
      if (typeof response.error === 'string') {
        errorMessage = response.error;
      } else if (typeof response.error === 'object' && response.error !== null && (response.error as any).message) {
        errorMessage = (response.error as any).message;
      }
      throw new Error(errorMessage);
    }

    // 确认 response.data 是数组类型，然后赋值给 devices
    devices.value = Array.isArray(response.data) ? response.data : [];
    console.log('Processed Devices:', devices.value);

  } catch (err) {
    // 捕获 API 调用或处理过程中的错误
    console.error('加载或处理最新遥测数据时出错:', err);
    error.value = err instanceof Error ? err : new Error('加载数据时发生未知错误');
    devices.value = []; // 出错时清空设备列表
  } finally {
    // 不论成功或失败，加载结束，设置 loading 为 false
    loading.value = false;
  }
});

// --- 定义本地递归渲染组件 ---
const RecursiveJsonRenderer = defineComponent({
  name: 'RecursiveJsonRenderer',
  props: {
    data: { required: true }, // 数据可以是任何类型
    level: { type: Number, default: 0 } // 用于控制缩进
  },
  setup(props) {
    const renderData = (data: any, currentLevel: number) => {
      const indent = ' '.repeat(currentLevel * 2); // 创建缩进

      if (Array.isArray(data)) {
        // --- 渲染数组 ---
        if (data.length === 0) return h('span', '[]');
        return h('div', { class: 'json-array ml-2' }, [
          h('span', '['),
          ...data.map((item, index) => 
            h('div', { class: 'json-item', style: `padding-left: ${indent}` }, [
              h(RecursiveJsonRenderer, { data: item, level: currentLevel + 1 })
            ])
          ),
          h('span', { style: `padding-left: ${indent.substring(2)}` }, ']')
        ]);
      } else if (typeof data === 'object' && data !== null) {
        // --- 渲染对象 ---
        const entries = Object.entries(data);
        if (entries.length === 0) return h('span', '{}');
        return h('div', { class: 'json-object ml-2' }, [
          h('span', '{'),
          ...entries.map(([key, value]) => 
            h('div', { class: 'json-key-value', style: `padding-left: ${indent}` }, [
              h('strong', { class: 'json-key mr-1' }, `"${key}":`),
              h(RecursiveJsonRenderer, { data: value, level: currentLevel + 1 })
            ])
          ),
          h('span', { style: `padding-left: ${indent.substring(2)}` }, '}')
        ]);
      } else if (typeof data === 'string') {
        // --- 渲染字符串 ---
        return h('span', { class: 'json-string text-green-700' }, `"${data}"`);
      } else if (typeof data === 'number') {
        // --- 渲染数字 ---
        return h('span', { class: 'json-number text-blue-700' }, String(data));
      } else if (typeof data === 'boolean') {
        // --- 渲染布尔值 ---
        return h('span', { class: 'json-boolean text-purple-700' }, String(data));
      } else if (data === null) {
        // --- 渲染 null ---
        return h('span', { class: 'json-null text-gray-500' }, 'null');
      } else {
        // --- 其他 (undefined 等) ---
        return h('span', { class: 'json-other text-gray-400' }, String(data));
      }
    };

    // 返回渲染函数
    return () => renderData(props.data, props.level);
  }
});
// --- 递归渲染组件定义结束 ---

// --- 添加辅助函数 ---

// 格式化相对时间
const formatRelativeTime = (timeStr: string | null | undefined): string => {
  if (!timeStr) return '-';
  const time = dayjs(timeStr);
  if (!time.isValid()) return '-'; // Handle invalid date strings
  const now = dayjs();
  if (now.diff(time, 'minute') < 1) return '刚刚';
  if (now.diff(time, 'hour') < 1) return `${now.diff(time, 'minute')}分钟前`;
  if (now.diff(time, 'day') < 1) return `${now.diff(time, 'hour')}小时前`;
  return time.fromNow();
};

// 获取设备图标标识符 (简单示例，返回通用图标)
const getDeviceIcon = (device: DeviceData): string => {
  // 这里可以添加基于 device.device_name 的逻辑来返回不同图标标识符
  // 例如: if (device.device_name.includes('温控')) return 'temp';
  // 现在暂时返回 'default'，模板中使用通用图标
  return 'default';
};

// 根据索引获取设备背景色 (模拟图片效果)
const getDeviceBgColor = (index: number): string => {
   if (index === 0) return 'bg-blue-50 border border-blue-100';
   return 'bg-gray-50 border border-gray-100';
};

// 获取要显示的遥测数据 (返回全部)
const getDisplayTelemetry = (telemetry: TelemetryItem[] | null | undefined): TelemetryItem[] => {
  // 移除 .slice(0, 4) 以返回所有项目
  return Array.isArray(telemetry) ? telemetry : [];
};

// 格式化顶层值或递归中的基本类型
const formatValue = (item: TelemetryItem | any): string => {
   // 检查是否是递归调用传来的基本类型
   if (item !== null && typeof item !== 'object') {
     if (typeof item === 'string') return item; // 字符串直接返回
     if (typeof item === 'number') return String(item);
     if (typeof item === 'boolean') return item ? $t('common.yes', '是') : $t('common.no', '否');
     return String(item); // 其他基本类型转字符串
   }
   
   // --- 处理顶层 TelemetryItem 对象 ---
   if (!item || item.value === null || item.value === undefined) return '-';
   const value = item.value;
   const key = item.key;
   const unit = item.unit;
   let displayValue = '';
 
   // 1. 特殊字符串值处理
   // ... (根据需要添加)
 
   // 2. 布尔值处理
   if (typeof value === 'boolean') {
     displayValue = value ? $t('common.yes', '是') : $t('common.no', '否');
     if (key?.includes('switch')) {
       displayValue = value ? $t('common.on', '开') : $t('common.off', '关');
     }
   // 3. 数字处理
   } else if (typeof value === 'number') {
     if ((key === 'temperature' || key === 'humidity') && value != null) {
       displayValue = value.toFixed(1);
     } else {
       displayValue = String(value);
     }
   // 4. 其他类型 (主要是字符串, 但非 JSON 字符串)
   } else {
     displayValue = String(value);
   }
 
   // 5. 添加单位
   if (unit) {
     if (unit === '%' || unit === '°C') {
       displayValue += unit;
     } else {
       displayValue += ` ${unit}`;
     }
   }
 
   return displayValue;
 };

// --- 新增辅助函数 ---

// 检查值是否为 JSON 格式的字符串
const isJsonString = (value: any): boolean => {
  if (typeof value !== 'string') {
    return false;
  }
  const trimmedValue = value.trim();
  // 简单检查是否以 { 或 [ 开头并以 } 或 ] 结尾
  return (
    (trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) ||
    (trimmedValue.startsWith('[') && trimmedValue.endsWith(']'))
  );
};

// 安全地解析 JSON 字符串
const parseJson = (jsonString: string): object | any[] | null => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn('Failed to parse JSON string:', jsonString, e); // 打印警告方便调试
    return null; // 解析失败返回 null
  }
};

</script>

<style scoped>
/* 可以添加一些微调样式 */
.reported-data-card {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
