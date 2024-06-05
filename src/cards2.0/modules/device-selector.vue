<script setup lang="tsx">
import { computed, defineEmits, reactive, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { NButton, NForm, NFormItem, NFormItemGi, NInputNumber, NSpace } from 'naive-ui';
import { debounce } from 'lodash-es';
import { $t } from '@/locales';
import { deviceListForPanel, deviceMetricsList } from '@/service/api';
defineOptions({ name: 'DeviceSelector' });
const emits = defineEmits(['update:selection']);
const props = defineProps<{ maxSourceNumber: number; deviceSource?: any[] }>();

const formRef = ref();
const sourceCount = ref(1);
const selections = reactive<any[][]>([[{ ...props.deviceSource }]]);
const pageSize = 5;
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(sourceCount.value / pageSize));
const currentBatchDevices = computed(() => {
  return selections[currentPage.value - 1] || [];
});

const adjustDeviceCount = (value: number | null) => {
  console.log('value', value);
  if (!value) return;
  const totalBatches = Math.ceil(value / pageSize);

  // Add or remove batches as needed
  while (selections.length < totalBatches) {
    selections.push([]);
  }

  const obj = {
    deviceId: '',
    metricsId: '',
    metricsShow: false,
    metricsOptions: [],
    metricsName: ''
  };

  selections.forEach((batch, i) => {
    const batchStart = i * pageSize;
    const batchEnd = Math.min(batchStart + pageSize, value);

    if (batchStart >= batchEnd) {
      batch.length = 0; // Clear batch if no items in this range
    } else if (batch.length > batchEnd - batchStart) {
      batch.length = batchEnd - batchStart; // Reduce batch size if necessary
    } else {
      while (batch.length < batchEnd - batchStart) {
        batch.push({ ...obj });
      }
    }
  });

  // Adjust selections length to totalBatches
  if (selections.length > totalBatches) {
    selections.length = totalBatches;
  }

  // If props.deviceSource exists, split it into batches and assign to selections
  if (props.deviceSource && props.deviceSource.length > 0) {
    const truncatedSource = props.deviceSource.slice(0, value);
    const newSelections: typeof selections = [];
    for (let i = 0; i < totalBatches; i += 1) {
      const batchStart = i * pageSize;
      const batchEnd = Math.min(batchStart + pageSize, value);
      const sourceBatchStart = i * pageSize;
      const sourceBatchEnd = Math.min(sourceBatchStart + pageSize, truncatedSource.length);
      const sourceBatch = truncatedSource.slice(sourceBatchStart, sourceBatchEnd).map(item => ({
        deviceId: item.deviceId || '',
        metricsId: item.metricsId || '',
        metricsShow: false,
        metricsOptions: item.metricsOptions || [],
        metricsName: item.metricsName || ''
      }));

      // Fill the rest of the batch with empty objects if truncatedSource is exhausted
      while (sourceBatch.length < batchEnd - batchStart) {
        sourceBatch.push({ ...obj });
      }

      newSelections.push(sourceBatch);
    }
    selections.splice(0, selections.length, ...newSelections);
  }
};
const deviceOption = ref<SelectOption[]>();
const getDeviceList = async () => {
  const res = await deviceListForPanel({});
  deviceOption.value = res.data || [];
};
const deviceSelectChange = async (v, item) => {
  console.log(v);
  const res = await deviceMetricsList(v);
  console.log(res.data);
  item.metricsOptions = res?.data || [];
};
const updateDropdownShow = (show: boolean, item) => {
  item.metricsShow = show;
};
const metricsOptionRender = (info, item) => {
  return (
    <n-card
      class="border-b border-#d9d9d9"
      title={<span style="font-size: 16px;color:#999">{info?.option?.data_source_type}</span>}
      bordered={false}
    >
      {info?.option?.options?.map(it => {
        return (
          <div
            onClick={() => {
              console.log(it);
              item.metricsId = it.key;
              item.metricsName = it.label || '';

              updateDropdownShow(false, item);
            }}
          >
            <span class={it.key === item.metricsId ? 'mr-6 color-primary-700' : 'mr-2 color-#333'}>
              {it.key}({it.label || '--'})
            </span>
            <span class="text-#999">{it.data_type} </span>
          </div>
        );
      })}
    </n-card>
  );
};

const isCurrentPageComplete = () => {
  const batchDevices = currentBatchDevices.value;

  return batchDevices.every(device => {
    return !Object.values(device).includes('');
  });
};
const nextPage = () => {
  if (currentPage.value < totalPages.value && isCurrentPageComplete()) {
    currentPage.value += 1;
  }
};
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1;
  }
};

const getSwlection = debounce(() => {
  const flatDevices = selections.flat().slice(0, sourceCount.value);
  console.log(flatDevices);
  emits(
    'update:selection',
    flatDevices.filter(i => !Object.values(i).includes(''))
  );
}, 300);

watch(selections, () => {
  getSwlection();
});

getDeviceList();
if (props.deviceSource && props.deviceSource.length > 0) {
  console.log(props.deviceSource.length);
  sourceCount.value = props.deviceSource.length;
  adjustDeviceCount(props.deviceSource.length);
} else {
  adjustDeviceCount(1);
}
</script>

<template>
  <NForm ref="formRef" label-placement="left" label-align="right" require-mark-placement="right-hanging" size="small">
    <NFormItem label="设备数量">
      <NInputNumber v-model:value="sourceCount" :max="maxSourceNumber" :min="1" @update:value="adjustDeviceCount" />
    </NFormItem>
    <n-grid :cols="3" x-gap="18">
      <template v-for="(selection, index) in currentBatchDevices" :key="index">
        <NFormItemGi label="设备">
          <NSelect
            v-if="index <= sourceCount - 1"
            v-model:value="selection.deviceId"
            class="w-120px"
            :options="deviceOption"
            label-field="name"
            value-field="id"
            @update:value="value => deviceSelectChange(value, selection)"
          >
            <template #header>{{ $t('generate.device') }}</template>
          </NSelect>
        </NFormItemGi>
        <NFormItemGi label="指标">
          <NSelect
            v-if="index <= sourceCount - 1"
            v-model:value="selection.metricsId"
            class="w-225px"
            :show="selection.metricsShow"
            :options="selection?.metricsOptions"
            :render-option="info => metricsOptionRender(info, selection)"
            @update:show="show => updateDropdownShow(show, selection)"
          ></NSelect>
        </NFormItemGi>
        <NFormItemGi label="数据名称">
          <NInput v-if="index <= sourceCount - 1" v-model:value="selection.metricsName" style="max-width: 140px" />
        </NFormItemGi>
      </template>
    </n-grid>
    <NSpace v-if="totalPages > 1" justify="space-between">
      <NButton :disabled="currentPage === 1" @click="previousPage">上一页</NButton>
      <NButton :disabled="!isCurrentPageComplete() || currentPage === totalPages" @click="nextPage">下一页</NButton>
    </NSpace>
  </NForm>
</template>

<style scoped></style>
