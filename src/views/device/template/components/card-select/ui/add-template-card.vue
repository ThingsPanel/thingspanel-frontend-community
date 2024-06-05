<script lang="ts" setup>
import { reactive, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import type { ICardData, ICardDefine, ICardFormIns } from '@/components/panel/card';
import { $t } from '@/locales';
import { PanelCards } from '../index';
import CardTemplateForm from './card-template-form.vue';

const props = defineProps<{
  open: boolean;
  data?: ICardData | null;
}>();
const formRef = ref<ICardFormIns>();
const state = reactive({
  curCardData: null as null | Record<string, any>
});
// $emit是内置变量 不可以使用$emit 作为变量名
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'save', value: any): void;
}>();

const copy = (data: object) => JSON.parse(JSON.stringify(data));
const selectCard = (item: ICardDefine) => {
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

const save = () => {
  if (!state?.curCardData?.cardId) {
    message.destroyAll();
    message.warning($t('common.selectCardFirst'));
    return;
  }

  emit('update:open', false);
  const deviceSource = state.curCardData.dataSource.deviceSource[0];
  const cardId = state.curCardData.cardId;
  state.curCardData.cardId = `${cardId}-${deviceSource.metricsId}`;
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
    @close="emit('update:open', false)"
    @mask-click="emit('update:open', false)"
  >
    <div class="h-[calc(100vh_-_170px)] w-full flex">
      <div class="relative h-full flex flex-col flex-[44] overflow-hidden p-4">
        <NTabs type="line" default-value="chart" animated class="h-full">
          <NTabPane class="h-full" name="chart" value="chart" :tab="$t('common.chart')">
            <n-scrollbar style="height: 100%; padding: 4px">
              <n-grid :x-gap="10" :y-gap="10" cols="1 240:1 480:2 720:3">
                <n-gi v-for="item in PanelCards.chart" :key="item.id" class="min-w-240px">
                  <div
                    class="cursor-pointer overflow-hidden border rounded p-2px duration-200"
                    :style="item.id === state?.curCardData?.cardId ? 'border-color: #2d3d88' : 'border-color: #f6f9f8'"
                    @click="selectCard(item)"
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
            </n-scrollbar>
          </NTabPane>
        </NTabs>
      </div>
      <div class="relative h-full flex-[54] overflow-hidden p-4">
        <div class="mt-4 h-full flex-col justify-start">
          <CardTemplateForm ref="formRef" @update="(data: any) => (state.curCardData = data)" />
        </div>
      </div>
    </div>
    <div class="h-60px flex flex-center border-t">
      <div>
        <NButton class="mr-4" @click="emit('update:open', false)">{{ $t('generate.cancel') }}</NButton>
        <NButton class="mr-4" type="primary" @click="save">{{ $t('generate.confirm') }}</NButton>
      </div>
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
