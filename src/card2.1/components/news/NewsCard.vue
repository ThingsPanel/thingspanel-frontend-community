<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { createLogger } from '@/utils/logger'
import { $t } from '@/locales'
import { tenantNum } from '@/service/api'
import GradientBg from '../tenant-count/GradientBg.vue'

defineOptions({ name: 'NewsCard' })

// 组件属性
interface Props {
  title?: string
  unit?: string
  colors?: string[]
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '消息总数',
  unit: '条',
  colors: ['#fcbc25', '#f68057'],
  icon: 'fa-envelope'
})

const logger = createLogger('News')

const cardData = ref<any>({
  id: 'trade',
  title: props.title,
  value: 0,
  unit: props.unit,
  colors: props.colors,
  icon: props.icon
})

// 获取数据
const getData: () => void = async () => {
  try {
    const response: { data: any } = await tenantNum()
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

onMounted(() => {
  // 调用 getData 函数
  getData()
})
</script>

<template>
  <GradientBg class="access" :start-color="cardData.colors[0]" :end-color="cardData.colors[1]">
    <h3 class="text-16px">{{ cardData.title }}</h3>
    <div class="icon-items flex justify-between pt-30px">
      <SvgIcon :icon="cardData.icon" class="text-32px" />
      <CountTo
        :prefix="cardData.unit"
        :start-value="1"
        :end-value="cardData.value"
        class="text-30px text-white dark:text-dark"
      />
    </div>
  </GradientBg>
</template>

<style scoped>
.access {
  width: 100%;
  height: 100%;
  min-width: max-content;
  min-height: max-content;
}

.icon-items {
  align-items: center;
}
</style>
