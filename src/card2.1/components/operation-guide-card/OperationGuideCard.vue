<script lang="ts" setup>
import { computed, ref, onMounted } from 'vue'
import { NList, NListItem, NThing, NAvatar, NIcon, NEllipsis, NEmpty, NButton } from 'naive-ui'
import { ChevronForwardOutline } from '@vicons/ionicons5'
import { $t } from '@/locales'

interface Props {
  title?: string
  showAdminGuides?: boolean
  showUserGuides?: boolean
  serialBgColor?: string
  itemHoverBgColor?: string
  titleColor?: string
  descriptionColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '操作向导',
  showAdminGuides: true,
  showUserGuides: true,
  serialBgColor: '#2080f0',
  itemHoverBgColor: '#EDEDFF',
  titleColor: '#333639',
  descriptionColor: '#666'
})

// --- Logic to determine user role and select guide list ---
const isAdmin = ref(false)

const checkUserRole = () => {
  try {
    const userInfoRaw = localStorage.getItem('userInfo')
    if (userInfoRaw) {
      const userInfo = JSON.parse(userInfoRaw)
      if (Array.isArray(userInfo?.roles) && userInfo.roles.includes('SYS_ADMIN')) {
        isAdmin.value = true
        console.log('User is SYS_ADMIN, using guideListAdmin.')
      } else {
        isAdmin.value = false
        console.log('User is not SYS_ADMIN, using guideList.')
      }
    } else {
      isAdmin.value = false
      console.log('UserInfo not found in localStorage, using default guideList.')
    }
  } catch (error) {
    console.error('Error reading or parsing userInfo from localStorage:', error)
    isAdmin.value = false
  }
}

// Check role when component mounts
onMounted(() => {
  checkUserRole()
})

// 默认的指南列表
const defaultGuideList = [
  {
    titleKey: 'card.operationGuideCard.guideItems.addDevice.title',
    descriptionKey: 'card.operationGuideCard.guideItems.addDevice.description',
    link: '/device/manage'
  },
  {
    titleKey: 'card.operationGuideCard.guideItems.configureDevice.title',
    descriptionKey: 'card.operationGuideCard.guideItems.configureDevice.description',
    link: '/device/manage'
  },
  {
    titleKey: 'card.operationGuideCard.guideItems.createDashboard.title',
    descriptionKey: 'card.operationGuideCard.guideItems.createDashboard.description',
    link: '/visualization/kanban'
  }
]

const defaultGuideListAdmin = [
  {
    titleKey: 'card.operationGuideAdmin.guideItems.createTenant.title',
    descriptionKey: 'card.operationGuideAdmin.guideItems.createTenant.description',
    link: '/management/user'
  },
  {
    titleKey: 'card.operationGuideAdmin.guideItems.configureNotification.title',
    descriptionKey: 'card.operationGuideAdmin.guideItems.configureNotification.description',
    link: '/management/notification'
  },
  {
    titleKey: 'card.operationGuideAdmin.guideItems.configurePlugin.title',
    descriptionKey: 'card.operationGuideAdmin.guideItems.configurePlugin.description',
    link: 'apply/plugin'
  }
]

// Modify computed property to select list based on isAdmin and props
const guideList = computed(() => {
  if (isAdmin.value && props.showAdminGuides) {
    console.log('Returning guideListAdmin:', defaultGuideListAdmin)
    return defaultGuideListAdmin
  } else if (props.showUserGuides) {
    console.log('Returning guideList:', defaultGuideList)
    return defaultGuideList
  } else {
    return []
  }
})

const navigateTo = (link: string) => {
  if (link && link !== '#') {
    window.location.href = link
  }
}
</script>

<template>
  <div class="guide-container h-full p-3 flex flex-col">
    <h3 class="internal-title mb-3 font-semibold text-lg">{{ title }}</h3>

    <NList v-if="guideList.length > 0" hoverable clickable class="flex-1 overflow-auto bg-[#00000000]">
      <NListItem
        v-for="(item, index) in guideList"
        :key="index"
        class="bg-[#f2f2f2] dark:bg-[#1f2937]"
        :style="{
          '--item-hover-bg-color': itemHoverBgColor,
          '--title-color': titleColor,
          '--description-color': descriptionColor
        }"
        @click="navigateTo(item.link)"
      >
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
            <NButton v-if="item.link" type="primary" text style="margin-bottom: 12px" @click="navigateTo(item.link)">
              {{ $t('card.view') }}
              <NIcon :component="ChevronForwardOutline" color="#2080f0" />
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
    <div v-else class="flex-1 flex items-center justify-center">
      <NEmpty :description="$t('card.noData')" />
    </div>
  </div>
</template>

<style scoped>
.internal-title {
  color: var(--n-title-text-color);
}

.guide-container :deep(.n-list-item) {
  margin-bottom: 12px;
  border-radius: 8px;
  padding: 12px;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
}

.guide-container :deep(.n-list-item .n-thing) {
  flex: 1;
}

.guide-container :deep(.n-list-item):hover {
  background-color: var(--item-hover-bg-color) !important;
}

.guide-container :deep(.n-thing-header .n-ellipsis) {
  font-weight: 600;
  color: var(--title-color);
}

.guide-container :deep(.n-thing-main__description) {
  font-size: 13px;
  color: var(--description-color);
}
</style>
