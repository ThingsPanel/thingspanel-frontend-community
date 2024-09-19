<script lang="ts" setup>
import { ref, watch } from 'vue';
import type { ICardData } from '@/components/panel/card';
import TableComponent from '@/card/chart-card/table/modules/table.vue';

const props = defineProps<{
  card: ICardData;
}>();

const tableInst = ref<InstanceType<typeof TableComponent>>();
const cardData = ref<ICardData>(props.card);
watch(
  () => props.card,
  () => {
    cardData.value = props.card;
  },
  { deep: true }
);
</script>

<template>
  <TableComponent ref="tableInst" :card="cardData" class="pb-10px" />
</template>

<style scoped></style>
