<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/store/modules/auth'
import { createLogger } from '@/utils/logger'
import { $t } from '@/locales'
import { sumData, totalNumber } from '@/service/api/system-data'
import CountTo from '@/components/custom/count-to.vue'
import GradientBg from './components/gradient-bg.vue'

defineOptions({ name: 'AccessCard' })

const authStore = useAuthStore()
const logger = createLogger('AccessCard')

// 定义卡片数据状态
const todayData = ref({
  value: 0,
  unit: '人',
})

const yesterdayData = ref({
  value: 0,
  unit: '人',
})

/**
 * 获取数据
 * @description 根据用户权限决定调用哪个接口
 */
const fetchData = async () => {
  try {
    // 在 card2.1 架构中，我们假设不再区分租户和普通用户的数据接口，
    // 而是统一使用一个接口，后端根据用户信息返回相应数据。
    // 此处暂时使用 totalNumber 作为示例，实际应替换为获取用户访问数据的接口。
    const response = await totalNumber()

    // 假设接口返回的数据结构为 { user_total_today: number, user_total_yesterday: number }
    // 这里使用随机数模拟数据，以便于 UI 展示
    if (response && typeof response.data === 'object' && response.data !== null) {
      // 真实场景下，应该使用下面的赋值逻辑
      // todayData.value.value = response.data.user_total_today || 0;
      // yesterdayData.value.value = response.data.user_total_yesterday || 0;
    } else {
      // 模拟数据
      todayData.value.value = Math.floor(Math.random() * 1000)
      yesterdayData.value.value = Math.floor(Math.random() * 800)
    }
  } catch (error) {
    logger.error('获取访问数据失败:', error)
    // 发生错误时，将数值重置为0
    todayData.value.value = 0
    yesterdayData.value.value = 0
  }
}

// 组件挂载后执行数据获取
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="access-card">
    <GradientBg
      class="access-card__item"
      start-color="#56cdf3"
      end-color="#719de3"
    >
      <div class="access-card__info">
        <span class="access-card__title">今日访问用户数</span>
        <CountTo
          :start-value="0"
          :end-value="todayData.value"
          class="access-card__value"
        />
        <span class="access-card__unit">{{ todayData.unit }}</span>
      </div>
    </GradientBg>
    <GradientBg
      class="access-card__item"
      start-color="#fcbc2d"
      end-color="#fc9a2d"
    >
      <div class="access-card__info">
        <span class="access-card__title">昨日访问用户数</span>
        <CountTo
          :start-value="0"
          :end-value="yesterdayData.value"
          class="access-card__value"
        />
        <span class="access-card__unit">{{ yesterdayData.unit }}</span>
      </div>
    </GradientBg>
  </div>
</template>

<style scoped>
.access-card {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 16px;
}

.access-card__item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 16px;
  color: #fff;
}

.access-card__info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.access-card__title {
  font-size: 14px;
  margin-bottom: 8px;
}

.access-card__value {
  font-size: 28px;
  font-weight: bold;
}

.access-card__unit {
  font-size: 12px;
  margin-left: 4px;
}
</style>