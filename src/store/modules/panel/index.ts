import { markRaw } from 'vue';
import { defineStore } from 'pinia';
import { useMessage } from 'naive-ui';
import { objectEntries } from '@vueuse/core';
import type { ICardDefine } from '@/components/panel/card';
import { PanelCards } from '@/components/panel';

export const usePanelStore = defineStore('panel-store', {
  state: () => {
    const cardMap = new Map<string, ICardDefine>();
    const message = useMessage();
    objectEntries(PanelCards).forEach(item => {
      for (const card of item[1]) {
        if (cardMap.get(card.id)) {
          message.warning(`重复的看板卡片，id: ${card.id}`);
        }
        cardMap.set(card.id, markRaw(card));
      }
    });
    return {
      cardMap
    };
  },
  actions: {}
});
