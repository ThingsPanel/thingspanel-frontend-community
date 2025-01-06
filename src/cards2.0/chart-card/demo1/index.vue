<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { CardData } from '@/components/tp-kan-ban/kan-ban';
import { $t } from '@/locales';
const props = defineProps<{
  view?: boolean;
  card: CardData;
}>();

const cardData = ref<CardData>();

watch(
  () => props.card,
  () => {
    cardData.value = props.card;
  },
  { deep: true }
);
onMounted(() => {
  cardData.value = props.card;
});
</script>

<template>
  <n-descriptions label-placement="top" :column="1" :title="$t('card.configDisplay')" bordered size="small">
    <n-descriptions-item :label="$t('card.basicConfig')">
      <n-space justify="space-between">
        <div>{{ $t('card.title') }}：{{ cardData?.config.basis.title }}</div>
        <div>
          {{ $t('card.isShow') }}：{{
            cardData?.config.basis.showTitle ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no')
          }}
        </div>
      </n-space>
    </n-descriptions-item>
    <n-descriptions-item :label="$t('card.dataSource')">
      <n-space justify="space-between">
        <div>
          <div>{{ $t('card.systemData', { count: cardData?.config.source.systemCount || 0 }) }}：</div>
          <div>
            <span v-for="(item, index) in cardData?.config.source.systemSource" :key="index">{{ item }} |</span>
          </div>
        </div>
        <div>
          <div>{{ $t('card.deviceData', { count: cardData?.config.source.deviceCount || 0 }) }}：</div>
          <div>
            <div v-for="(item, index) in cardData?.config.source.deviceSource" :key="index">
              {{ $t('card.deviceId') }}：{{ item.deviceId }} | {{ $t('card.metricsId') }}：{{ item.metricsId }} |
              {{ $t('card.dataName') }}：{{ item.metricsName }}
            </div>
          </div>
        </div>
      </n-space>
    </n-descriptions-item>
    <n-descriptions-item :label="$t('card.uiConfigFontSize')">
      {{ cardData?.config.cardUI.textNUmber ? cardData?.config.cardUI.textNUmber + 'px' : $t('card.notConfigured') }}
    </n-descriptions-item>
  </n-descriptions>
</template>

<style scoped></style>
