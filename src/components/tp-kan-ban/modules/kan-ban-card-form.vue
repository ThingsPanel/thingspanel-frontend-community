<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { CardItem } from '@/cards2.0/card';
import type { CardView } from '@/components/tp-kan-ban/kan-ban';
import { useKanBanStore } from '@/cards2.0/store/kan-ban-store';

const { cardMap } = useKanBanStore();
const copy = (obj: object) => JSON.parse(JSON.stringify(obj));
const defData: CardView = {
  x: 0,
  y: 0,
  w: 0,
  h: 0,
  i: '00',
  data: {
    cardItem: {
      type: 'plugins',
      id: '',
      cardName: '',
      renderID: '',
      sourceNumber: 9
    },
    sourceNumber: 9,
    cardId: '',
    renderID: '',
    config: {
      title: '',
      showTitle: '',
      basis: { title: '', showTitle: false },
      source: {},
      cardUI: {}
    }
  }
};

const state = reactive({
  selectCard: null as null | CardItem,
  cardView: copy(defData)
  // data: copy(defData)
});

const emit = defineEmits<{
  (e: 'update', data: CardView): void;
}>();

watch(
  () => state.cardView.data.config,
  value => {
    console.log(value, '4324343');
    emit('update', state.cardView as any);
  },
  { deep: true }
);

defineExpose({
  setCard: (data?: CardView) => {
    state.selectCard = null;
    state.cardView = copy(data || defData);
    setTimeout(() => {
      state.selectCard = cardMap.get(state.cardView.data.cardId) || null;
    });
  }
});
</script>

<template>
  <div>
    <KanBanCardConfigCtx v-model:config="state.cardView.data.config" mode="insert">
      <component :is="state.selectCard?.configForm" :data="state.cardView.data" />
    </KanBanCardConfigCtx>
  </div>
</template>

<style scoped></style>
