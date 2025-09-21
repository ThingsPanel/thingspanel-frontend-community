<template>
  <GenericCard
    :start-color="cardData.colors[0]"
    :end-color="cardData.colors[1]"
  >
    <template #title>
      {{ cardData.title }}
    </template>
    <template #icon>
      <Icon icon="mdi:email-outline" class="text-white" />
    </template>
    <template #value>
      <div class="flex items-center gap-2">
        <CountTo
          :start-value="0"
          :end-value="cardData.value"
          :duration="1500"
          class="text-white font-bold"
        />
        <span class="text-white text-lg opacity-90">{{ cardData.unit }}</span>
      </div>
    </template>
  </GenericCard>
</template>

<script setup lang="ts">
/**
 * 消息资讯组件
 * 显示系统消息总数统计，使用渐变背景和动态数字效果
 */
import { ref, onMounted } from 'vue'
import { Icon } from '@iconify/vue'
import { $t } from '@/locales'
import { tenantNum } from '@/service/api'
import { createLogger } from '@/utils/logger'
import GenericCard from '@/card2.1/components/common/generic-card/component.vue'

// CountTo 组件用于数字动效
import CountTo from '@/components/custom/count-to.vue'

const logger = createLogger('NewsCard')

// 卡片数据配置
const cardData = ref({
  id: 'news',
  title: $t('card.msgTotal'),
  value: 0,
  unit: $t('card.msgUnit'),
  colors: ['#fcbc25', '#f68057'], // 橙黄色渐变
  icon: 'mdi:email-outline'
})

/**
 * 获取消息数据
 */
const fetchData = async () => {
  try {
    const response = await tenantNum()
    if (response?.data) {
      cardData.value.value = response.data?.msg ?? 0
    } else {
      logger.error('响应数据格式不正确')
    }
  } catch (error) {
    logger.error('获取消息数据失败:', error)
    // 设置默认值以防接口失败
    cardData.value.value = 0
  }
}

onMounted(() => {
  fetchData()
})

defineOptions({
  name: 'NewsCard21'
})
</script>

<style scoped>
/* 所有样式都由 GenericCard 处理，这里无需额外样式 */
</style>