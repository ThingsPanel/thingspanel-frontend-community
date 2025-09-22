<template>
  <GenericCard
    :start-color="cardData.colors[0]"
    :end-color="cardData.colors[1]"
  >
    <template #title>
      {{ cardData.title }}
    </template>
    <template #icon>
      <SvgIcon :icon="cardData.icon" class="text-32px" />
    </template>
    <template #value>
      <CountTo
        :prefix="cardData.unit"
        :start-value="1"
        :end-value="cardData.value"
        class="text-30px text-white dark:text-dark"
      />
    </template>
  </GenericCard>
</template>

<script setup lang="ts">
/**
 * 消息资讯组件，与原版保持1:1功能匹配
 */
import { ref } from 'vue'
import { $t } from '@/locales'
import { tenantNum } from '@/service/api'
import { createLogger } from '@/utils/logger'
import GenericCard from '@/card2.1/components/common/generic-card/component.vue'

const logger = createLogger('News') // 与原版保持一致的logger名称

// 卡片数据配置，与原版保持1:1一致
const cardData = ref({
  id: 'trade', // 与原版保持一致
  title: $t('card.msgTotal'),
  value: 0,
  unit: $t('card.msgUnit'),
  colors: ['#fcbc25', '#f68057'],
  icon: 'fa-envelope' // 与原版保持一致
})

// 获取数据，与原版保持1:1一致
const getData = async () => {
  try {
    const response = await tenantNum()
    if (response.data) {
      cardData.value.value = response.data?.msg ?? 0
    } else {
      logger.error('Data does not contain the required properties or they are not numbers.')
    }
  } catch (error) {
    // 处理请求数据时的错误
    logger.error('Error fetching data:')
  }
}

// 调用 getData 函数，与原版保持一致
getData()

defineOptions({
  name: 'NumCard' // 与原版保持一致的组件名
})
</script>

<style scoped>
/* 所有样式都由 GenericCard 处理，这里无需额外样式 */
</style>