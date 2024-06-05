<script lang="tsx" setup>
import type { Ref } from 'vue';
import { inject, onMounted, onUpdated, reactive, ref, watch } from 'vue';
import { $t } from '@/locales';
import { usePanelStore } from '@/store/modules/panel';
import type { ICardData, ICardDefine } from '@/components/panel/card';
import { deviceModelSourceForPanel } from '@/service/api';

const copy = (obj: object) => JSON.parse(JSON.stringify(obj));
const deviceTemplateId = inject<Ref<any>>('device_template_id');
defineProps<{
  mobile?: boolean;
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
const state = reactive({
  tab: 'device',
  selectCard: null as null | ICardDefine,
  data: copy(defData)
});

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
      state.selectCard = store.$state.cardMap.get(state.data.cardId) || null;
      if (state.data.type === 'chart') state.tab = 'dataSource';
      else if (state.selectCard?.configForm) state.tab = 'config';
      else state.tab = 'basic';
    });
  }
});

const indicateOption = ref<any[]>();

const indicateValue = ref();
const transformForTransfer = data => {
  const transformed: any = [];
  data.forEach(group => {
    group.options.forEach(option => {
      // 在label中添加data_source_type来模拟分组效果
      const label = `${group.data_source_type} - ${option.label}`;
      transformed.push({
        label,
        value: `${group.data_source_type}-${option.label}-${option.key}`
        // 这里可以根据需要添加其他属性，比如 data_type
      });
    });
  });
  return transformed;
};
const getPanelList = async () => {
  const res = await deviceModelSourceForPanel({
    id: deviceTemplateId?.value || ''
  });
  indicateOption.value = transformForTransfer(res?.data || []);
};

const changeIndicate = value => {
  // eslint-disable-next-line no-param-reassign
  value = value.filter(item => item !== undefined);
  if (value.length > state.data.dataSource.sourceNum) {
    window.NMessage.error($t('common.maxSelect') + state.data.dataSource.sourceNum + $t('common.dataSources'));
  }
  if (state.data.dataSource.sourceNum === 1) {
    indicateValue.value = [value[value.length - 1]];
  } else {
    indicateValue.value = value.slice(0, state.data.dataSource.sourceNum || 9);
  }
  state.data.dataSource.deviceCount = indicateValue.value.length;
  state.data.dataSource.deviceSource = [];
  // const cardId: any = state.data.cardId;
  indicateValue.value.forEach(item => {
    const arr = item?.split('-') || [];
    if (arr.length > 0) {
      const obj = {
        metricsId: arr[2],
        metricsName: arr[1],
        metricsType: arr[0]
      };
      // state.data.cardId = cardId + "-" + arr[2];
      state.data.dataSource.deviceSource.push(obj);
    }
  });
};
onUpdated(() => {
  if (state.data.type === 'chart') {
    getPanelList();
  }
  indicateValue.value = [];
  state.data.dataSource.deviceSource.forEach(item => {
    console.log(item, 'onUpdated');
    if (item.metricsName) {
      const value = `${item.metricsType}-${item.metricsName}-${item.metricsId}`;
      indicateValue.value.push(value);
    }
  });
  console.log(indicateValue.value, 'onUpdated');
});

onMounted(() => {
  if (state.data.type === 'chart') {
    getPanelList();
  }
});
</script>

<template>
  <div>
    <NTabs v-if="state.selectCard" v-model:value="state.tab" type="line" animated>
      <NTabPane v-if="state.selectCard.type === 'chart'" name="dataSource" tab="数据源">
        <div :class="`${mobile ? '' : 'h-[calc(100vh_-_270px)] '} overflow-y-auto py-5`">
          <NForm>
            <div>
              <n-transfer
                ref="transfer"
                v-model:value="indicateValue"
                :options="indicateOption"
                source-filterable
                @update:value="changeIndicate"
              />
            </div>
          </NForm>
        </div>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.custom-select-container .v-binder-follower-container {
  width: 300px !important;
  /* 只会影响该组件内的 NSelect 下拉宽度 */
}
</style>
