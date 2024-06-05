<script setup lang="ts">
import { defineEmits, onMounted, ref } from 'vue';
import { KanBanCards } from '@/cards2.0';

defineOptions({ name: 'KanBanCardList' });

const activeType = defineModel('activeType', { required: true });
const cardList = ref<any[]>(KanBanCards.plugins);
const createCardList = (v: string) => {
  if (activeType.value) {
    activeType.value = v;
  }

  if (v === 'device') {
    cardList.value = KanBanCards.chart;
  } else {
    cardList.value = KanBanCards[v];
  }
};

const options = [
  { label: '系统', value: 'system', checked: false },
  { label: '插件', value: 'plugins', checked: true },
  { label: '设备', value: 'device', checked: false },
  { label: '图表', value: 'chart', checked: false }
];

const emits = defineEmits(['itemDropped']);

function dragEnd(_event, item) {
  emits('itemDropped', item);
}

function dragStart(event, item) {
  event.dataTransfer.setData('application/json', JSON.stringify(item));
  event.dataTransfer.effectAllowed = 'move';
}

onMounted(() => {
  createCardList(activeType.value as string);
});
</script>

<template>
  <n-tag
    v-for="item in options"
    :key="item.value"
    class="mb-12px mr-4px cursor-pointer hover:bg-primary-100"
    :type="activeType === item.value ? 'info' : undefined"
    @click="createCardList(item.value)"
  >
    {{ item.label }}
  </n-tag>

  <n-grid :x-gap="10" :y-gap="10" :cols="1">
    <n-gi v-if="!cardList?.length">
      <n-empty description="该类别下无卡片" />
    </n-gi>
    <n-gi
      v-for="item in cardList"
      :key="item.cardItemBase.id"
      draggable="true"
      @dragstart="dragStart($event, item)"
      @dragend="dragEnd($event, item)"
    >
      <div class="cursor-pointer overflow-hidden border rounded p-2px duration-200 hover:border-primary">
        <div class="border-b text-center text-12px">
          {{ item?.cardItemBase?.cardName }}
        </div>
        <div class="h-100px w-full">
          <img :src="item.poster" alt="" style="width: 100%; height: 100%; object-fit: contain" />
        </div>
      </div>
    </n-gi>
  </n-grid>
</template>

<style scoped></style>
