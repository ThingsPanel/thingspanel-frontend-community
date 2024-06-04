<script lang="ts" setup>
import { onMounted, onUpdated, reactive, ref } from 'vue';
// eslint-disable-next-line vue/prefer-import-from-vue
import type { UnwrapRefSimple } from '@vue/reactivity';
import type { ICardData, ICardDefine } from '@/components/panel/card';
import { PanelCards } from '@/components/panel';
import { deviceTemplateSelect } from '@/service/api';
import { $t } from '@/locales';
import curvePoster from '@/card/chart-card/curve/poster.png';
import demoPoster from '@/card/chart-card/demo/poster.png';
import switchPoster from '@/card/chart-card/switch/poster.png';

const props = defineProps<{
  class?: string | undefined;
  data?: ICardData | null;
}>();
const tabValue = ref('builtin');
const tabList = [
  { tab: '系统', type: 'builtin' },
  { tab: '设备', type: 'device' },
  { tab: '插件', type: 'plugin' },
  { tab: '图表', type: 'chart' }
];
const state = reactive({
  curCardData: null as null | Record<string, any>
});
// $emit是内置变量 不可以使用$emit 作为变量名
const emit = defineEmits<{
  (e: 'selectCard', value: any): void;
}>();

const selectCard = item => {
  console.log('selectCard', item);
  state.curCardData = {
    cardId: item.cardId,
    type: item.type,
    title: item.title,
    config: item.config || {},
    basicSettings: item.basicSettings || {},
    dataSource: item.dataSource || {
      origin: 'system',
      systemSource: [{}],
      deviceSource: [{}]
    }
  };
  emit('selectCard', JSON.parse(JSON.stringify(state.curCardData)));
};
const getImagePath = item => {
  const cardType = item.data.cardId.match(/curve|demo|switch/);

  if (!cardType) {
    return demoPoster;
  }

  if (cardType[0] === 'curve') {
    return curvePoster;
  } else if (cardType[0] === 'switch') {
    return switchPoster;
  }
  return demoPoster;
};
const selectFinalCard = (item: ICardDefine) => {
  state.curCardData = {
    cardId: item.id,
    type: item.type,
    title: item.title,
    config: item.preset?.config || {},
    layout: item.preset?.iCardViewDefault,
    basicSettings: item.preset?.basicSettings || {},
    dataSource: item.preset?.dataSource || {
      origin: 'system',
      systemSource: [{}],
      deviceSource: [{}]
    }
  };
  emit('selectCard', JSON.parse(JSON.stringify(state.curCardData)));
};

const deviceOptions = ref<UnwrapRefSimple<any>[]>();
const webChartConfig = ref<any>([]);
const availableCardIds = ref<string[]>([]);
const deviceSelectId = ref<string>('');

const getDeviceOptions = async () => {
  const { data, error } = await deviceTemplateSelect();
  if (!error) {
    deviceOptions.value = data;
  }
};
const collectData = (v, o) => {
  if (o?.web_chart_config) {
    webChartConfig.value = JSON.parse(o.web_chart_config);
    availableCardIds.value = webChartConfig.value.map(item => {
      item.data.dataSource.deviceSource.forEach(item1 => {
        item1.deviceId = v;
      });

      return item.data.cardId;
    });
  }
};

onUpdated(() => {
  // console.log(webChartConfig.value, '4234324324');
  if (props?.data?.dataSource?.deviceSource && props?.data?.dataSource?.deviceSource?.length > 0) {
    deviceSelectId.value = props?.data?.dataSource?.deviceSource[0]?.deviceId || '';
    collectData(
      deviceSelectId.value,
      deviceOptions.value?.find(item => item.device_id === deviceSelectId.value)
    );
  } else {
    availableCardIds.value = [];
  }
});

onMounted(() => {
  console.log(`data:${props?.data}`);
  if (props?.data?.dataSource?.deviceSource && props?.data?.dataSource?.deviceSource?.length > 0) {
    deviceSelectId.value = props?.data?.dataSource?.deviceSource[0]?.deviceId || '';
    collectData(
      deviceSelectId.value,
      deviceOptions.value?.find(item => item.device_id === deviceSelectId.value)
    );
  } else {
    availableCardIds.value = [];
  }
  tabValue.value = props?.data?.type || 'builtin';
  getDeviceOptions();
});
</script>

<template>
  <div :class="props.class">
    <div class="h-full overflow-y-auto">
      <n-scrollbar style="height: 100%; padding: 4px">
        <NTabs
          type="line"
          default-value="builtin"
          :value="tabValue"
          animated
          class="h-full"
          @update:value="
            value => {
              console.log(value);
              if (state.curCardData) {
                state.curCardData.cardId = '';
              }
              availableCardIds = [];
              webChartConfig = [];
              deviceSelectId = '';
              tabValue = value;
            }
          "
        >
          <NTabPane v-for="item1 in tabList" :key="item1.type" class="h-full" :name="item1.type" :tab="item1.tab">
            <div v-if="item1.tab === '设备'">
              <NSelect
                v-model:value="deviceSelectId"
                :placeholder="$t('generate.select-device')"
                :options="deviceOptions"
                value-field="device_id"
                label-field="device_name"
                @update:value="
                  (value, option) => {
                    if (state.curCardData) {
                      state.curCardData.cardId = '';
                    }
                    collectData(value, option);
                  }
                "
              ></NSelect>
            </div>
            <n-scrollbar style="height: 100%; padding: 4px">
              <div v-if="item1.tab === '设备'">
                <n-grid :x-gap="10" :y-gap="10" cols="1 240:1 480:2 720:3">
                  <n-gi v-for="item in webChartConfig" :key="item.data.cardId" class="min-w-240px">
                    <div
                      v-if="item.data.cardId.indexOf('chart') != -1"
                      class="cursor-pointer overflow-hidden border rounded p-2px duration-200"
                      :style="
                        item.data.cardId === state?.curCardData?.cardId
                          ? 'border-color: #2d3d88'
                          : 'border-color: #f6f9f8'
                      "
                      @click="selectCard(item.data)"
                    >
                      <div class="text-center font-medium leading-8 dark:bg-zinc-900">
                        {{ item.data.dataSource?.deviceSource?.[0]?.metricsName || $t(item.data.title) }}
                      </div>
                      <div class="h-148px w-full">
                        <!--
        <img
                                :src="
                                    item.data.cardId.indexOf('chart-curve') != -1
                                    ? '../../../../card/chart-card/curve/poster.png'
                                    : '../chart-card/demo/poster.png'
                                "
                                alt=""
                                style="width: 100%; height: 100%; object-fit: contain"
        -->
                        <!-- /> -->
                        <!--                        <img-->
                        <!--                          v-if="item.data.cardId.indexOf('curve') != -1"-->
                        <!--                          src="../../../card/chart-card/curve/poster.png"-->
                        <!--                          style="width: 100%; height: 100%; object-fit: contain"-->
                        <!--                        />-->
                        <!--                        <img-->
                        <!--                          v-if="item.data.cardId.indexOf('demo') != -1"-->
                        <!--                          src="../../../card/chart-card/demo/poster.png"-->
                        <!--                          style="width: 100%; height: 100%; object-fit: contain"-->
                        <!--                        />-->
                        <!--                        <img-->
                        <!--                          v-if="item.data.cardId.indexOf('switch') != -1"-->
                        <!--                          src="../../../card/chart-card/switch/poster.png"-->
                        <!--                          style="width: 100%; height: 100%; object-fit: contain"-->
                        <!--                        />-->
                        <img :src="getImagePath(item)" style="width: 100%; height: 100%; object-fit: contain" />
                      </div>
                    </div>
                  </n-gi>
                </n-grid>
              </div>
              <div v-else>
                <n-grid :x-gap="10" :y-gap="10" cols="1 240:1 480:2 720:3">
                  <n-gi v-for="item in PanelCards[item1.type]" :key="item.id" class="min-w-240px">
                    <div
                      class="cursor-pointer overflow-hidden border rounded p-2px duration-200"
                      :style="
                        item.id === state?.curCardData?.cardId ? 'border-color: #2d3d88' : 'border-color: #f6f9f8'
                      "
                      @click="selectFinalCard(item)"
                    >
                      <div class="text-center font-medium leading-8 dark:bg-zinc-900">
                        {{ $t(item.title) }}
                      </div>
                      <div class="h-148px w-full">
                        <img :src="item.poster" alt="" style="width: 100%; height: 100%; object-fit: contain" />
                      </div>
                    </div>
                  </n-gi>
                </n-grid>
              </div>
            </n-scrollbar>
          </NTabPane>
        </NTabs>
      </n-scrollbar>
    </div>
  </div>
</template>
