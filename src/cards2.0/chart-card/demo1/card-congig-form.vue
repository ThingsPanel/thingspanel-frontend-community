<script setup lang="ts">
import { inject, onMounted } from 'vue';
import CardBaseForm from '@/cards2.0/modules/card-base-form.vue';
import CardDataSourceForm from '@/cards2.0/modules/card-data-source-form.vue';
import type { CardData, IConfigCtx } from '@/components/tp-kan-ban/kan-ban';
import { $t } from '@/locales';

// 控制台打印多语言函数，用于调试
console.log($t);

// 定义组件接收的 props
const props = defineProps<{
  data: CardData; // props.data 是 CardData 类型
}>();

// 固定写法开始
// 通过 inject 获取全局上下文对象，这里的 'kan-ban-config-ctx' 是在祖先组件中提供的
const ctx = inject<IConfigCtx>('kan-ban-config-ctx')!;
// ctx.config 会传递给看板编辑器
// 定义修改看板配置的方法
const changeCtxConfig = (key: string, data: any) => {
  ctx.config[key] = { ...data };
}; // 改变 ctx.config 的方法
// 固定写法结束

// 组件挂载时执行
onMounted(() => {
  // 初始化看板配置为传入的 props.data.config
  ctx.config = props.data.config;
});
</script>

<template>
  <!-- 使用 Naive UI 的标签页组件 -->
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
    <!-- 数据源配置标签页 可以没有，直接按下面的引入就行-->
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
      <!-- 需要用户编写配置的区域 -->
      <NForm :model="ctx.config.cardUI">
        <NFormItem label="字体大小">
          <!-- 绑定输入框与卡片 UI 配置 -->
          <n-input-number v-model:value="ctx.config.cardUI.textNUmber" :min="12" :max="50" />
        </NFormItem>
      </NForm>
    </n-tab-pane>
  </n-tabs>
</template>

<style scoped></style>
