<template>
  <div class="guide-container">
    <h3 class="internal-title">{{ title }}</h3>
    <NList v-if="displayList.length > 0" hoverable clickable class="list-wrapper">
      <NListItem v-for="(item, index) in displayList" :key="index" class="list-item" @click="navigateTo(item.link)">
        <NThing>
          <template #avatar>
            <NAvatar circle :color="serialBgColor">
              <span style="color: white">{{ index + 1 }}</span>
            </NAvatar>
          </template>
          <template #header>
            <NEllipsis :line-clamp="1" :title="$t(item.titleKey)">
              {{ $t(item.titleKey) }}
            </NEllipsis>
          </template>
          <template #header-extra>
            <NButton text type="primary" @click.stop="navigateTo(item.link)">
              {{ $t('card.view') }}
              <NIcon :component="ChevronForwardOutline" />
            </NButton>
          </template>
          <template #description>
            <NEllipsis :line-clamp="2" :title="$t(item.descriptionKey)">
              {{ $t(item.descriptionKey) }}
            </NEllipsis>
          </template>
        </NThing>
      </NListItem>
    </NList>
    <div v-else class="empty-state">
      <NEmpty :description="$t('card.noData')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NList, NListItem, NThing, NAvatar, NIcon, NEllipsis, NEmpty, NButton } from 'naive-ui'
import { ChevronForwardOutline } from '@vicons/ionicons5'
import { $t } from '@/locales'
import { useData } from './useData'

interface GuideItem {
  titleKey: string
  descriptionKey: string
  link: string
}

const props = defineProps<{
  title: string
  serialBgColor: string
  guideList: GuideItem[]
  guideListAdmin: GuideItem[]
}>()

const { isAdmin } = useData()

const displayList = computed(() => {
  return isAdmin.value ? props.guideListAdmin : props.guideList
})

const navigateTo = (link: string) => {
  if (link && link !== '#') {
    window.location.href = link
  }
}
</script>

<style scoped>
.guide-container {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.internal-title {
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 18px;
  color: var(--n-title-text-color);
}
.list-wrapper {
  flex: 1;
  overflow: auto;
  background-color: transparent;
}
.list-item {
  margin-bottom: 12px;
  border-radius: 8px;
  padding: 12px;
  transition: background-color 0.3s;
  background-color: var(--n-color-embedded);
}
.list-item:hover {
  background-color: var(--n-color-embedded-hover);
}
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
