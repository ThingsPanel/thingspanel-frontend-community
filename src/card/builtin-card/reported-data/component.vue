<template>
  <div 
    class="reported-data-card p-4 bg-white rounded-lg shadow-sm border border-gray-100 transition duration-700 ease-in-out"
    :class="{}" 
  >
    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-base font-semibold flex items-center text-gray-700">
        <!-- Header Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        {{ $t('card.reportedData.title') }}
      </h2>
      <!-- Refresh Toggle Button -->
      <button 
        @click="toggleRefresh"
        class="text-xs flex items-center hover:text-blue-700"
        :class="isRefreshing ? 'text-blue-500' : 'text-gray-500'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {{ isRefreshing ? $t('card.reportedData.refreshing') : $t('card.reportedData.startRefresh') }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8 text-gray-500">{{ $t('common.loading') }}</div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8 text-red-500">{{ $t('common.loadError') }}: {{ error.message }}</div>

    <!-- Data Display Area (Wrapped with NSpin) -->
    <n-spin v-else :show="isFetchingUpdate">
      <div class="space-y-3">
        <!-- No Data State -->
        <div v-if="!devices || devices.length === 0" class="text-center py-8 text-gray-400">{{ $t('common.noData') }}</div>
        <!-- Device List -->
        <div v-for="(device, index) in devices" :key="device.device_id" class="p-3 rounded-md " :class="getDeviceBgColor(index)">
          <!-- Device Header -->
          <div class="flex justify-between items-center mb-2 text-xs mt--1">
            <div class="flex items-center font-medium text-gray-800"> 
              <span class="mr-1.5 text-gray-600">
                <!-- Generic Device Icon Placeholder -->
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </span>
              <span class="text-sm truncate" :title="device.device_name">{{ device.device_name }}</span>
              <!-- Online Status Indicator -->
              <span v-if="device.is_online === 1" class="ml-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" :title="$t('common.online')"></span>
              <span v-else class="ml-1.5 w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" :title="$t('common.offline')"></span>
            </div>
            <!-- Last Push Time -->
            <div class="text-gray-500 flex items-center flex-shrink-0 pl-2">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               {{ formatRelativeTime(device.last_push_time) }}
            </div>
          </div>
          <!-- Device Telemetry Data (Using Scroller with Paired Items) -->
          <div class="telemetry-scroller-container ">
            <BottomUpInfiniteScroller
               v-if="device.telemetry_data && device.telemetry_data.length > 0"
               :list="getPairedTelemetry(device.telemetry_data)" 
               height="76px" 
               :scrollSpeed="20" 
               :startDelay="1500"
             >
               <template #default="{ item: pair }"> 
                 <!-- Render a row with two columns -->
                 <div class="flex text-xs py-1.5 border-b border-gray-200/30 last:border-b-0 mt--2">
                   <!-- Left Column -->
                   <div class="w-1/2 pr-2">
                     <template v-if="pair.left">
                       <div class="text-gray-500 truncate" :title="pair.left.label || pair.left.key">{{ pair.left.label || pair.left.key }}</div>
                       <div class="font-medium text-gray-800 truncate mt-0.5" :title="String(pair.left.value)">
                         {{ formatValue(pair.left) }}
                       </div>
                     </template>
                     <template v-else>&nbsp;</template>
                   </div>
                   <!-- Right Column -->
                   <div class="w-1/2 pl-2 border-l border-gray-200/30">
                     <template v-if="pair.right">
                       <div class="text-gray-500 truncate" :title="pair.right.label || pair.right.key">{{ pair.right.label || pair.right.key }}</div>
                       <div class="font-medium text-gray-800 truncate mt-0.5" :title="String(pair.right.value)">
                         {{ formatValue(pair.right) }}
                       </div>
                     </template>
                     <template v-else>&nbsp;</template>
                   </div>
                 </div>
               </template>
             </BottomUpInfiniteScroller>
             <!-- Show message if no telemetry data -->
             <div v-else class="text-xs text-gray-400 text-center py-2">{{ $t('card.reportedData.noTelemetry') }}</div>
          </div>
        </div>
      </div>
    </n-spin>

    <!-- Footer Link -->
    <div class="mt-4 text-center">
      <a href="/device/manage" class="text-blue-500 text-xs hover:underline">{{ $t('card.viewAll') }} ></a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { $t } from '@/locales';
import { getLatestTelemetryData } from '@/service/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import BottomUpInfiniteScroller from '@/components/BottomUpInfiniteScroller.vue';
import { NSpin } from 'naive-ui';

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

// --- 创建响应式变量 ---
const devices = ref<DeviceData[]>([]);
const loading = ref(true);
const error = ref<Error | null>(null);
const isRefreshing = ref(true);
const refreshIntervalId = ref<NodeJS.Timeout | null>(null);
const REFRESH_INTERVAL = 6000;
const isFetchingUpdate = ref(false);

// --- 计算属性：将遥测数据配对用于两列显示 ---
interface PairedTelemetryItem {
  left: TelemetryItem | null;
  right: TelemetryItem | null;
}

// 为每个设备创建一个计算属性，返回配对后的遥测数据
// 注意：这不能直接在 v-for 内部定义 computed，我们需要一个方法或在渲染时处理
// 更简单的方法是创建一个方法来处理配对
const getPairedTelemetry = (telemetry: TelemetryItem[]): PairedTelemetryItem[] => {
  if (!Array.isArray(telemetry)) return [];
  const paired: PairedTelemetryItem[] = [];
  for (let i = 0; i < telemetry.length; i += 2) {
    paired.push({
      left: telemetry[i] || null,
      right: telemetry[i + 1] || null,
    });
  }
  return paired;
};

// --- 数据获取函数 ---
const fetchData = async (initialLoad = false) => {
  if (!initialLoad) {
      isFetchingUpdate.value = true;
  } else {
      loading.value = true;
  }
  error.value = null;

  console.log(`[ReportedData] Fetching data... Initial: ${initialLoad}`);

  try {
    const response: ApiLatestTelemetryResponse = await getLatestTelemetryData();
    console.log('[ReportedData] API Response:', response);

    if (response.error) {
      let errorMessage = 'API 返回错误';
      if (typeof response.error === 'string') errorMessage = response.error;
      else if (typeof response.error === 'object' && response.error !== null && (response.error as any).message) errorMessage = (response.error as any).message;
      console.error('[ReportedData] API error during fetch:', errorMessage);
      error.value = new Error(errorMessage);
    } else {
      error.value = null;
      devices.value = Array.isArray(response.data) ? response.data : [];
      console.log('[ReportedData] Processed Devices:', devices.value);
    }

  } catch (err) {
    console.error('[ReportedData] Error in fetchData catch block:', err);
    if (initialLoad) {
        error.value = err instanceof Error ? err : new Error('加载数据时发生未知错误');
        devices.value = [];
    } else {
        error.value = err instanceof Error ? err : new Error('刷新数据时发生错误');
    }
  } finally {
    if (initialLoad) {
      
        loading.value = false;
    }
    isFetchingUpdate.value = false;
  }
};

// --- 轮询控制函数 ---
const startPolling = () => {
  stopPolling(); // Clear any existing timer first
  if (!isRefreshing.value) return; // Don't start if toggled off

  console.log(`[ReportedData] Starting polling every ${REFRESH_INTERVAL}ms`);
  refreshIntervalId.value = setInterval(() => {
    console.log('[ReportedData] Polling tick: fetching data...');
    fetchData(false); // Fetch data without setting the main loading state
  }, REFRESH_INTERVAL);
};

const stopPolling = () => {
  if (refreshIntervalId.value) {
    console.log('[ReportedData] Stopping polling');
    clearInterval(refreshIntervalId.value);
    refreshIntervalId.value = null;
  }
};

// --- 切换刷新状态 --- 
const toggleRefresh = () => {
  isRefreshing.value = !isRefreshing.value;
  if (isRefreshing.value) {
    console.log('[ReportedData] Manually starting refresh');
    fetchData(false); // Fetch immediately when turning on
    startPolling();
  } else {
    console.log('[ReportedData] Manually stopping refresh');
    stopPolling();
  }
};

// --- 组件挂载和卸载 ---
onMounted(() => {
  fetchData(true); // Initial data load
  if (isRefreshing.value) {
      startPolling();
  }
});

onUnmounted(() => {
  stopPolling();
});

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

// 根据索引获取设备背景色 (模拟图片效果)
const getDeviceBgColor = (index: number): string => {
   if (index === 0) return 'bg-blue-50 border border-blue-100 border-l-4 border-l-blue-500';
   return 'bg-gray-50 border border-gray-100';
};

// 格式化顶层值或递归中的基本类型
const formatValue = (item: TelemetryItem | any): string => {
   if (item !== null && typeof item !== 'object') {
     if (typeof item === 'string') return item;
     if (typeof item === 'number') return String(item);
     if (typeof item === 'boolean') return item ? $t('common.yes', '是') : $t('common.no', '否');
     return String(item);
   }
   
   if (!item || item.value === null || item.value === undefined) return '-';
   const value = item.value;
   const key = item.key;
   const unit = item.unit;
   let displayValue = '';
 
   if (typeof value === 'boolean') {
     displayValue = value ? $t('common.yes', '是') : $t('common.no', '否');
     if (key?.includes('switch')) {
       displayValue = value ? $t('common.on', '开') : $t('common.off', '关');
     }
   } else if (typeof value === 'number') {
     if ((key === 'temperature' || key === 'humidity') && value != null) {
       displayValue = value.toFixed(1);
     } else {
       displayValue = String(value);
     }
   } else {
     displayValue = String(value);
   }
 
   if (unit) {
     if (unit === '%' || unit === '°C') {
       displayValue += unit;
     } else {
       displayValue += ` ${unit}`;
     }
   }
 
   return displayValue;
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
