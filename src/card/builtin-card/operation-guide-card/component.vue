<script lang="ts" setup>
import { computed } from 'vue';
import { NList, NListItem, NThing, NAvatar, NIcon, NEllipsis, NEmpty } from 'naive-ui'; // 导入 Naive UI 组件
import { ChevronForwardOutline } from '@vicons/ionicons5'; // 导入图标
import type { ICardData } from '@/components/panel/card';
import { $t } from '@/locales';

const props = defineProps<{
  card: ICardData;
}>();

// 使用 computed 使 guideList 响应 props 的变化
const guideList = computed(() => {
  // console.log('[Component] Computed guideList evaluating. props.card.config.guideList:', JSON.stringify(props.card?.config?.guideList));
  return props.card?.config?.guideList || [];
});

// 计算属性获取颜色配置，提供默认值
const serialBgColor = computed(() => props.card?.config?.serialBgColor || '#2080f0');
const itemBgColor = computed(() => props.card?.config?.itemBgColor || '#F3F3F5');
const itemHoverBgColor = computed(() => props.card?.config?.itemHoverBgColor || '#EDEDFF');
const titleColor = computed(() => props.card?.config?.titleColor || '#333639');
const descriptionColor = computed(() => props.card?.config?.descriptionColor || '#666');

const navigateTo = (link: string) => {
  if (link && link !== '#') {
    // window.open(link, '_blank'); // 在新标签页打开链接
    window.location.href = link; // 在当前页面导航
  }
};
</script>

<template>
  <div class="guide-container h-full p-3 flex flex-col"> <!-- 调整 padding 和 flex 布局 -->
    <!-- 使用 card.operationGuide 作为内部标题 -->
    <h3 class="internal-title mb-3 font-semibold text-lg">{{ $t('card.operationGuide') }}</h3>

    <NList v-if="guideList.length > 0" hoverable clickable class="flex-1 overflow-auto bg-[#00000000]"> <!-- 移除 bordered, 添加 flex-1 和 overflow -->
      <NListItem
        v-for="(item, index) in guideList"
        :key="index"
        @click="navigateTo(item.link)"
  
        :style="{
          backgroundColor: itemBgColor, // 应用列表项背景色
          '--item-hover-bg-color': itemHoverBgColor, // 设置 CSS 变量给 hover 使用
          '--title-color': titleColor,
          '--description-color': descriptionColor
        }"
      >
        <NThing >
          <template #avatar>
            <!-- 使用 NAvatar 显示圆形序号 -->
            <NAvatar circle :color="serialBgColor"> <!-- 应用序号背景色 -->
              <span style="color: white">{{ index + 1 }}</span>
            </NAvatar>
          </template>
          
            <template #header>
              <!-- Wrap title with NEllipsis, use $t with titleKey -->
              <NEllipsis :line-clamp="1" :title="$t(item.titleKey)"> 
              {{ $t(item.titleKey) }}
            </NEllipsis>
          </template>
          <template #header-extra v-if="index===0" >
            <!-- 右侧箭头图标 -->
            <NButton @click="navigateTo(item.link)" type="primary" text style="margin-bottom: 12px;">
                  前往添加<NIcon :component="ChevronForwardOutline" color="#2080f0" />
                </NButton>
          </template>
          <template #description>
            <!-- Wrap description with NEllipsis, use $t with descriptionKey -->
            <NEllipsis :line-clamp="2" :title="$t(item.descriptionKey)"> 
                 {{ $t(item.descriptionKey) }}  
            </NEllipsis>
          </template>
        </NThing>
      </NListItem>
    </NList>
    <div v-else class="flex-1 flex items-center justify-center">
       <NEmpty :description="$t('card.noData')" />
    </div>
  </div>
</template>

<style scoped>
.internal-title {
  /* 可以根据需要添加标题样式 */
  color: var(--n-title-text-color); /* 使用 Naive UI 变量 */
}
/* 移除之前的样式，Naive UI 会处理大部分 */
.guide-container :deep(.n-list-item) {
  margin-bottom: 12px;
  border-radius: 8px;
  padding: 12px;
  transition: background-color 0.3s;
  /* Add flex alignment for centering avatar */
  display: flex; /* Needed for align-items */
  align-items: center; 
}
/* Ensure NThing takes available space */
.guide-container :deep(.n-list-item .n-thing) {
  flex: 1; /* Allow NThing to grow */
}

/* 应用 hover 颜色 */
.guide-container :deep(.n-list-item):hover {
  background-color: var(--item-hover-bg-color) !important; /* 使用 CSS 变量 */
}
/* Target the NEllipsis component specifically within the NThing header */
.guide-container :deep(.n-thing-header .n-ellipsis) {
    font-weight: 600;
    color: var(--title-color); /* Apply the CSS variable here */
}

.guide-container :deep(.n-thing-main__description) {
    font-size: 13px;
    color: var(--description-color);
}
</style>