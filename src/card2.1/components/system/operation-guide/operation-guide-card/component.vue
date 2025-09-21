<template>
  <div class="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
    <!-- 卡片标题栏 -->
    <div class="flex items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
          <Icon icon="mdi:compass-outline" class="text-lg text-indigo-600 dark:text-indigo-400" />
        </div>
        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
          {{ $t('card.operationGuide') }}
        </h3>
      </div>
    </div>

    <!-- 指引列表内容 -->
    <div class="flex-1 p-4 overflow-hidden">
      <div v-if="guideList.length > 0" class="h-full overflow-y-auto scrollbar-thin">
        <div class="space-y-3">
          <div
            v-for="(item, index) in guideList"
            :key="index"
            class="group bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 cursor-pointer transition-all duration-200 hover:shadow-sm"
            @click="navigateTo(item.link)"
          >
            <div class="flex items-start space-x-3">
              <!-- 序号标识 -->
              <div
                class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                :style="{ backgroundColor: serialBgColor }"
              >
                {{ index + 1 }}
              </div>

              <!-- 内容区域 -->
              <div class="flex-1 min-w-0">
                <!-- 标题 -->
                <div class="flex items-center justify-between mb-1">
                  <h4
                    class="font-medium text-sm truncate"
                    :style="{ color: titleColor }"
                    :title="$t(item.titleKey)"
                  >
                    {{ $t(item.titleKey) }}
                  </h4>
                  <div v-if="item.link" class="flex-shrink-0 ml-2">
                    <div class="flex items-center text-blue-600 dark:text-blue-400 text-xs font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                      <span class="mr-1">{{ $t('card.view') }}</span>
                      <Icon icon="mdi:chevron-right" class="w-3 h-3" />
                    </div>
                  </div>
                </div>

                <!-- 描述 -->
                <div
                  class="text-xs leading-relaxed line-clamp-2"
                  :style="{ color: descriptionColor }"
                  :title="$t(item.descriptionKey)"
                >
                  {{ $t(item.descriptionKey) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无数据状态 -->
      <div v-else class="h-full flex flex-col items-center justify-center text-center">
        <div class="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
          <Icon icon="mdi:book-open-outline" class="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ $t('card.noData') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 操作指引卡片组件
 * 根据用户角色显示相应的操作指引列表
 */
import { computed, ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { $t } from '@/locales'

// 组件属性（如果需要从外部传入配置）
interface GuideItem {
  titleKey: string
  descriptionKey: string
  link?: string
}

interface GuideConfig {
  guideList?: GuideItem[]
  guideListAdmin?: GuideItem[]
  serialBgColor?: string
  titleColor?: string
  descriptionColor?: string
}

// 响应式数据
const isAdmin = ref(false)

// 默认配置
const defaultConfig: GuideConfig = {
  guideList: [
    {
      titleKey: 'guide.deviceManagement.title',
      descriptionKey: 'guide.deviceManagement.description',
      link: '/device/manage'
    },
    {
      titleKey: 'guide.dataVisualization.title',
      descriptionKey: 'guide.dataVisualization.description',
      link: '/dashboard/panel'
    },
    {
      titleKey: 'guide.alarmSettings.title',
      descriptionKey: 'guide.alarmSettings.description',
      link: '/alarm/warning-message'
    }
  ],
  guideListAdmin: [
    {
      titleKey: 'guide.userManagement.title',
      descriptionKey: 'guide.userManagement.description',
      link: '/system/user'
    },
    {
      titleKey: 'guide.systemSettings.title',
      descriptionKey: 'guide.systemSettings.description',
      link: '/system/settings'
    },
    {
      titleKey: 'guide.tenantManagement.title',
      descriptionKey: 'guide.tenantManagement.description',
      link: '/tenant/management'
    },
    {
      titleKey: 'guide.deviceManagement.title',
      descriptionKey: 'guide.deviceManagement.description',
      link: '/device/manage'
    }
  ],
  serialBgColor: '#2080f0',
  titleColor: '#333639',
  descriptionColor: '#666'
}

/**
 * 检查用户角色
 */
const checkUserRole = () => {
  try {
    const userInfoRaw = localStorage.getItem('userInfo')
    if (userInfoRaw) {
      const userInfo = JSON.parse(userInfoRaw)
      // 检查角色数组是否包含 'SYS_ADMIN'
      if (Array.isArray(userInfo?.roles) && userInfo.roles.includes('SYS_ADMIN')) {
        isAdmin.value = true
      } else {
        isAdmin.value = false
      }
    } else {
      isAdmin.value = false
    }
  } catch (error) {
    console.error('读取用户信息失败:', error)
    isAdmin.value = false
  }
}

// 计算属性
const guideList = computed(() => {
  if (isAdmin.value) {
    return defaultConfig.guideListAdmin || []
  } else {
    return defaultConfig.guideList || []
  }
})

const serialBgColor = computed(() => defaultConfig.serialBgColor || '#2080f0')
const titleColor = computed(() => defaultConfig.titleColor || '#333639')
const descriptionColor = computed(() => defaultConfig.descriptionColor || '#666')

/**
 * 导航到指定链接
 */
const navigateTo = (link?: string) => {
  if (link && link !== '#') {
    window.location.href = link
  }
}

onMounted(() => {
  checkUserRole()
})

defineOptions({
  name: 'OperationGuideCard21'
})
</script>

<style scoped>
/* 自定义滚动条样式 */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.300');
  border-radius: 4px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.gray.400');
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb {
  background-color: theme('colors.gray.600');
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background-color: theme('colors.gray.500');
}

.scrollbar-thin::-webkit-scrollbar-track {
  background-color: transparent;
}

/* 多行文本省略 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 滚动条在火狐浏览器中的样式 */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.gray.300') transparent;
}

.dark .scrollbar-thin {
  scrollbar-color: theme('colors.gray.600') transparent;
}
</style>