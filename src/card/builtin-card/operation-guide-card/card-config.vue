<script lang="ts" setup>
import { inject, ref, watch, onMounted, computed } from 'vue';
import { NDynamicInput, NInput, NColorPicker, NFormItem, NGrid, NFormItemGi } from 'naive-ui';
import type { IConfigCtx } from '@/components/panel/card';
import { $t } from '@/locales';
import { cloneDeep } from 'lodash';

interface GuideItem {
  title: string;
  description: string;
  link: string;
}

const ctx = inject<IConfigCtx>('config-ctx')!;

const guideListRef = ref<(GuideItem[])>([]);

const configRef = computed(() => ctx.config);
if (!configRef.value.serialBgColor) {
  configRef.value.serialBgColor = '#2080f0';
}
if (!configRef.value.itemBgColor) {
  configRef.value.itemBgColor = '#f3f3f5';
}
if (!configRef.value.itemHoverBgColor) {
  configRef.value.itemHoverBgColor = '#EDEDFF';
}
if (!configRef.value.titleColor) {
  configRef.value.titleColor = '#333639';
}
if (!configRef.value.descriptionColor) {
  configRef.value.descriptionColor = '#666';
}

watch(guideListRef, (newValue) => {
  ctx.config.guideList = newValue;
}, { deep: true });

watch(() => ctx.config.guideList, (newConfigValue) => {
  if (JSON.stringify(newConfigValue) !== JSON.stringify(guideListRef.value)) {
    guideListRef.value = cloneDeep(newConfigValue as GuideItem[]) || [];
  }
}, { deep: true, immediate: true });

onMounted(() => {
  // Watch with immediate: true should handle initial sync
  // guideListRef.value = cloneDeep(ctx.config.guideList as GuideItem[]) || [];
});

const createDefaultGuideItem = (): GuideItem => {
  return {
    title: '',
    description: '',
    link: ''
  };
};
</script>

<template>
  <div>
    <h4 class="mb-2 font-semibold">{{ $t('card.uiSettings') }}</h4>
    <NGrid :cols="5" :x-gap="12">
      <NFormItemGi :label="$t('card.serialBgColor')" class="config-item">
         <NColorPicker v-model:value="configRef.serialBgColor" size="small" :show-alpha="false" />
      </NFormItemGi>
      <NFormItemGi :label="$t('card.itemBgColor')" class="config-item">
         <NColorPicker v-model:value="configRef.itemBgColor" size="small" :show-alpha="false" />
      </NFormItemGi>
      <NFormItemGi :label="$t('card.itemHoverBgColor')" class="config-item">
         <NColorPicker v-model:value="configRef.itemHoverBgColor" size="small" :show-alpha="false" />
      </NFormItemGi>
      <NFormItemGi :label="$t('card.titleColor')" class="config-item">
         <NColorPicker v-model:value="configRef.titleColor" size="small" :show-alpha="false" />
      </NFormItemGi>
      <NFormItemGi :label="$t('card.descriptionColor')" class="config-item">
         <NColorPicker v-model:value="configRef.descriptionColor" size="small" :show-alpha="false" />
      </NFormItemGi>
    </NGrid>

    <hr class="my-4">

    <h4 class="mb-2 font-semibold">{{ $t('card.guideList') }}</h4>
    <NDynamicInput
      v-model:value="guideListRef"
      :on-create="createDefaultGuideItem"
      item-style="padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px solid #eee;"
      #default="{ value, index }"
    >
      <div class="flex items-center gap-2">
        <span class="font-semibold w-6 text-center">{{ index + 1 }}.</span>
        <NInput class="flex-1" v-model:value="value.title" type="text" :placeholder="$t('card.title')" size="small" />
        <NInput class="flex-1" v-model:value="value.description" type="text" :placeholder="$t('card.description')" size="small" />
        <NInput class="flex-1" v-model:value="value.link" type="text" :placeholder="$t('card.pleaseEnterLink')" size="small" />
      </div>
    </NDynamicInput>
  </div>
</template>

<style scoped>
/* 调整 NFormItemGi 内的 label 和 picker 对齐 */
.config-item :deep(.n-form-item-label) {
  padding: 0;
  line-height: normal; /* 调整行高避免过高 */
  margin-bottom: 4px; /* label 和 picker 间加一点距离 */
  text-align: left; /* 确保左对齐 */
  /* 添加固定宽度和溢出处理 */
  width: 80px; /* 或根据实际最长标签调整 max-width */
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.config-item :deep(.n-form-item-blank) {
   width: 100%; /* 让颜色选择器占满 */
}

/* 可以保留一些全局样式或移除 */
</style> 