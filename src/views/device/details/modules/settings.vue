<script setup lang="tsx">
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { TransferRenderSourceList } from 'naive-ui';
import { NTree } from 'naive-ui';
import {
  deleteDeviceGroupRelation,
  deviceDetail,
  deviceGroupRelation,
  deviceGroupTree,
  deviceLocation,
  deviceUpdateConfig,
  getDeviceConfigList,
  getDeviceGroupRelation
} from '@/service/api';
import { useDeviceDataStore } from '@/store/modules/device';
import { $t } from '@/locales';

const props = defineProps<{
  id: string;
  online: string;
}>();
const valueRef = ref<Array<string | number>>([]);
const device_coding = ref<string>('');
const emit = defineEmits(['change']);
const is_online = ref<string>('');
const treeData = ref();
type Option = {
  label: string;
  value: string;
  children?: Option[];
};
const options = ref<Option[]>();
const sOptions = ref<any[]>([{ label: $t('generate.unbind'), value: '' }]);
const { query } = useRoute();
const deviceConfigList = async name => {
  const { data, error } = await getDeviceConfigList({ page: 1, page_size: 99, name });
  if (!error && data) {
    const tempSOptions = data?.list?.map(item => {
      return { label: item.name, value: item.id };
    });
    sOptions.value = sOptions.value.concat(tempSOptions);
  }
};

function transformDataToOptions(data) {
  // 定义转换函数
  const transform = item => {
    // 基本转换
    const option = {
      label: item.group.name,
      value: item.group.id,
      children: undefined
    };

    // 如果存在子项，则递归转换
    if (item.children && item.children.length > 0) {
      option.children = item.children.map(transform);
    }

    return option;
  };

  // 对输入的数据应用转换函数
  return data.map(transform);
}

const getTreeData = async () => {
  const { data, error } = await deviceGroupTree({});
  if (!error && data) {
    console.log(data);
    treeData.value = transformDataToOptions(data);
    options.value = flattenTree(treeData.value);
  }
};
const getTreeRelationData = async () => {
  console.log(props.id);
  const { data, error } = await getDeviceGroupRelation({ device_id: props.id });
  if (!error && data) {
    valueRef.value = data?.map(item => item.group_id);
    console.log(data);
  }
};
const deviceDataStore = useDeviceDataStore();
const selectedValues = ref('');

function flattenTree(list: undefined | Option[]): Option[] {
  const result: Option[] = [];

  function flatten(_list: Option[] = []) {
    _list.forEach(item => {
      result.push(item);
      flatten(item.children);
    });
  }

  flatten(list);
  return result;
}

const handleUpdateValue = async () => {
  const { error }: any = await deviceLocation({
    id: props.id,
    is_online: Number(is_online.value)
  });
  !error && emit('change');
};
const renderSourceList: TransferRenderSourceList = ({ pattern }) => {
  return (
    <NTree
      data={treeData.value}
      style="margin: 0 4px;"
      checkedKeys={valueRef.value}
      keyField="value"
      defaultExpandAll
      checkable
      checkOnClick
      blockLine
      selectable={false}
      onUpdateCheckedKeys={(keys, _option, meta) => {
        valueRef.value = keys;
        if (meta.node) {
          if (meta.action === 'check') {
            deviceGroupRelation({ group_id: meta.node.value, device_id_list: [props.id] });
          } else {
            deleteDeviceGroupRelation({ group_id: meta.node.value, device_id: props.id });
          }
        }
        //
      }}
      pattern={pattern}
    />
  );
};
watch(
  () => valueRef.value,
  (value, oldValue) => {
    if (oldValue.length > value.length) {
      const difference = oldValue.filter(x => !value.includes(x));
      difference.forEach(item => {
        deleteDeviceGroupRelation({ group_id: item, device_id: props.id });
      });
    }
  }
);

const initData = async () => {
  const result = await deviceDetail(query.d_id as string);
  selectedValues.value = result?.data?.device_config_id || '';
  getTreeData();
  getTreeRelationData();
};

onMounted(() => {
  is_online.value = String(props.online);
  initData();
  deviceConfigList('');
});

const selectConfig = v => {
  selectedValues.value = v;
  deviceUpdateConfig({ device_id: props.id, device_config_id: v });
  deviceDataStore.fetchData(props.id);
  initData();
};
</script>

<template>
  <div class="flex-col gap-16px p-t-10px">
    <div class="flex items-center">
      <div>{{ $t('generate.device-configuration') }}</div>
      <NSelect
        v-model:value="selectedValues"
        filterable
        class="w-200px"
        :options="sOptions"
        @update:value="selectConfig"
        @search="deviceConfigList"
      />
    </div>
    <div class="flex items-center">
      <span>{{ $t('generate.deviceCode') }}</span>
      <span>{{ device_coding }}</span>
      <NButton type="primary" text class="ml-4">{{ $t('generate.view') }}</NButton>
    </div>

    <div class="flex-col gap-10px">
      <div class="flex items-center">
        <span class="m-r-5px">{{ $t('generate.manualOnlineStatusEdit') }}</span>
        <n-popover trigger="hover" placement="right">
          <template #trigger>
            <span class="h-17px w-20px">
              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512">
                <path fill="none" d="M240 304h32l6-160h-44l6 160z"></path>
                <path
                  d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208s208-93.31 208-208S370.69 48 256 48zm20 319.91h-40v-40h40zM272 304h-32l-6-160h44z"
                  fill="currentColor"
                ></path>
              </svg>
            </span>
          </template>
          <span>{{ $t('generate.heartbeatFunctionInfo') }}</span>
        </n-popover>
      </div>
      <div class="flex items-center gap-10px">
        <n-switch v-model:value="is_online" checked-value="1" unchecked-value="0" @update:value="handleUpdateValue" />
        <span>{{ is_online === '1' ? $t('custom.device_details.online') : $t('custom.device_details.offline') }}</span>
      </div>
    </div>
    <div class="flex items-center">
      {{ $t('generate.device-firmware') }}
      <span class="ml-4">{{ deviceDataStore?.deviceData?.current_version || '--' }}</span>
    </div>

    <div class="flex-1">
      <div class="mb-4">{{ $t('generate.device-group') }}</div>
      <n-transfer
        v-model:value="valueRef"
        :options="options"
        :render-source-list="renderSourceList"
        source-filterable
      />
    </div>
  </div>
</template>

<style scoped></style>
