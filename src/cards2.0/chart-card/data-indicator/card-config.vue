<script lang="ts" setup>
import { inject, onMounted } from 'vue';
import type { CardData, IConfigCtx } from '@/components/tp-kan-ban/kan-ban';
import CardBaseForm from '@/cards2.0/modules/card-base-form.vue';
import { $t } from '@/locales';
import CardDataSourceForm from '@/cards2.0/modules/card-data-source-form.vue';
import icons from './icon';

const props = defineProps<{
  data: CardData; // props.data 是 CardData 类型
}>();
const ctx = inject<IConfigCtx>('kan-ban-config-ctx')!;
const changeCtxConfig = (key: string, data: any) => {
  ctx.config[key] = { ...data };
};
onMounted(() => {
  // 初始化看板配置为传入的 props.data.config
  ctx.config = props?.data?.config;
});
</script>

<template>
  <n-tabs
    class="card-tabs"
    default-value="basic"
    size="large"
    animated
    pane-wrapper-style="margin: 0 -4px"
    pane-style="padding-left: 4px; padding-right: 4px; box-sizing: border-box;"
  >
    <!-- 基础配置标签页 必须有-->
    <n-tab-pane name="basic" tab="基础配置">
      <!-- 嵌入 CardBaseForm 组件，传递基础配置数据和修改配置的方法 -->
      <CardBaseForm :default-basis-data="props.data.config.basis" :change-ctx-config="changeCtxConfig" />
    </n-tab-pane>
    <n-tab-pane name="source" tab="数据源">
      <!-- 嵌入 CardDataSourceForm 组件，传递数据源配置数据和修改配置的方法 -->
      <CardDataSourceForm
        :max-source-number="props.data.sourceNumber || 9"
        :default-source-data="props.data.config.source"
        :change-ctx-config="changeCtxConfig"
      />
    </n-tab-pane>
    <!-- 卡片配置标签页 可以没有，需要自己编辑-->
    <n-tab-pane name="card-config" tab="卡片配置">
      <NForm :model="ctx.config">
        <NFormItem label="选择icon">
          <div class="flex space-x-3">
            <div
              v-for="item in icons"
              :key="item.name"
              :class="`text-lg cursor-pointer p-1 rounded border ${
                item.name === ctx.config.cardUI.icon ? 'border-blue-500' : 'border-transparent'
              }`"
              @click="ctx.config.cardUI.icon = item.name"
            >
              <component :is="item.value" />
            </div>
          </div>
        </NFormItem>
        <NFormItem :label="$t('generate.color')">
          <NColorPicker v-model:value="ctx.config.cardUI.color" :show-alpha="false" />
        </NFormItem>
      </NForm>
    </n-tab-pane>
  </n-tabs>
</template>
