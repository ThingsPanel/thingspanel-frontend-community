<template>
  <div class="p-4 h-full bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
    <h3 class="text-base font-semibold mb-3 text-gray-800 dark:text-gray-100 flex-shrink-0">
      {{ $t('card.tenantChart.title') }}
    </h3>
    <div class="flex-grow flex gap-4 min-h-[200px]"> 
      
      <!-- Left: Stats using wrapper div for color -->
      <div class="w-1/3 flex flex-col justify-around py-2 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 pr-4">
        <div class="text-center"> 
          <n-statistic :label="$t('card.tenantChart.totalUsers', '总用户数')">
             <div :class="[themeStore.isDark ? 'text-blue-400' : 'text-blue-600']">
                <NNumberAnimation :from="0" :to="stats.user_total" />
             </div>
          </n-statistic>
        </div>
        <div class="text-center">
           <n-statistic :label="$t('card.tenantChart.addedMonth', '本月新增')" >
             <div :class="[themeStore.isDark ? 'text-green-400' : 'text-green-600']">
               <NNumberAnimation :from="0" :to="stats.user_added_month"  />
            </div>
           </n-statistic>
        </div>
        <div class="text-center">
            <n-statistic :label="$t('card.tenantChart.addedYesterday', '昨日新增')">
             <div :class="[themeStore.isDark ? 'text-amber-400' : 'text-amber-600']"> 
               <NNumberAnimation :from="0" :to="stats.user_added_yesterday" />
             </div>
            </n-statistic>
        </div>
      </div>

      <!-- Right: Chart -->
      <div class="flex-grow relative"> 
  
        <v-chart
          v-if="!loading && !isEmpty"
          ref="chartRef"
          class="w-full h-full"
          :option="chartOption"
          autoresize
        />
        <div v-if="!loading && errorMsg" class="h-full flex items-center justify-center text-red-500">
          {{ errorMsg }}
        </div>
         <div v-if="!loading && !errorMsg && isEmpty" class="h-full flex items-center justify-center">
           <NEmpty :description="$t('card.noData')" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, provide } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  // LegendComponent, // Hide legend for single series bar chart
  ToolboxComponent 
} from 'echarts/components';
import VChart, { THEME_KEY } from 'vue-echarts';
import { NSpin, NEmpty, NNumberAnimation, NStatistic } from 'naive-ui'; // Added NNumberAnimation and NStatistic
import { useThemeStore } from '@/store/modules/theme';
import { tenant } from '@/service/api/system-data';
import { $t } from '@/locales';

// ECharts components registration
use([
  CanvasRenderer,
  BarChart, 
  TitleComponent,
  TooltipComponent,
  GridComponent,
  // LegendComponent,
  ToolboxComponent
]);

const themeStore = useThemeStore();
const loading = ref(true);
const errorMsg = ref<string | null>(null);
const isEmpty = ref(false);
const chartOption = ref({});
const chartRef = ref<any>(null);

// --- Store Stats --- 
const stats = ref({
  user_total: 0,
  user_added_yesterday: 0,
  user_added_month: 0
});

provide(THEME_KEY, computed(() => themeStore.naiveThemeName));

const getMonthLabel = (monthNumber: number): string => {
  return String(monthNumber);
};

const processData = (userListMonth: { mon: number, num: number }[]): { monthLabels: string[], userCounts: number[] } => {
  const monthLabels: string[] = [];
  const userCounts: number[] = [];

  if (Array.isArray(userListMonth)) {
    userListMonth.sort((a, b) => a.mon - b.mon);
    userListMonth.forEach(item => {
      monthLabels.push(getMonthLabel(item.mon));
      userCounts.push(item.num || 0);
    });
  }
  
  isEmpty.value = monthLabels.length === 0;
  return { monthLabels, userCounts };
};

const updateChartOption = (processedData: { monthLabels: string[], userCounts: number[] }) => {
  const { monthLabels, userCounts } = processedData;
  const seriesName = $t('card.tenantChart.seriesName', 'New Users');

  // --- More Vibrant Bar Color ---
  const barColor = themeStore.isDark ? '#36a2eb' : '#4bc0c0'; // Example: Bright Blue / Teal
  const hoverColor = themeStore.isDark ? '#4cb1ef' : '#5cd1d1'; // Slightly lighter/brighter hover

  chartOption.value = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      // --- Simplified Tooltip Style --- 
      backgroundColor: themeStore.isDark ? 'rgba(40, 40, 40, 0.8)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: 'transparent',
      borderWidth: 0,
      padding: [5, 10],
      textStyle: { color: themeStore.isDark ? '#ccc' : '#333', fontSize: 12 },
      formatter: (params: any) => { // Keep formatter, maybe simplify
          if (!params || params.length === 0) return '';
          const p = params[0];
          return `${p.name}月<br/>${p.marker}${p.seriesName}: <b>${p.value}</b>`; // Simpler tooltip
      }
    },
    grid: {
      left: '1%', // Minimal margins
      right: '3%',
      top: '15%', // Leave space for title/toolbox
      bottom: '3%',
      containLabel: true
    },
    toolbox: {
      show: true,
      feature: {
        saveAsImage: { 
           show: true, 
           title: $t('common.saveAsImage', 'Save'), 
           iconStyle: { 
               borderColor: themeStore.isDark ? '#777' : '#aaa' // Subtle icon border
           }
         }
      },
      top: -5, // Position top right
      right: 0
    },
    xAxis: {
      type: 'category',
      data: monthLabels,
      axisTick: { show: false, alignWithLabel: true }, // Hide ticks
      axisLine: { show: false }, // Hide axis line
      axisLabel: { color: themeStore.isDark ? '#aaa' : '#888', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { show: true, color: themeStore.isDark ? '#aaa' : '#888', fontSize: 11, margin: 15 }, // Keep labels, add margin
      splitLine: { lineStyle: { color: themeStore.isDark ? '#333' : '#eee', type: 'dashed' } },
      axisLine: { show: false }, // Hide Y axis line too
      nameTextStyle: { color: 'transparent' } // Hide Y axis name if any
    },
    series: [
      {
        name: seriesName,
        type: 'bar',
        barWidth: '30%', // --- Reduce bar width --- 
        data: userCounts,
        itemStyle: {
          // --- Rounded corners and color --- 
          color: barColor, // Apply new color
          borderRadius: [4, 4, 0, 0] // Top rounded corners
        },
        emphasis: {
          itemStyle: {
            color: hoverColor // Apply new hover color
          }
        }
      }
    ]
  };
};

const fetchData = async () => {
  loading.value = true;
  errorMsg.value = null;
  isEmpty.value = false;
  try {
    const response = await tenant(); 
    console.log('Tenant data response:', response);

    const responseData = response?.data;

    if (responseData) {
      // --- Store stats --- 
      stats.value = {
        user_total: responseData.user_total || 0,
        user_added_yesterday: responseData.user_added_yesterday || 0,
        user_added_month: responseData.user_added_month || 0
      };
      // Process chart data
      const userListMonth = responseData.user_list_month;
      if (userListMonth) {
        const processed = processData(userListMonth);
        updateChartOption(processed);
      } else {
        isEmpty.value = true; // No chart data
      }
    } else {
      console.warn('No data found in API response:', response);
      isEmpty.value = true;
      stats.value = { user_total: 0, user_added_yesterday: 0, user_added_month: 0 }; // Reset stats
    }

  } catch (err: any) {
    console.error('Error fetching or processing tenant data:', err);
    errorMsg.value = $t('common.loadFailure', 'Failed to load data');
    stats.value = { user_total: 0, user_added_yesterday: 0, user_added_month: 0 }; // Reset stats on error
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

</script>

<style scoped>
/* Style n-statistic */
:deep(.n-statistic .n-statistic__label) {
  font-size: 12px; 
  color: #6b7280; /* gray-500 */
}

:deep(.n-statistic .n-statistic-value__content) {
  font-size: 1.75rem; /* text-2xl or adjust */
  font-weight: 600; 
  /* Color is now applied via the wrapper div's text color */
}
/* Dark mode adjustments */
.dark :deep(.n-statistic .n-statistic__label) {
   color: #9ca3af; /* gray-400 */
}

/* Minimal styles */
</style>
