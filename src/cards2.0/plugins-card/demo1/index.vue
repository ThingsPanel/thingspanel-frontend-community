<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { CardData } from '@/components/tp-kan-ban/kan-ban'
import { $t } from '@/locales'

const props = defineProps<{
  view?: boolean
  card: CardData
}>()

const cardData = ref<CardData>()

watch(
  () => props.card,
  () => {
    cardData.value = props.card
  },
  { deep: true }
)
onMounted(() => {
  cardData.value = props.card
})
</script>

<template>
  <div class="h-full w-full flex-col items-center justify-center">
    <div :style="`font-size:${cardData?.config?.cardUI?.textsize || 12}px`">
      {{ $t('card.networkImageText', { size: cardData?.config?.cardUI?.textsize || 12 }) }}
    </div>
    <div>
      <n-image :width="100" :height="100" :src="cardData?.config?.cardUI?.src" class="h-full w-full" />
    </div>
  </div>
</template>

<style scoped></style>
