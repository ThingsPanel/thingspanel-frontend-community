<script lang="ts" setup>
import { onMounted, onUpdated, reactive, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { InformationCircleSharp } from '@vicons/ionicons5';
// eslint-disable-next-line vue/prefer-import-from-vue
import type { UnwrapRefSimple } from '@vue/reactivity';
import type { ICardData, ICardDefine, ICardFormIns } from '@/components/panel/card';
import { PanelCards } from '@/components/panel';
import { deviceTemplateSelect } from '@/service/api';
import { $t } from '@/locales';

const props = defineProps<{
  open: boolean;
  data?: ICardData | null;
}>();
const formRef = ref<ICardFormIns>();
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
  (e: 'update:open', value: boolean): void;
  (e: 'save', value: any): void;
}>();

const copy = (data: object) => JSON.parse(JSON.stringify(data));
const selectCard = item => {
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
  formRef.value?.setCard(state.curCardData as any);
};
const getImagePath = item => {
  const cardType = item.data.cardId.match(/curve|demo|switch/);

  if (!cardType) {
    return '/src/card/chart-card/default/poster.png';
  }

  return `/src/card/chart-card/${cardType[0]}/poster.png`;
};
const selectFinalCard = (item: ICardDefine) => {
  state.curCardData = {
    cardId: item.id,
    type: item.type,
    title: item.title,
    config: item.preset?.config || {},
    basicSettings: item.preset?.basicSettings || {},
    dataSource: item.preset?.dataSource || {
      origin: 'system',
      systemSource: [{}],
      deviceSource: [{}]
    }
  };
  formRef.value?.setCard(state.curCardData as any);
};

const message = useMessage();
const widths = ref(['flex-[44]', 'flex-[54]', 'flex-[2]']);
const count = ref<number>(2);
const changeWidths = () => {
  if (count.value === 1) {
    widths.value = ['flex-[2]', 'flex-[44]', 'flex-[54]'];
    count.value = 2;
  } else {
    widths.value = ['flex-[44]', 'flex-[54]', 'flex-[2]'];
    count.value = 1;
  }
};

const save = () => {
  if (!state?.curCardData?.cardId) {
    message.destroyAll();
    message.warning($t('common.selectCardFirst'));
    return;
  }
  count.value = 2;
  changeWidths();
  emit('update:open', false);

  if (state && state.curCardData && state.curCardData.dataSource && state.curCardData.dataSource.deviceSource) {
    state.curCardData.dataSource.deviceSource = state.curCardData.dataSource.deviceSource.filter(
      item => Object.keys(item).length > 0
    );
    if (
      state.curCardData.dataSource.deviceCount >= 1 &&
      state.curCardData.dataSource.deviceSource.length > state.curCardData.dataSource.deviceCount
    ) {
      state.curCardData.dataSource.deviceSource.splice(state.curCardData.dataSource.deviceCount);
      console.log(state.curCardData.dataSource.deviceCount, ':', state.curCardData.dataSource.deviceSource);
    }
    if (state.curCardData.dataSource.deviceSource.length === 0) {
      state.curCardData.dataSource.deviceSource = [{}];
    }
  }
  state.curCardData.type = tabValue.value;
  emit('save', JSON.parse(JSON.stringify(state.curCardData)));
};
watch(props, pr => {
  if (pr.open) {
    if (pr.data) {
      state.curCardData = {
        cardId: pr.data?.cardId,
        type: pr.data?.type,
        title: pr.data?.title,
        config: copy(pr.data?.config || {}),
        basicSettings: copy(pr.data?.basicSettings || {}),
        dataSource: copy(pr.data?.dataSource || {})
      };
    } else {
      state.curCardData = null;
    }
    setTimeout(() => {
      formRef.value?.setCard(state.curCardData as any);
    }, 30);
  }
});
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

  tabValue.value = props?.data?.type || 'builtin';
});

onMounted(() => {
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
  <NModal
    :show="open"
    preset="dialog"
    :title="$t('generate.configuration')"
    size="huge"
    :style="{
      width: 'calc(100vw - 180px)',
      height: 'calc(100vh - 50px)',
      minWidth: '882px'
    }"
    @close="
      () => {
        count = 2;
        changeWidths();
        emit('update:open', false);
      }
    "
    @mask-click="
      () => {
        count = 2;
        changeWidths();
        emit('update:open', false);
      }
    "
  >
    <div class="h-[calc(100vh_-_170px)] w-full flex">
      <div
        :class="'relative h-full flex flex-col p-4 overflow-hidden  ' + widths[0]"
        :style="
          count === 2
            ? 'background-color: #f0f0f0;opacity:0.4;box-shadow: 10px 0 15px rgba(0, 0, 0, 0.3);transition: all 0.3s ease;'
            : ''
        "
        @mouseenter="
          () => {
            count = 2;
            changeWidths();
          }
        "
      >
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
                        {{ $t(item.data.title) }}
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
        <n-float-button v-if="count === 2" position="absolute" :left="4" top="42%" width="20" shape="square">
          <span class="text-12px text-primary-600">{{ $t('generate.expand-card') }}</span>
        </n-float-button>
      </div>
      <div :class="'h-full flex-center justify-center border-r bg-[#f6f9f8] p-2 overflow-hidden ' + widths[1]">
        <div v-if="!state.curCardData?.cardId" class="mt-32">
          <NEmpty description="请选择要添加的卡片"></NEmpty>
        </div>
        <div
          v-if="state.curCardData?.cardId"
          class="mr-4 mt-2 h-full w-full flex flex-col justify-center bg-[#f6f9f8] dark:bg-[#101014]"
        >
          <div id="panel_view" class="w-full overflow-y-auto p-4">
            <CardItem :data="state.curCardData as any" />
          </div>
        </div>
      </div>

      <div
        :class="'relative h-full overflow-hidden p-4 ' + widths[2]"
        :style="
          count === 1
            ? 'background-color: #f0f0f0;opacity:0.4;box-shadow: -10px 0 15px rgba(0, 0, 0, 0.3);transition: all 0.3s ease;'
            : ''
        "
        @mouseenter="
          () => {
            if (!state?.curCardData?.cardId) {
              message.destroyAll();
              return message.warning($t('common.selectCardFirst'));
            }
            count = 1;
            changeWidths();
          }
        "
      >
        <div class="mt-4 h-full flex-col justify-start">
          <CardForm
            ref="formRef"
            :device-web-chart-config="webChartConfig"
            @update="(data: any) => (state.curCardData = data)"
          />
        </div>
        <n-float-button v-if="count === 1" position="absolute" :right="0" top="42%" width="20" shape="square">
          <span class="text-12px text-primary-600">{{ $t('generate.expand-configuration') }}</span>
        </n-float-button>
      </div>
    </div>
    <div class="h-60px flex flex-center border-t">
      <div>
        <NButton
          class="mr-4"
          @click="
            () => {
              count = 2;
              changeWidths();
              emit('update:open', false);
            }
          "
        >
          {{ $t('generate.cancel') }}
        </NButton>
        <NButton class="mr-4" type="primary" @click="save">{{ $t('generate.confirm') }}</NButton>
      </div>
    </div>
    <div v-if="count === 1" class="absolute bottom-0 right-0 h-60px flex flex-center">
      <n-icon size="24">
        <InformationCircleSharp class="color-red" />
      </n-icon>
      <span>{{ $t('generate.configuration-entry') }}</span>
    </div>
  </NModal>
</template>

<style scoped>
/* 滚动条的宽度 */
#panel_view::-webkit-scrollbar {
  width: 4px;
}

/* 滚动条的轨道 */
#panel_view::-webkit-scrollbar-track {
  background: #f1f1f1;
}

/* 滚动条的滑块 */
#panel_view::-webkit-scrollbar-thumb {
  background: #888;
}

/* 滚动条的滑块：鼠标悬停 */
#panel_view::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
