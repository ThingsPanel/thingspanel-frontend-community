<!--
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-17 16:22:54
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-24 16:04:26
-->
<script setup lang="tsx">
import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NCard, NFlex, NInput } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import dayjs from 'dayjs';
import moment from 'moment';
import { alarmHistory } from '@/service/api/alarm';
import { $t } from '@/locales';
import { deviceAlarmHistoryPut } from '@/service/api';

const loading = ref(false);
const rowKey = (row: DeviceManagement.DeviceData) => row.id;

interface ColumnsData {
  id: string;
  time: string;
  name: string;
  description: string;
  alarm_level: string;
  notification_group_id: string;
  enabled: string;
  result: string;
  handler: string;
}

const columns: Ref<DataTableColumns<ColumnsData>> = ref([
  // {
  //   type: 'selection',
  //   disabled(row: any) {
  //     return row.name === 'Edward King 3';
  //   }
  // },
  {
    key: 'alarm_time',
    title: $t('common.alarm_time'),
    align: 'center',
    width: '170px',
    render(row: { id: string; name: string; description: string; created_at: string; [key: string]: any }) {
      return dayjs(row.create_at).format('YYYY-MM-DD HH:mm:ss');
    }
  },
  {
    key: 'name',
    title: $t('generate.alarm-name'),
    align: 'center',
    minWidth: '100px',
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'alarm_level',
    title: $t('generate.alarm-status'),
    align: 'center',
    width: '120px',
    render(row: any) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return alarmStatusOptions.value.find(data => data.value === row.alarm_status)?.label || '';
    }
  },
  {
    key: 'content',
    title: $t('generate.alarm-content'),
    align: 'center',
    minWidth: '100px',
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'description',
    title: $t('generate.alarm-description'),
    align: 'center',
    minWidth: '80px',
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'actions',
    title: $t('common.action'),
    width: '200px',
    align: 'center',
    render: row => {
      return (
        <div class="flex gap-20px">
          <NButton type="primary" size={'small'} onClick={() => getInfo(row)}>
            {$t('custom.devicePage.details')}
          </NButton>
          {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
          <NButton type="warning" size={'small'} onClick={() => maintenance(row)}>
            {$t('common.maintenance')}
          </NButton>
        </div>
      );
    }
  }
]) as Ref<DataTableColumns<ColumnsData>>;

const range = ref<[number, number]>([moment().subtract(1, 'months').valueOf(), moment().valueOf()]);

const queryData = ref({
  alarm_status: '',
  start_time: '',
  end_time: '',
  page: 1,
  page_size: 10
});
const tableData = ref<ColumnsData[]>([]);
const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getAlarmHistory();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getAlarmHistory();
  }
});
const getAlarmHistory = async () => {
  queryData.value.page = pagination.page as number;
  queryData.value.page_size = pagination.pageSize as number;
  const { data } = await alarmHistory(queryData.value);
  if (data) {
    // eslint-disable-next-line require-atomic-updates
    pagination.itemCount = data.total;
    tableData.value = data.list;
    loading.value = false;
  }
};
const resetQuery = () => {
  pagination.page = 1;
  getAlarmHistory();
};
function pickerChange() {
  if (range.value && range.value.length > 0) {
    queryData.value.start_time = moment(range.value[0]).format('YYYY-MM-DDTHH:mm:ssZ');
    queryData.value.end_time = moment(range.value[1]).format('YYYY-MM-DDTHH:mm:ssZ');
  } else {
    queryData.value.start_time = '';
    queryData.value.end_time = '';
  }
  resetQuery();
}

onMounted(() => {
  getAlarmHistory();
});

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});

const alarmStatusOptions = ref([
  {
    label: $t('common.allStatus'),
    value: ''
  },
  {
    label: $t('common.highAlarm'),
    value: 'H'
  },
  {
    label: $t('common.intermediateAlarm'),
    value: 'M'
  },
  {
    label: $t('common.lowAlarm'),
    value: 'L'
  },
  {
    label: $t('common.normal'),
    value: 'N'
  }
]);
const showDialog = ref(false);
const infoData = ref({} as any);
function getInfo(data: any) {
  infoData.value = data;
  showDialog.value = true;
}
const closeModal = () => {
  showDialog.value = false;
};
const showModal = ref(false);
const description = ref('');
const maintenance = row => {
  infoData.value = row;
  description.value = row.description;
  showModal.value = true;
};
const cancelCallback = () => {
  description.value = '';
  showModal.value = false;
};
const submitCallback = async () => {
  if (description.value === '') {
    window.$message?.error($t('common.enterAlarmDesc'));
    return;
  }
  const putData = {
    id: infoData.value.id,
    description: description.value
  };
  await deviceAlarmHistoryPut(putData);
  cancelCallback();
  await getAlarmHistory();
};
</script>

<template>
  <div class="h-full flex-col">
    <NForm ref="queryFormRef" :inline="!getPlatform" label-placement="left" :model="queryData">
      <NFormItem path="status">
        <n-date-picker
          v-model:value="range"
          type="datetimerange"
          :clearable="false"
          separator="-"
          @update:value="pickerChange"
        />
      </NFormItem>
      <NFormItem :label="$t('generate.alarm-level')" path="status">
        <NSelect
          v-model:value="queryData.alarm_status"
          :clearable="false"
          class="w-200px"
          :options="alarmStatusOptions"
          @update:value="resetQuery"
        />
      </NFormItem>
    </NForm>
    <n-data-table
      remote
      :loading="loading"
      :columns="columns"
      :data="tableData"
      :pagination="pagination"
      :row-key="rowKey"
      class="w-100% flex-1-hidden"
    />
    <!--    <div class="flex gap-20px">-->
    <!--      <NButton @click="handleBatch">{{ $t('generate.batch-process') }}</NButton>-->
    <!--      <NButton @click="handleIgnore">{{ $t('generate.batch-ignore') }}</NButton>-->
    <!--    </div>-->
    <n-modal v-model:show="showDialog" :title="$t('generate.alarm-info')" class="max-w-[800px]">
      <NCard>
        <div>
          <NH3>{{ $t('generate.alarm-info') }}</NH3>
        </div>
        <n-form-item label-placement="left" :show-feedback="false" :label="$t('generate.alarmConfugName') + ':'">
          {{ infoData.name }}
        </n-form-item>
        <n-form-item label-placement="left" :show-feedback="false" :label="$t('generate.sceneLinkageName') + ':'">
          {{ infoData['alarm_config_name'] }}
        </n-form-item>
        <n-form-item label-placement="left" :show-feedback="false" :label="$t('common.alarm_time') + ':'">
          {{ moment(infoData['create_at']).format('YYYY-MM-DD HH:mm:ss') }}
        </n-form-item>
        <n-form-item label-placement="left" :show-feedback="false" :label="$t('generate.alarm-status') + ':'">
          {{ alarmStatusOptions.find(data => data.value === infoData['alarm_status'])?.label || '' }}
        </n-form-item>
        <n-form-item label-placement="left" :show-feedback="false" :label="$t('generate.alarmReason') + ':'">
          {{ infoData.content }}
        </n-form-item>
        <n-form-item label-placement="left" :show-feedback="false" :label="$t('generate.alarm-description') + ':'">
          {{ infoData.description }}
        </n-form-item>
        <n-form-item label-placement="top" :show-feedback="false" :label="$t('generate.alarmDevices') + ':'">
          <NTable size="small" :bordered="false" :single-line="false" class="mb-6">
            <thead>
              <tr>
                <th>{{ $t('common.index') }}</th>
                <th class="min-w-180px">{{ $t('generate.device-code') }}</th>
                <th>{{ $t('custom.devicePage.deviceName') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(device, index) in infoData.alarm_device_list" :key="index">
                <td class="min-w-100px">{{ index + 1 }}</td>
                <td>{{ device.id }}</td>
                <td>{{ device['name'] }}</td>
              </tr>
            </tbody>
          </NTable>
        </n-form-item>
        <NFlex justify="flex-end">
          <NButton @click="closeModal">{{ $t('custom.devicePage.close') }}</NButton>
        </NFlex>
      </NCard>
    </n-modal>
    <n-modal v-model:show="showModal" class="max-w-[600px]">
      <NCard>
        <n-form-item :show-feedback="false" :label="$t('generate.alarm-description')">
          <NInput v-model:value="description" type="textarea" />
        </n-form-item>
        <NFlex justify="flex-end" class="mt-4">
          <NButton @click="cancelCallback">{{ $t('generate.cancel') }}</NButton>
          <NButton @click="submitCallback">{{ $t('common.save') }}</NButton>
        </NFlex>
      </NCard>
    </n-modal>
  </div>
</template>

<style scoped lang="scss">
.pop-up {
  display: flex;
}

.pop-up-content {
  height: 200px;
  padding: 10px;
  border: 1px solid rgb(215, 213, 213);
  border-radius: 10px;
}
</style>
