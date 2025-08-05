<script setup lang="ts">
import { ref, onMounted, computed, defineComponent, h } from 'vue'
import { createLogger } from '@/utils/logger'
import { $t } from '@/locales'
import { getAlarmCount } from '@/service/api'

const logger = createLogger('AlarmCountCard')

defineOptions({ name: 'AlarmCountCard' })

// 组件属性定义
interface Props {
  title?: string
  unit?: string
  colors?: [string, string]
  icon?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: $t('card.alarmCount'),
  unit: $t('card.alarmUnit'),
  colors: ['#f97316', '#ef4444'],
  icon: 'fa-bell'
})

const cardData = ref({
  value: 0,
  loading: true,
  error: false
})

// 获取告警数据
const fetchAlarmData = async () => {
  try {
    cardData.value.loading = true
    cardData.value.error = false

    const response: { data: any } = await getAlarmCount()

    if (response && response.data && typeof response.data.alarm_device_total === 'number') {
      cardData.value.value = response.data.alarm_device_total
    } else {
      logger.error('告警数量数据格式错误:', response)
      cardData.value.value = 0
      cardData.value.error = true
    }
  } catch (error) {
    logger.error('获取告警数量数据失败:', error)
    cardData.value.value = 0
    cardData.value.error = true
  } finally {
    cardData.value.loading = false
  }
}

// 渐变背景组件
const GradientBg = defineComponent({
  name: 'GradientBg',
  props: {
    startColor: { type: String, default: '#56cdf3' },
    endColor: { type: String, default: '#719de3' }
  },
  setup(props, { slots }) {
    const gradientStyle = computed(() => `linear-gradient(to bottom right, ${props.startColor}, ${props.endColor})`)

    return () =>
      h(
        'div',
        {
          class: 'rounded-8px p-16px text-white',
          style: { backgroundImage: gradientStyle.value }
        },
        slots.default?.()
      )
  }
})

onMounted(() => {
  fetchAlarmData()
})
</script>

<template>
  <GradientBg :start-color="props.colors[0]" :end-color="props.colors[1]" class="alarm-count-card">
    <h3 class="text-16px">{{ props.title }}</h3>
    <div class="icon-items flex justify-between pt-30px">
      <SvgIcon :icon="props.icon" class="text-32px" />
      <div v-if="cardData.loading" class="text-30px text-white dark:text-dark">
        <div class="animate-spin">⏳</div>
      </div>
      <div v-else-if="cardData.error" class="text-30px text-white dark:text-dark">
        <div class="text-red-200">⚠️</div>
      </div>
      <CountTo
        v-else
        :prefix="props.unit"
        :start-value="0"
        :end-value="cardData.value"
        class="text-30px text-white dark:text-dark"
      />
    </div>
  </GradientBg>
</template>

<style scoped>
.alarm-count-card {
  width: 100%;
  height: 100%;
  min-width: max-content;
  min-height: max-content;
}

.icon-items {
  align-items: center;
}
</style>
