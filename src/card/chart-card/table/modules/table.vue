<script setup lang="tsx">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { NDataTable } from 'naive-ui';
import moment from 'moment';
import type { ICardData } from '@/components/panel/card';
import { telemetryDataHistoryList } from '@/service/api/device';

// 定义组件props
const props = defineProps<{
  card: ICardData;
}>();

// 初始化变量
const pagination = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 1000,
  showSizePicker: true,
  pageSizes: [10, 15, 20]
});

const allTableData = ref<any[]>([]);
const paginatedData = computed(() => {
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  return allTableData.value.slice(startIndex, endIndex);
});

const handlePageChange = (page: number) => {
  pagination.page = page;
};

const handlePageSizeChange = (pageSize: number) => {
  pagination.pageSize = pageSize;
  pagination.page = 1; // 重置到第一页
};

// 动态生成表格列
const columns = ref<any[]>([
  {
    title: '时间',
    key: 'time',
    render(row) {
      return moment(row.time).format('YYYY-MM-DD HH:mm:ss');
    }
  },
  ...(props.card?.dataSource?.deviceSource
    ?.filter(deviceSource => {
      return deviceSource.deviceId && deviceSource.metricsId;
    })
    .map(source => ({
      title: source.metricsName,
      key: source.metricsId,
      render(row) {
        return row[source.metricsId!] ?? '';
      }
    })) ?? [])
]);

// 数据处理函数：合并相同时间的数据
const processData = data => {
  const timeMap = new Map();
  data.forEach(({ x, y, key }) => {
    if (!timeMap.has(x)) {
      timeMap.set(x, { time: x });
    }
    timeMap.get(x)[key] = y;
  });
  return Array.from(timeMap.values());
};

// 数据获取函数
const fetchData = async () => {
  const deviceSources = (props.card?.dataSource?.deviceSource ?? []).filter(deviceSource => {
    return deviceSource.deviceId && deviceSource.metricsId;
  });
  // const endTimeValue = new Date().getTime();
  console.log(`dataTimeRange:${props.card?.dataSource?.dataTimeRange}`);
  // const startTimeValue = endTimeValue - (props.card?.dataSource?.dataTimeRange ?? 3600000);
  const promises = deviceSources.map(source => {
    const params = {
      device_id: source.deviceId,
      key: source.metricsId,
      aggregate_window: props.card?.dataSource?.dataAggregateRange || 'no_aggregate',
      aggregate_function: source.aggregate_function,
      time_range: props.card?.dataSource?.dataTimeRange || 'last_1h'
    };
    return telemetryDataHistoryList(params).then(res =>
      res.data.map(item => ({
        ...item,
        key: source.metricsId
      }))
    );
  });

  try {
    const results = await Promise.all(promises);
    const combinedData = results.flat();
    allTableData.value = processData(combinedData);
    pagination.itemCount = allTableData.value.length;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

watch(
  () => props.card,
  () => {
    columns.value = [
      {
        title: '时间',
        key: 'time',
        render(row) {
          return moment(row.time).format('YYYY-MM-DD HH:mm:ss');
        }
      },
      ...(props.card?.dataSource?.deviceSource?.map(source => ({
        title: source.metricsName,
        key: source.metricsId,
        render(row) {
          return row[source.metricsId!] ?? '';
        }
      })) ?? [])
    ];
  },
  { deep: true }
);

watch(
  () => props.card,
  () => {
    fetchData();
  },
  { deep: true }
);

// 初始加载数据
onMounted(fetchData);
</script>

<template>
  <NDataTable
    :columns="columns"
    :data="paginatedData"
    :pagination="pagination"
    :bordered="false"
    remote
    @update:page="handlePageChange"
    @update:page-size="handlePageSizeChange"
  />
</template>

<style scoped>
:deep(.n-data-table-wrapper) {
  overflow: auto !important;
}
</style>
