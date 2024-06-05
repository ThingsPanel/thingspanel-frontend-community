<script setup lang="ts">
import type { ICardData, ICardView } from '@/components/panel/card';
import './gird.css';
import { $t } from '@/locales';
import CardTemplateItem from './card-template-item.vue';

const props = defineProps<{
  layout: ICardView[];
  isApp: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:layout', layout: ICardView[] | any): void;
  (e: 'edit', view: ICardView): void;
  // (e: 'remove', view: ICardView): void;
}>();

defineExpose({
  addCard: (data: ICardData) => {
    const layout = props.layout;
    const foundIndex = layout.findIndex(item => item?.data?.cardId === data.cardId);
    if (foundIndex !== -1) {
      layout[foundIndex].data = data;
    } else {
      layout.push({
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        i: 0,
        data
      });
    }
    emit('update:layout', [...layout]);
  }
});

const removeLayout = (i: any) => {
  emit(
    'update:layout',
    props.layout.filter(item => item.data?.cardId !== i)
  );
};
</script>

<template>
  <div :class="props.isApp ? 'screena overflow-auto h-[600px]' : 'window-screen'">
    <div :class="props.isApp ? 'm-auto w-480px smartphone overflow-auto' : 'w-full relative'">
      <n-grid :cols="props.isApp ? 1 : 2" x-gap="12" y-gap="12" class="screena relative w-full overflow-auto">
        <n-gi v-for="item in layout" :key="item?.data?.cardId">
          <div class="relative h-full">
            <NIcon
              class="absolute right-8 top-1.5 z-50 cursor-pointer cursor-pointer opacity-50 duration-200 hover:opacity-100"
              @click="emit('edit', item)"
            >
              <SvgIcon icon="uil:setting" class="text-base" />
            </NIcon>
            <NPopconfirm
              :show-icon="false"
              :negative-button-props="{ size: 'tiny' }"
              :positive-button-props="{ size: 'tiny' }"
              :on-positive-click="() => removeLayout(item?.data?.cardId)"
            >
              <template #trigger>
                <NIcon
                  class="absolute right-2 top-1.5 z-50 cursor-pointer cursor-pointer opacity-50 duration-200 hover:opacity-100"
                >
                  <SvgIcon icon="material-symbols:delete-outline" class="text-base" />
                </NIcon>
              </template>
              <span>{{ $t('generate.confirm-delete-dashboard') }}</span>
            </NPopconfirm>
            <CardTemplateItem :data="item.data!" />
          </div>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>

<style scoped>
.smartphone {
  width: 480px; /* 设置手机外框的宽度 */
  height: 960px; /* 设置手机外框的高度 */
  border: 16px solid black; /* 设置边框模拟手机边框 */
  border-radius: 32px; /* 设置边框圆角模拟手机的圆角 */
  display: flex; /* 使用flex布局 */
  justify-content: center; /* 水平居中 */
  align-items: start; /* 垂直居中 */
  background: #f3f3f3; /* 设置背景颜色 */
  box-shadow: 0 0 10px #999; /* 添加阴影效果 */
}

.screen {
  width: 90%; /* 设置屏幕宽度为手机宽度的90% */
  height: 90%; /* 设置屏幕高度为手机高度的90% */
  background: white; /* 设置屏幕背景颜色为白色 */
  border-radius: 24px; /* 设置屏幕边框圆角 */
  display: flex; /* 使用flex布局 */
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  color: black; /* 设置文本颜色 */
  font-family: Arial, sans-serif; /* 设置字体 */
}

/* 定制滚动条的整体样式 */
.screena::-webkit-scrollbar {
  width: 4px; /* 滚动条宽度 */
}

/* 定制滚动条滑块（thumb）的样式 */
.screena::-webkit-scrollbar-thumb {
  background: #888; /* 滚动条滑块颜色 */
  border-radius: 4px; /* 滚动条滑块圆角 */
}

/* 定制滚动条轨道（track）的样式 */
.screena::-webkit-scrollbar-track {
  background: #f0f0f0; /* 滚动条轨道颜色 */
  border-radius: 4px; /* 滚动条轨道圆角 */
}
</style>
