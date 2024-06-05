import { markRaw, ref } from 'vue';
import { defineStore } from 'pinia';
import { useMessage } from 'naive-ui';
import { objectEntries } from '@vueuse/core';
import { KanBanCards } from '@/cards2.0';
import type { CardItem } from '@/cards2.0/card';

export const useKanBanStore = defineStore('kan-ban-store', () => {
  const cardMap = ref<Map<string, CardItem>>(new Map());
  const message = useMessage();

  function initializeCardMap() {
    objectEntries(KanBanCards).forEach(([_key, cards]) => {
      for (const card of cards) {
        if (cardMap.value.has(card.cardItemBase.id)) {
          message.warning(`重复的看板卡片，id: ${card.cardItemBase.id}`);
        }
        cardMap.value.set(card.cardItemBase.id, markRaw(card));
      }
    });
  }

  // Initialize card map when the store is created
  initializeCardMap();

  return {
    cardMap
  };
});
