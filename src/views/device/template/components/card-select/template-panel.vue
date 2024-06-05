<script lang="tsx" setup>
import type { Ref } from 'vue';
import { inject, onMounted, provide, reactive, ref, watch } from 'vue';
import type { ICardData, ICardRender, ICardView } from '@/components/panel/card';
import { getTemplat } from '@/service/api';
import { $t } from '@/locales';
import AddTemplateCard from './ui/add-template-card.vue';
import CardTemplateRender from './ui/card-template-render.vue';

const props = defineProps<{ templateId: string; isApp: boolean }>();

const device_template_id = ref<any>(props.templateId as any);

provide('device_template_id', device_template_id);
const webChartConfig = inject<Ref<ICardView[]>>('web_chart_config');
const layout = ref<ICardView[]>([]);
const fetchBroad = async () => {
  const { data, error } = await getTemplat(props.templateId);
  if (!error && data) {
    if (props.isApp && data.app_chart_config) {
      const configJson = JSON.parse(data.app_chart_config);
      layout.value = [...configJson];
    } else if (data.web_chart_config) {
      const configJson = JSON.parse(data.web_chart_config);
      layout.value = [...configJson];
    }
  }
};

const state = reactive({
  openAddPanel: false,
  cardData: null as null | ICardData
});

const editView = ref<ICardView | null>();
const cr = ref<ICardRender>();

const insertCard = (card: ICardData) => {
  if (editView.value && 'data' in editView.value) {
    editView.value.data = card;

    const lastUniqueById = layout.value
      .reduceRight((acc: ICardView[], cur: ICardView) => {
        if (
          !acc.some(item => {
            if (!item.data) return false;
            return item?.data?.cardId === cur?.data?.cardId;
          })
        ) {
          acc.push(cur as ICardView); // 如果acc中没有当前cur的cardId，则添加cur到acc中
        }
        return acc;
      }, [])
      .reverse();
    layout.value = lastUniqueById;
  } else {
    cr.value?.addCard(card);
  }
  editView.value = null;
  state.openAddPanel = false;
};

const add = () => {
  editView.value = null;
  state.cardData = null;
  state.openAddPanel = true;
};
const edit = (view: ICardView) => {
  editView.value = view;
  state.cardData = view.data || null;
  state.openAddPanel = true;
};

watch(
  () => layout.value,
  () => {
    if (webChartConfig?.value) {
      webChartConfig.value = layout.value as any;
    }
  }
);

onMounted(fetchBroad);
</script>

<template>
  <div class="w-full px-5 py-5">
    <NSpace align="center">
      <NButton @click="add">
        <SvgIcon icon="material-symbols:add" class="mr-0.5 text-lg" />
        {{ $t('generate.add-chart') }}
      </NButton>
    </NSpace>
    <div class="mb-2 mt-2 h-2px bg-[#f6f9f8]" />
    <div v-if="!layout.length" class="mt-20 text-center text-gray-500 dark:text-gray-400">
      <NEmpty :description="$t('common.componentsAddedYet')"></NEmpty>
    </div>
    <CardTemplateRender
      ref="cr"
      v-model:layout="layout"
      :is-app="props.isApp"
      :col-num="12"
      :default-card-col="4"
      :row-height="65"
      @edit="edit"
    />
    <AddTemplateCard v-model:open="state.openAddPanel" :data="state.cardData" @save="insertCard" />
  </div>
</template>

<style lang="scss" scoped>
.panel {
  @apply border border-transparent;
}
</style>
