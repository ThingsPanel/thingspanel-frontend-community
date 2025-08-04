<template>
  <div class="access-card">
    <GradientBg 
      class="access" 
      :start-color="cardData.colors[0]" 
      :end-color="cardData.colors[1]"
    >
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { createLogger } from '@/utils/logger'
import { $t } from '@/locales'
import { sumData, totalNumber } from '@/service/api'
import { GradientBg } from './components'

// 定义组件属性
interface Props {
  config?: Record<string, any>
  data?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  data: () => ({})
})

const authStore = useAuthStore()
const logger = createLogger('Access')

// 卡片数据
const cardData = ref<any>({
  id: 'visit',
  title: $t('card.deviceTotal'),
  value: 0,
  unit: $t('card.deviceUnit'),
  colors: ['#ec4786', '#b955a4'],
  icon: 'ant-design:bar-chart-outlined'
})

// 从配置中获取数据
const getDataFromConfig = () => {
  if (props.data?.device_total !== undefined) {
    cardData.value.value = props.data.device_total
  }
  
  // 从配置中获取自定义设置
  if (props.config?.title) {
    cardData.value.title = props.config.title
  }
  if (props.config?.unit) {
    cardData.value.unit = props.config.unit
  }
  if (props.config?.colors) {
    cardData.value.colors = props.config.colors
  }
  if (props.config?.icon) {
    cardData.value.icon = props.config.icon
  }
}

// 获取数据
const getData: () => void = async () => {
  try {
    // 如果配置了数据源，优先使用配置的数据
    if (props.data?.device_total !== undefined) {
      cardData.value.value = props.data.device_total
      return
    }
    
    // 否则使用原有的 API 逻辑
    const response: { data: any } =
      authStore?.$state.userInfo.authority === 'TENANT_ADMIN' ? await sumData() : await totalNumber()
    if (response.data) {
      cardData.value.value = response.data.device_total
    } else {
      logger.error('Data does not contain the required properties or they are not numbers.')
    }
  } catch (error) {
    logger.error('Error fetching data:', error)
  }
}

// 组件挂载时获取数据
onMounted(() => {
  getDataFromConfig()
  if (props.data?.device_total === undefined) {
    getData()
  }
})
</script>

<style scoped>
.access-card {
  width: 100%;
  height: 100%;
}

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