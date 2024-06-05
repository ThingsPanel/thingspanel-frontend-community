<script lang="ts" setup>
import { computed } from 'vue';
import { usePanelStore } from '@/store/modules/panel';
import type { ICardData } from '@/components/panel/card';

const props = defineProps<{
  view?: boolean;
  data: ICardData;
}>();
const cardId = computed(() => {
  const arr = props.data?.cardId?.split('-') || [];
  return `${arr[0]}-${arr[1]}`;
});
const store = usePanelStore();
const findCardComponent = (id: string) => {
  return store.$state.cardMap.get(id)?.component || null;
};
</script>

<template>
  <NCard class="relative h-full w-full" content-style="padding: 0px">
    <div
      v-if="data.basicSettings?.showTitle"
      class="h-7 w-full truncate border-b border-gray-200 px-2 text-sm leading-7 dark:border-gray-200/10"
    >
      {{ data.basicSettings?.title }}
    </div>
    <div class="h-full min-h-300px p-4">
      <component :is="findCardComponent(cardId || '')" :card="data" :view="view" @drag.stop="console.log(1)" />
    </div>
  </NCard>
</template>
