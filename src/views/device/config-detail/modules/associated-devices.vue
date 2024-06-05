<script setup lang="ts">
import type { Ref } from 'vue';
import { computed, getCurrentInstance, onMounted, ref } from 'vue';
import type { DataTableColumns, FormInst } from 'naive-ui';
import { NButton, NPagination } from 'naive-ui';
import moment from 'moment/moment';
import { deviceConfigBatch, deviceList } from '@/service/api/device';
import { useRouterPush } from '@/hooks/common/router';
import { $t } from '@/locales';

// const message = useMessage();

interface Props {
  deviceConfigId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  deviceConfigId: ''
});
const visible = ref(false);
const associatedFormRef = ref<HTMLElement & FormInst>();
const associatedForm = ref(defaultAssociatedForm());
const deviceOptions = ref([] as any[]);

const queryDevice = ref<{
  page: number;
  page_size: number;
  total: number;
}>({
  page: 1,
  page_size: 20,
  total: 0
});

function initQueryDevice() {
  queryDevice.value = {
    page: 1,
    page_size: 20,
    total: 0
  };
  deviceOptions.value = [];
}

function defaultAssociatedForm() {
  return {
    device_ids: null,
    device_config_id: ''
  };
}

const queryData = ref({
  device_config_id: props.deviceConfigId,
  page: 1,
  page_size: 10
});

const associatedFormRules = ref({
  // device_ids: {
  //   required: true,
  //   message: '请选择设备',
  //   trigger: 'change'
  // },
});

const addDevice = () => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  getDeviceOptions();
  visible.value = true;
};
const modalClose = () => {
  initQueryDevice();
};
const handleSubmit = async () => {
  await associatedFormRef?.value?.validate();
  associatedForm.value.device_config_id = props.deviceConfigId;
  const res = await deviceConfigBatch(associatedForm.value);
  if (!res.error) {
    // message.success('新增成功');
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    handleClose();
  }
};
const handleClose = () => {
  associatedFormRef.value?.restoreValidation();
  associatedForm.value = defaultAssociatedForm();
  visible.value = false;
  queryData.value.page = 1;
  initQueryDevice();
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  getDeviceList();
};
const handleScroll = (e: Event) => {
  const currentTarget = e.currentTarget as HTMLElement;
  if (currentTarget.scrollTop + currentTarget.offsetHeight >= currentTarget.scrollHeight) {
    if (deviceOptions.value.length <= queryDevice.value.total) {
      queryDevice.value.page += 1;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      getDeviceOptions();
    }
  }
};

const getDeviceOptions = async () => {
  const res = await deviceList(queryDevice.value);
  deviceOptions.value = deviceOptions.value.concat(res.data.list);
  // eslint-disable-next-line require-atomic-updates
  queryDevice.value.total = res.data.total;
};
const columnsData: Ref<DataTableColumns<ServiceManagement.Service>> = ref([
  {
    key: 'name',
    minWidth: '140px',
    title: $t('custom.devicePage.deviceName')
  },
  {
    key: 'device_number',
    minWidth: '140px',
    title: $t('page.irrigation.group.deviceCode')
  },
  {
    key: 'activate_flag',
    minWidth: '140px',
    title: $t('custom.devicePage.onlineStatus')
  },
  {
    key: 'ts',
    minWidth: '140px',
    title: $t('custom.devicePage.pushTime'),
    render: row => {
      if (row.ts) {
        return moment(row.ts).format('YYYY-MM-DD hh:mm:ss');
      }
      return '';
    }
  }
]);

const configDevice = ref([]);
const configDeviceTotal = ref(0);
const getDeviceList = async () => {
  queryData.value.device_config_id = props.deviceConfigId;
  const res = await deviceList(queryData.value);
  res.data.list.map(sitem => {
    sitem.activate_flag = sitem.is_online === 0 ? $t('custom.devicePage.offline') : $t('custom.devicePage.online');
    return sitem;
  });
  configDevice.value = res.data.list || [];
  configDeviceTotal.value = res.data.total;
};
const { routerPushByKey } = useRouterPush();
const rowProps = (row: any) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      console.log(row);
      routerPushByKey('device_details', {
        query: {
          d_id: row.id
        }
      });
    }
  };
};
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
onMounted(async () => {
  await getDeviceList();
});
</script>

<template>
  <div class="associated-box">
    <NButton type="primary" @click="addDevice()">{{ $t('generate.+add-device') }}</NButton>
    <n-data-table
      :columns="columnsData"
      :data="configDevice"
      size="small"
      :row-key="item => item.id"
      class="table-class"
      :row-props="rowProps"
    />

    <div class="pagination-box">
      <NPagination
        v-model:page="queryData.page"
        :page-size="queryData.page_size"
        :item-count="configDeviceTotal"
        @update:page="getDeviceList"
      />
    </div>
    <NModal
      v-model:show="visible"
      :mask-closable="false"
      :title="$t('generate.add-device')"
      :class="getPlatform ? 'w-90%' : 'w-600px'"
      preset="card"
      @after-leave="modalClose"
    >
      <NForm
        ref="associatedFormRef"
        :model="associatedForm"
        :rules="associatedFormRules"
        label-placement="left"
        label-width="auto"
      >
        <NFormItem :label="$t('page.irrigation.rotation.chooseDevice')" path="device_ids">
          <NSelect
            v-model:value="associatedForm.device_ids"
            :options="deviceOptions"
            label-field="name"
            value-field="id"
            filterable
            multiple
            @scroll="handleScroll"
          ></NSelect>
        </NFormItem>
        <NFlex justify="flex-end">
          <NButton @click="handleClose">{{ $t('generate.cancel') }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ $t('generate.add') }}</NButton>
        </NFlex>
      </NForm>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.associated-box {
  height: 100%;
}

.pagination-box {
  display: flex;
  justify-content: flex-end;
}

.table-class {
  margin: 10px;
  height: 50%;
}
</style>
