<script setup lang="ts">
import { ref, watch } from 'vue';
import { cloneDeep } from 'lodash-es';
import { GridItem, GridLayout } from '@/components/drg-grid-layout';
import type { CardData, CardView } from '@/components/tp-kan-ban/kan-ban';
import { KANBANCOLNUM, KANBANROWHEIGHT } from '@/constants/common';
import { $t } from '@/locales';
import TpCardItem from '@/components/tp-kan-ban/modules/tp-card-item.vue';

defineOptions({ name: 'KanBanRender' });
const mouseAt = { x: -1, y: -1 };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const props = defineProps<{
  isPreview: boolean;
  responsive: boolean;
  layout: CardView[];
  addItem: (item: CardView) => void;
  removeItem: (id: string) => void;
  selectCard: (item: CardView) => void;
  updateLayouts: (layout: CardView[]) => void;
}>();
const wrapper = ref<HTMLElement>();
const gridLayout = ref<InstanceType<typeof GridLayout>>();
const theLayout = ref<CardView[]>(cloneDeep(props.layout));

function onDrop(event) {
  console.log(0, event);
  event.preventDefault();
  // eslint-disable-next-line @typescript-eslint/no-shadow
  // theLayout.value = theLayout.value.filter(item => item.i !== dropId);
  const data = event.dataTransfer.getData('application/json');
  const cardItem = JSON.parse(data);

  const minWh = {
    minW: 2,
    minH: 2
  };

  if (cardItem.cardItemBase.minWH.minW !== -1) {
    if (typeof cardItem.cardItemBase.minWH.minW === 'number') {
      minWh.minW = cardItem.cardItemBase.minWH.minW;
    } else {
      const w = cardItem.cardItemBase.minWH.minW.replace('px', '');
      minWh.minW = Math.ceil(Number(w) / (gridLayout?.value?.state?.width || 0 / KANBANCOLNUM));
    }
  }
  if (cardItem.cardItemBase.minWH.minH !== -1) {
    if (typeof cardItem.cardItemBase.minWH.minH === 'number') {
      minWh.minH = cardItem.cardItemBase.minWH.minH;
    } else {
      const h = cardItem.cardItemBase.minWH.minH.replace('px', '');

      minWh.minH = Math.ceil(Number(h) / KANBANROWHEIGHT);
    }
  }
  if (props.responsive) {
    minWh.minW = 2;
    minWh.minH = 2;
  }
  const rect = event.currentTarget.getBoundingClientRect();
  mouseAt.x = event.clientX - rect.left; // 鼠标位置相对于 drop-area 元素的 X 坐标
  mouseAt.y = event.clientY - rect.top; // 鼠标位置相对于 drop-area 元素的 Y 坐标

  const itemId = cardItem?.cardItemBase?.renderID || `${theLayout.value.length.toString()}_${cardItem.cardItemBase.id}`;
  const item: CardView = {
    x: (theLayout.value.length * 2) % KANBANCOLNUM,
    y: theLayout.value.length + KANBANCOLNUM,
    w: minWh.minW,
    h: minWh.minH,
    minH: minWh.minH,
    minW: minWh.minW,
    i: itemId,
    data: {
      cardItem: cardItem.cardItemBase,
      cardId: cardItem.cardItemBase.id,
      renderID: itemId,
      sourceNumber: cardItem.cardItemBase.sourceNumber,
      config: {
        basis: {
          title: cardItem.cardItemBase.basicSettings.defaultTitle,
          showTitle: cardItem.cardItemBase.basicSettings.showTitle
        },
        source: {},
        cardUI: {}
      }
    }
  };
  props.addItem(item);
}

// eslint-disable-next-line vue/no-dupe-keys
function remove(id: string) {
  props.removeItem(id);
}

const layoutUpdated = layout => {
  props.updateLayouts(layout);
};

watch(
  () => props.layout,
  () => {
    console.log(1);
    theLayout.value = props.layout;
  },
  { deep: true }
);
</script>

<template>
  <n-card class="h-full w-full" content-class="h-full w-full custom-scroll" content-style="padding:0;margin:0">
    <div ref="wrapper" key="layoutKey" class="h-full w-full" @dragover.prevent @drop="onDrop">
      <div v-if="!theLayout.length" class="h-full flex items-center justify-center">
        <NEmpty description="暂未添加组件,移入添加按钮，然后拖入卡片吧"></NEmpty>
      </div>

      <GridLayout
        v-else
        ref="gridLayout"
        v-model:layout="theLayout"
        :use-style-cursor="false"
        style="height: 100%"
        class="w-full"
        :restore-on-drag="true"
        :col-num="KANBANCOLNUM"
        :row-height="KANBANROWHEIGHT"
        :responsive="responsive"
        :margin="[10, 10]"
        @layout-updated="layoutUpdated"
      >
        <GridItem
          v-for="item in theLayout"
          :key="item.i"
          :static="isPreview"
          :x="item.x"
          :y="item.y"
          :w="item.w"
          :h="item.h"
          :i="item.i"
          :min-w="responsive ? 2 : item.minW"
          :min-h="responsive ? 2 : item.minH"
        >
          <div class="relative h-full w-full">
            <NIcon
              v-if="!isPreview"
              class="absolute right-8 top-1.5 z-50 cursor-pointer cursor-pointer opacity-50 duration-200 hover:opacity-100"
              @click="selectCard(item)"
            >
              <SvgIcon icon="uil:setting" class="text-base" />
            </NIcon>
            <NPopconfirm
              v-if="!isPreview"
              :show-icon="false"
              :negative-button-props="{ size: 'tiny' }"
              :positive-button-props="{ size: 'tiny' }"
              :on-positive-click="() => remove(item.i as string)"
            >
              <template #trigger>
                <NIcon
                  class="absolute right-2 top-1.5 z-50 cursor-pointer cursor-pointer opacity-50 duration-200 hover:opacity-100"
                >
                  <SvgIcon icon="material-symbols:delete-outline" class="text-base" />
                </NIcon>
              </template>
              <span>{{ $t('generate.confirm-delete-dashboard') }}</span>
            </NPopconfirm>
            <TpCardItem :data="item.data as CardData" :view="isPreview" />
          </div>
        </GridItem>
      </GridLayout>
    </div>
  </n-card>
</template>

<style>
/* 针对具体 div 的滚动条样式 */
.custom-scroll {
  overflow: auto;
  scrollbar-width: thin; /* Firefox */
}
</style>
