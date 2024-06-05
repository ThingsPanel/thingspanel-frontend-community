<script setup lang="ts">
import type { CardData } from '@/components/tp-kan-ban/kan-ban';
import { useKanBanStore } from '@/cards2.0/store/kan-ban-store';

defineOptions({ name: 'TpCardItem' });

const props = defineProps<{ data: CardData; view: boolean }>();

const { cardMap } = useKanBanStore();
</script>

<template>
  <NCard class="relative h-full w-full" content-style="padding: 0px">
    <div
      v-if="data?.config?.basis.showTitle"
      class="h-7 w-full truncate border-b border-gray-200 px-2 text-sm leading-7 dark:border-gray-200/10"
    >
      {{ data?.config?.basis.title }}
    </div>
    <div class="w p-4">
      <component
        :is="cardMap.get(props?.data?.cardId)?.component"
        :card="props.data"
        :view="view"
        @drag.stop="console.log(1)"
      />
    </div>
  </NCard>
</template>

<style scoped>
.w {
  width: 100%;
  height: 100%;
}
</style>
