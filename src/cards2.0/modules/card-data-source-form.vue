<script setup lang="tsx">
import { reactive, watch } from 'vue';
import { NForm } from 'naive-ui';
import { debounce } from 'lodash';
import { $t } from '@/locales';
import DeviceSelector from '@/cards2.0/modules/device-selector.vue';

defineOptions({ name: 'CardDataSourceForm' });

const props = defineProps<{
  changeCtxConfig: (key: string, data: any) => void;
  defaultSourceData?: Record<string, any>;
  maxSourceNumber: number;
}>();

const sourceData = reactive<{
  dataSource?: string;
  deviceCount?: number;
  systemCount?: number;
  systemSource?: any[];
  deviceSource?: any[];
}>({ ...props.defaultSourceData });
const systemNorm = [
  { label: '设备总数', value: 1 },
  { label: '在线设备数量', value: 2 },
  { label: '离线设备数量', value: 3 }
];
const throttledWatcher = debounce(() => {
  props.changeCtxConfig('source', sourceData);
}, 300);

const selection = v => {
  v.deviceCount = v.deviceSource?.length || 0;
  sourceData.deviceSource = v;
};
const updateSystemSource = v => {
  const arr: any[] = [];
  if (sourceData?.systemSource) {
    sourceData.systemCount = v;
    if (v !== sourceData.systemSource.length) {
      if (v > sourceData.systemSource.length) {
        for (let i = sourceData.systemSource.length; i < v; i += 1) {
          sourceData.systemSource.push({
            name: '',
            type: ''
          });
        }
      } else {
        for (let i = v; i < sourceData.systemSource.length; i += 1) {
          sourceData.systemSource.pop();
        }
      }
    }
  } else {
    for (let i = 0; i < v; i += 1) {
      arr.push({
        name: '',
        type: ''
      });
    }
    sourceData.systemSource = arr;
  }
};

watch(
  () => sourceData,
  () => {
    throttledWatcher();
  },
  { deep: true }
);
</script>

<template>
  <NForm
    :model="sourceData"
    label-placement="left"
    label-align="right"
    require-mark-placement="right-hanging"
    size="small"
  >
    <NFormItem :label="$t('generate.data-source-type')">
      <NRadioGroup v-model:value="sourceData.dataSource" name="radio-group">
        <NSpace>
          <NRadioButton value="system">{{ $t('generate.system') }}</NRadioButton>
          <NRadioButton value="device">{{ $t('generate.device') }}</NRadioButton>
        </NSpace>
      </NRadioGroup>
    </NFormItem>
    <div v-if="sourceData.dataSource && sourceData.dataSource === 'system'">
      <NFormItem label="系统数据个数">
        <NInputNumber
          v-model:value="sourceData.systemCount"
          :min="1"
          :max="maxSourceNumber"
          @update:value="updateSystemSource"
        />
      </NFormItem>
      <template v-for="item in sourceData.systemSource" :key="item">
        <n-grid :cols="3" :x-gap="12" :y-gap="12">
          <n-form-item-gi label="数据名称">
            <NSelect v-model:value="item.type" :options="systemNorm" />
          </n-form-item-gi>
          <n-form-item-gi label="数据名称">
            <NInput v-model:value="item.name" />
          </n-form-item-gi>
        </n-grid>
      </template>
    </div>
    <div v-if="sourceData.dataSource && sourceData.dataSource === 'device'">
      <DeviceSelector
        :max-source-number="maxSourceNumber"
        :device-source="sourceData.deviceSource"
        @update:selection="selection"
      />
    </div>
  </NForm>
</template>

<style scoped></style>
