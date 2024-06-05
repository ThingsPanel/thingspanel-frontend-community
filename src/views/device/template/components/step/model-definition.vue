<script setup lang="tsx">
import { computed, reactive, ref } from 'vue';
import type { PaginationProps } from 'naive-ui';
import { NButton, NPopconfirm, NSpace } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import {
  attributesApi,
  commandsApi,
  delAttributes,
  delCommands,
  delEvents,
  delTelemetry,
  eventsApi,
  telemetryApi
} from '@/service/api/system-data';
import { attribute, command, events, test } from './tableList';
import AddEditTest from './add-edit-test.vue';
import AddEditAttributes from './add-edit-attributes.vue';
import AddEditEvents from './add-edit-events.vue';
import AddEditCommands from './add-edit-commands.vue';
import CustomCommands from './custom-commands.vue';
const emit = defineEmits(['update:stepCurrent', 'update:modalVisible']);
const { loading, startLoading, endLoading } = useLoading(false);

const props = defineProps({
  stepCurrent: {
    type: Number,
    required: true
  },
  modalVisible: {
    type: Boolean,
    required: true
  },
  deviceTemplateId: {
    type: String,
    required: true
  }
});

const deviceTemplateId = ref<string>(props.deviceTemplateId);
const tabsCurrent: any = ref('telemetry');
const addAndEditModalVisible = ref<boolean>(false);
const addAndEditTitle = ref<string>($t('device_template.addAndEditTelemetry'));

const comList: { id: string; components: any; title: string }[] = [
  { id: 'telemetry', components: AddEditTest, title: $t('device_template.addAndEditTelemetry') },
  { id: 'attributes', components: AddEditAttributes, title: $t('device_template.addAndEditAttributes') },
  { id: 'events', components: AddEditEvents, title: $t('device_template.addAndEditEvents') },
  { id: 'command', components: AddEditCommands, title: $t('device_template.addAndEditCommand') }
];
const SwitchCom = computed<any>(() => {
  // eslint-disable-next-line array-callback-return,consistent-return
  return comList.find(item => {
    if (item.id === tabsCurrent.value) {
      const objItem: any = item;
      addAndEditTitle.value = objItem.title;
      return objItem;
    }
  })?.components;
});

const queryParams: any = reactive([
  {
    page: 1,
    page_size: 5,
    device_template_id: props.deviceTemplateId
  },
  {
    page: 1,
    page_size: 5,
    device_template_id: props.deviceTemplateId
  },
  {
    page: 1,
    page_size: 5,
    device_template_id: props.deviceTemplateId
  },
  {
    page: 1,
    page_size: 5,
    device_template_id: props.deviceTemplateId
  }
]);

const checkedTabs: (value: string | number) => void = value => {
  tabsCurrent.value = value;
  console.log(value, '切换标签了');
};

// 分页参数
const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 1,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page;
    queryParams.page = page;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getTableData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    queryParams.page = 1;
    queryParams.page_size = pageSize;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getTableData();
  }
});

// 编辑
let objItem = reactive<any>({});
const edit: (row: any) => void = row => {
  addAndEditModalVisible.value = true;
  objItem = row;
  console.log(row, '点击了编辑');
};

// 新增或者编辑成功后的回调函数
const determine: () => void = () => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  getTableData(tabsCurrent.value);
};

// 删除
const del: (id: string) => void = async id => {
  if (tabsCurrent.value === 'telemetry') {
    await delTelemetry(id);
  } else if (tabsCurrent.value === 'attributes') {
    await delAttributes(id);
  } else if (tabsCurrent.value === 'events') {
    await delEvents(id);
  } else {
    await delCommands(id);
  }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  getTableData(tabsCurrent.value);
};
// 上一步
const next: () => void = async () => {
  emit('update:stepCurrent', 3);
};
// 下一步
const back: () => void = async () => {
  emit('update:stepCurrent', 1);
};
// 取消
const cancellation: () => void = () => {
  emit('update:modalVisible', false);
};
const cloneaddAndEditVisible: () => void = () => {
  objItem = {};
};
const columnsList: any = reactive([
  {
    addBtn: () => {
      addAndEditModalVisible.value = true;
    },
    total: 0,
    data: [{ data_name: $t('common.test') }],
    name: 'telemetry',
    text: $t('device_template.telemetry'),
    col: [
      ...test.value,
      {
        key: 'actions',
        width: 350,
        title: () => $t('common.action'),
        align: 'center',
        render: row => {
          return (
            <NSpace justify={'center'}>
              <NButton quaternary type="primary" size={'small'} onClick={() => edit(row)}>
                {$t('common.edit')}
              </NButton>
              <NPopconfirm onPositiveClick={() => del(row.id)}>
                {{
                  default: () => $t('common.confirmDelete'),
                  trigger: () => (
                    <NButton quaternary type="primary" size={'small'}>
                      {$t('common.delete')}
                    </NButton>
                  )
                }}
              </NPopconfirm>
            </NSpace>
          );
        }
      }
    ]
  },
  {
    addBtn: () => {
      addAndEditModalVisible.value = true;
    },
    total: 0,
    data: [],
    name: 'attributes',
    text: $t('device_template.attributes'),
    col: [
      ...attribute.value,
      {
        key: 'actions',
        width: 350,
        title: () => $t('common.action'),
        align: 'center',
        render: row => {
          return (
            <NSpace justify={'center'}>
              <NButton quaternary type="primary" size={'small'} onClick={() => edit(row)}>
                {$t('common.edit')}
              </NButton>
              <NPopconfirm onPositiveClick={() => del(row.id)}>
                {{
                  default: () => $t('common.confirmDelete'),
                  trigger: () => (
                    <NButton quaternary type="primary" size={'small'}>
                      {$t('common.delete')}
                    </NButton>
                  )
                }}
              </NPopconfirm>
            </NSpace>
          );
        }
      }
    ]
  },
  {
    addBtn: () => {
      addAndEditModalVisible.value = true;
    },
    total: 0,
    data: [],
    name: 'events',
    text: $t('device_template.events'),
    col: [
      ...events.value,
      {
        key: 'actions',
        width: 350,
        title: () => $t('common.action'),
        align: 'center',
        render: row => {
          return (
            <NSpace justify={'center'}>
              <NButton quaternary type="primary" size={'small'} onClick={() => edit(row)}>
                {$t('common.edit')}
              </NButton>
              <NPopconfirm onPositiveClick={() => del(row.id)}>
                {{
                  default: () => $t('common.confirmDelete'),
                  trigger: () => (
                    <NButton quaternary type="primary" size={'small'}>
                      {$t('common.delete')}
                    </NButton>
                  )
                }}
              </NPopconfirm>
            </NSpace>
          );
        }
      }
    ]
  },
  {
    addBtn: () => {
      addAndEditModalVisible.value = true;
    },
    total: 0,
    data: [],
    name: 'command',
    text: $t('device_template.command'),
    col: [
      ...command.value,
      {
        key: 'actions',
        width: 350,
        title: () => $t('common.action'),
        align: 'center',
        render: row => {
          return (
            <NSpace justify={'center'}>
              {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
              <NButton quaternary type="primary" size={'small'} onClick={() => edit(row)}>
                {$t('common.edit')}
              </NButton>
              {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
              <NPopconfirm onPositiveClick={() => del(row.id)}>
                {{
                  default: () => $t('common.confirmDelete'),
                  trigger: () => (
                    <NButton quaternary type="primary" size={'small'}>
                      {$t('common.delete')}
                    </NButton>
                  )
                }}
              </NPopconfirm>
            </NSpace>
          );
        }
      }
    ]
  }
]);

const getTableData: (value?: string) => void = async value => {
  startLoading();
  console.log(value);
  if (value) {
    if (value === 'telemetry') {
      const { data: data0 }: any = await telemetryApi(queryParams[0]);
      columnsList[0].data = data0?.list ?? [];
      columnsList[0].total = Math.ceil(data0?.total / 5);
    } else if (value === 'attributes') {
      const { data: data1 }: any = await attributesApi(queryParams[1]);
      columnsList[1].data = data1?.list ?? [];
      columnsList[1].total = Math.ceil(data1?.total / 5);
    } else if (value === 'events') {
      const { data: data2 }: any = await eventsApi(queryParams[2]);
      columnsList[2].data = data2?.list ?? [];
      columnsList[2].total = Math.ceil(data2?.total / 5);
    } else {
      const { data: data3 }: any = await commandsApi(queryParams[3]);
      columnsList[3].data = data3?.list ?? [];
      columnsList[3].total = Math.ceil(data3?.total / 5);
    }
    endLoading();
  } else {
    const { data: data0 }: any = await telemetryApi(queryParams[0]);
    columnsList[0].data = data0?.list ?? [];
    columnsList[0].total = Math.ceil(data0?.total / 5);
    const { data: data1 }: any = await attributesApi(queryParams[1]);
    columnsList[1].data = data1?.list ?? [];
    columnsList[1].total = Math.ceil(data1?.total / 5);
    const { data: data2 }: any = await eventsApi(queryParams[2]);
    columnsList[2].data = data2?.list ?? [];
    columnsList[2].total = Math.ceil(data2?.total / 5);
    const { data: data3 }: any = await commandsApi(queryParams[3]);
    columnsList[3].data = data3?.list ?? [];
    columnsList[3].total = Math.ceil(data3?.total / 5);
    console.log(data0, data1, data2, data3, '请求到了遥远的数据');
    endLoading();
  }
};
getTableData();
</script>

<template>
  <div>
    <n-tabs type="line" animated @update:value="checkedTabs">
      <n-tab-pane v-for="(item, index) in columnsList" :key="item.name" :name="item.name" :tab="item.text">
        <NButton type="primary" class="addBtn" @click="item.addBtn">
          <template #icon>
            <SvgIcon local-icon="add" class="more" />
          </template>
          {{ $t('device_template.add') }}
        </NButton>
        <n-data-table :columns="item.col" :data="item.data" :loading="loading" class="m-t9 flex-1-hidden" />

        <div class="mt-4 w-full flex justify-end">
          <n-pagination
            :page-count="item.total"
            :page-size="5"
            @update:page="
              page => {
                queryParams[index].page = page;
                getTableData(item.name);
              }
            "
          />
        </div>
        <CustomCommands v-if="item.name === 'command'" :id="deviceTemplateId"></CustomCommands>
      </n-tab-pane>
    </n-tabs>
  </div>
  <div class="box1 m-t2">
    <NButton type="primary" @click="next">{{ $t('device_template.nextStep') }}</NButton>
    <NButton class="m-r3" ghost type="primary" @click="back">{{ $t('device_template.back') }}</NButton>
    <NButton class="m-r3" @click="cancellation">{{ $t('device_template.cancellation') }}</NButton>
  </div>
  <NModal
    v-model:show="addAndEditModalVisible"
    preset="card"
    :title="addAndEditTitle"
    class="w-50%"
    @after-leave="cloneaddAndEditVisible"
  >
    <component
      :is="SwitchCom"
      v-model:addAndEditModalVisible="addAndEditModalVisible"
      v-model:deviceTemplateId="deviceTemplateId"
      v-model:objItem="objItem"
      @determine="determine"
    ></component>
  </NModal>
</template>

<style lang="scss" scoped>
.addBtn {
  position: absolute;
  right: 0;
  top: 0.5rem;
}

.box1 {
  display: flex;
  flex-direction: row-reverse;
}
</style>
