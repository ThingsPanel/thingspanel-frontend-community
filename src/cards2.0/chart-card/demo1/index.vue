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
  <n-descriptions label-placement="top" :column="1" title="配置展示" bordered size="small">
    <n-descriptions-item label="基础配置">
      <n-space justify="space-between">
        <div>标题：{{ cardData?.config.basis.title }}</div>
        <div>是否显示：{{ cardData?.config.basis.showTitle ? $t('common.yesOrNo.yes') : $t('common.yesOrNo.no') }}</div>
      </n-space>
    </n-descriptions-item>
    <n-descriptions-item label="数据源">
      <n-space justify="space-between">
        <div>
          <div>系统数据（{{ cardData?.config.source.systemCount || 0 }}）：</div>
          <div>
            <span v-for="(item, index) in cardData?.config.source.systemSource" :key="index">{{ item }} |</span>
          </div>
        </div>
        <div>
          <div>设备数据（{{ cardData?.config.source.deviceCount || 0 }}）：</div>
          <div>
            <div v-for="(item, index) in cardData?.config.source.deviceSource" :key="index">
              设备id：{{ item.deviceId }} | 指标id：{{ item.metricsId }} | 数据名称：{{ item.metricsName }}
            </div>
          </div>
        </div>
      </n-space>
    </n-descriptions-item>
    <n-descriptions-item label="UI配置-字体大小">
      {{ cardData?.config.cardUI.textNUmber ? cardData?.config.cardUI.textNUmber + 'px' : '未配置' }}
    </n-descriptions-item>
  </n-descriptions>
</template>

<style scoped></style>
