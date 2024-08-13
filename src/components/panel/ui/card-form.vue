<script lang="tsx" setup>
import { onMounted, onUpdated, reactive, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { usePanelStore } from '@/store/modules/panel';
import ConfigCtx from '@/components/panel/ui/config-ctx.vue';
import type { ICardData, ICardDefine } from '@/components/panel/card';
import { deviceListForPanel, deviceMetricsList } from '@/service/api';
import { $t } from '@/locales';

const copy = (obj: object) => JSON.parse(JSON.stringify(obj));

const props = defineProps<{
  mobile?: boolean;
  deviceWebChartConfig: any;
}>();
const store = usePanelStore();
const defData = {
  cardId: '',
  type: 'builtin',
  title: '',
  config: {} as any,
  basicSettings: {} as any,
  dataSource: {
    origin: 'device',
    systemSource: [{}],
    deviceSource: [{}]
  } as any
};
const dataTimeRangeOptions = [
  { label: $t('common.last_5m'), value: 'last_5m' },
  { label: $t('common.last_15m'), value: 'last_15m' },
  { label: $t('common.last_30m'), value: 'last_30m' },
  { label: $t('common.lastHours1'), value: 'last_1h' },
  { label: $t('common.lastHours3'), value: 'last_3h' },
  { label: $t('common.lastHours6'), value: 'last_6h' },
  { label: $t('common.lastHours12'), value: 'last_12h' },
  { label: $t('common.lastHours24'), value: 'last_24h' },
  { label: $t('common.lastDays3'), value: 'last_3d' },
  { label: $t('common.lastDays7'), value: 'last_7d' },
  { label: $t('common.lastDays15'), value: 'last_15d' },
  { label: $t('common.lastDays30'), value: 'last_30d' },
  { label: $t('common.lastDays60'), value: 'last_60d' },
  { label: $t('common.lastDays90'), value: 'last_90d' }
];

const dataAggregateRangeOptions = [
  { label: $t('common.notAggre'), value: 'no_aggregate', disabled: false },
  { label: $t('common.seconds30'), value: '30s', disabled: false },
  { label: $t('common.minute1'), value: '1m', disabled: false },
  { label: $t('common.minute2'), value: '2m', disabled: false },
  { label: $t('common.minutes5'), value: '5m', disabled: false },
  { label: $t('common.minutes10'), value: '10m', disabled: false },
  { label: $t('common.minutes30'), value: '30m', disabled: false },
  { label: $t('common.hours1'), value: '1h', disabled: false },
  { label: $t('common.hours3'), value: '3h', disabled: false },
  { label: $t('common.hours6'), value: '6h', disabled: false },
  { label: $t('common.days1'), value: '1d', disabled: false },
  { label: $t('common.days7'), value: '7d', disabled: false },
  { label: '1月', value: '1mo', disabled: false }
];
const aggregateFunctionOptions: SelectOption[] = [
  { label: $t('common.average'), value: 'avg' },
  { label: $t('generate.max-value'), value: 'max' },
  { label: $t('common.sum'), value: 'sum' },
  { label: $t('common.diffValue'), value: 'diff' }
];
const state = reactive({
  tab: 'device',
  selectCard: null as null | ICardDefine,
  data: copy(defData)
});
const findCard = (id: string) => {
  const cIds = id.split('-');
  const cId = `${cIds[0]}-${cIds[1]}`;
  return store.$state.cardMap.get(cId) || null;
};

const emit = defineEmits<{
  (e: 'update', data: ICardData): void;
}>();

watch(
  () => state.data,
  data => {
    emit('update', data as any);
  },
  { deep: true }
);

defineExpose({
  setCard: (data?: ICardData) => {
    state.selectCard = null;
    state.data = copy(data || defData);
    setTimeout(() => {
      state.selectCard = findCard(state.data.cardId);
      if (state.data.type === 'chart') state.tab = 'dataSource';
      else if (state.selectCard?.configForm) state.tab = 'config';
      else state.tab = 'basic';
    });
  }
});

// deviceList;
// deviceMetricsList;
const deviceOption = ref<SelectOption[]>();
const deviceCount = ref();

const deviceCountUpdate = v => {
  state.data.dataSource.deviceCount = v;
  if (state.data.dataSource.deviceSource.length < v) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i <= v - state.data.dataSource.deviceSource.length + 1; i++) {
      state.data.dataSource.deviceSource.push({});
    }
  } else if (state.data.dataSource.deviceSource.length > v) {
    state.data.dataSource.deviceSource.splice(v, state.data.dataSource.deviceSource.length - v);
  }
};
const updateDropdownShow = (show: boolean, item) => {
  item.metricsShow = show;
};

const getDeviceList = async () => {
  const res = await deviceListForPanel({});
  deviceOption.value = res.data;
};

const deviceSelectChange = async (v, item) => {
  const res = await deviceMetricsList(v);
  item.metricsOptions = res?.data || [];
};

const metricsOptionRender = (info, item) => {
  return (
    <div class="border-b border-#d9d9d9 p-x-10px p-y-15px">
      <div class="m-b-5px">{<span style="font-size: 16px;color:#999">{info?.option?.data_source_type}</span>}</div>
      {info?.option?.options?.map(it => {
        return (
          <div
            class="m-b-2px"
            v-if="it.label"
            onClick={() => {
              item.metricsId = it.key;
              item.metricsName = it.label || '';
              item.metricsType = info?.option?.data_source_type;
              item.metricsDataType = it.data_type;
              updateDropdownShow(false, item);
            }}
          >
            {it.label ? (
              <div class="flex items-center gap-5px">
                <div class="flex flex-1 items-center gap-5px">
                  <span>{it.label}</span>
                  <span class="color-#cccc">({it.key})</span>
                </div>
                <span class="text-#999">{it.data_type}</span>
              </div>
            ) : (
              <div class="flex items-center gap-5px">
                <span class="flex-1">{it.key}</span>
                <span class="text-#999">{it.data_type}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

onUpdated(() => {
  deviceCount.value = state?.data?.dataSource?.deviceSource?.length || 1;

  if (state.data.type === 'chart') {
    getDeviceList();
  }
});

onMounted(() => {
  deviceCount.value = state?.data?.dataSource?.deviceSource?.length || 1;
  if (state.data.type === 'chart') {
    getDeviceList();
  }
});

watch(
  () => state.data.cardId,
  cardId => {
    if (props?.deviceWebChartConfig?.length > 0) {
      state.data.dataSource.deviceSource = props?.deviceWebChartConfig?.filter(
        item => item.data.cardId === cardId
      )[0]?.data?.dataSource?.deviceSource;
    }
  }
);

watch(deviceCount, v => {
  deviceCountUpdate(v);
});
</script>

<template>
  <div>
    <NTabs v-if="state.selectCard" v-model:value="state.tab" type="line" animated>
      <NTabPane v-if="state.selectCard.type === 'chart'" name="dataSource" tab="数据源">
        <div :class="`${mobile ? '' : 'h-[calc(100vh_-_270px)] '} overflow-y-auto py-5`">
          <NForm>
            <NSelect
              v-if="state.data.dataSource.isSupportTimeRange"
              v-model:value="state.data.dataSource.dataTimeRange"
              clearable
              :options="dataTimeRangeOptions"
              placeholder="请选择数据时间范围"
            />
            <NSelect
              v-if="state.data.dataSource.isSupportAggregate"
              v-model:value="state.data.dataSource.dataAggregateRange"
              clearable
              :options="dataAggregateRangeOptions"
              placeholder="请选择数据聚合范围"
            />
            <div v-if="state.data.dataSource?.origin === 'device' || state.data.dataSource?.origin === 'system'">
              <n-input-number
                v-model:value="deviceCount"
                :disabled="props?.deviceWebChartConfig?.length !== 0"
                :min="1"
                :hidden="state.data.dataSource.sourceNum === 1"
                :max="state.data.dataSource.sourceNum || 9"
                class="m-b-2 w-360px"
              >
                <template #prefix>
                  <span class="text-#999">{{ $t('generate.device-count') }}</span>
                </template>
              </n-input-number>

              <div v-for="(item, i) in state.data.dataSource.deviceSource" :key="i" class="mb-4 flex space-x-2">
                <NSelect
                  v-if="i <= deviceCount - 1"
                  v-model:value="item.deviceId"
                  clearable
                  :disabled="props?.deviceWebChartConfig?.length !== 0"
                  class="w-120px"
                  :options="deviceOption"
                  label-field="name"
                  value-field="id"
                  @update:value="value => deviceSelectChange(value, item)"
                >
                  <template #header>{{ $t('generate.device') }}</template>
                </NSelect>

                <NSelect
                  v-if="i <= deviceCount - 1"
                  v-model:value="item.metricsId"
                  clearable
                  :disabled="props?.deviceWebChartConfig?.length !== 0"
                  class="w-225px"
                  :show="item.metricsShow"
                  :options="item?.metricsOptions"
                  :render-option="info => metricsOptionRender(info, item)"
                  @update:show="show => updateDropdownShow(show, item)"
                ></NSelect>
                <NInput
                  v-if="i <= deviceCount - 1"
                  v-model:value="item.metricsName"
                  class="metrics-name-input"
                  placeholder="请输入名称"
                />
                <NSelect
                  v-if="i <= deviceCount - 1 && state.data.dataSource.isSupportAggregate"
                  v-model:value="item.aggregate_function"
                  clearable
                  class="w-120px"
                  :options="aggregateFunctionOptions"
                  placeholder="请选择数据聚合方式"
                />
              </div>
            </div>
          </NForm>
        </div>
      </NTabPane>
      <NTabPane v-if="!!state.selectCard?.configForm" name="config" tab="组件设置">
        <div :class="`${mobile ? '' : 'overflow-y-auto'} py-5`">
          <div class="max-w-[600px]">
            <ConfigCtx v-model:config="state.data.config" mode="insert">
              <component :is="state.selectCard?.configForm" :data="state.data" />
              <!-- v-model:data="state" -->
            </ConfigCtx>
          </div>
        </div>
      </NTabPane>
      <NTabPane name="basic" tab="基础设置">
        <NForm>
          <NFormItem :label="$t('page.manage.menu.form.title')">
            <div class="flex items-center">
              <div class="w-36">
                <NCheckbox v-model:checked="state.data.basicSettings.showTitle">
                  {{ $t('generate.display-title') }}
                </NCheckbox>
              </div>
              <NInput
                v-if="state.data.basicSettings.showTitle"
                v-model:value="state.data.basicSettings.title"
                @keydown.enter.prevent
              />
            </div>
          </NFormItem>
        </NForm>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.custom-select-container .v-binder-follower-container {
  width: 300px !important;
  /* 只会影响该组件内的 NSelect 下拉宽度 */
}
.metrics-name-input {
  max-width: 140px;
}
</style>
