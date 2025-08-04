<script lang="ts" setup>
import { ref, watch } from 'vue'
import type { ICardData } from '@/components/panel/card'
import { attributeDataPub, commandDataPub, telemetryDataPub } from '@/service/api/device'
import { createLogger } from '@/utils/logger'
import { $t } from '@/locales'

const logger = createLogger('Control')
// Props接收传入的ICardData对象
const props = defineProps<{
  card: ICardData
}>()
const detail: any = ref('0')

// 从props.card.config中获取按钮配置信息
const configOptions = ref<Array<{ label: string; value: string | number }>>([
  { label: $t('card.heating'), value: 'heat' },
  { label: $t('card.cooling'), value: 'cool' },
  { label: $t('card.ventilate'), value: 'fan' },
  { label: $t('card.automatic'), value: 'auto' }
])

watch(
  () => props.card.config.btOptions,
  () => {
    configOptions.value = props.card?.config?.btOptions || [
      { label: $t('card.heating'), value: 'heat' },
      { label: $t('card.cooling'), value: 'cool' },
      { label: $t('card.ventilate'), value: 'fan' },
      { label: $t('card.automatic'), value: 'auto' }
    ]
  },
  { immediate: true, deep: true }
)

defineExpose({
  updateData: (_deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    // Only update detail value when data[metricsId] is not undefined, null or ''
    if (!metricsId || data[metricsId] === undefined || data[metricsId] === null || data[metricsId] === '') {
      logger.warn(`No data returned from websocket for ${metricsId}`)
      return
    }
    detail.value = metricsId ? `${data[metricsId]}` : '0'
  }
})

const toRealValue: (inputValue: string) => any = (inputValue: string) => {
  const dataType = props?.card?.dataSource?.deviceSource?.[0]?.metricsDataType
  if (dataType === 'number') {
    return Number.parseFloat(inputValue)
  } else if (dataType === 'boolean') {
    return Boolean(inputValue)
  }
  return inputValue
}

// 处理点击按钮的逻辑
const handleClick = async (value: string | number) => {
  detail.value = value
  const deviceSource = props.card?.dataSource?.deviceSource?.[0]
  const device_id = deviceSource?.deviceId ?? ''
  const metricsId = deviceSource?.metricsId ?? ''
  const metricsType = deviceSource?.metricsType ?? ''

  if (device_id && metricsId) {
    const payload = {
      device_id,
      value: JSON.stringify({
        [metricsId]: toRealValue(value)
      })
    }

    try {
      if (metricsType === 'attributes') {
        await attributeDataPub(payload)
      } else if (metricsType === 'telemetry') {
        await telemetryDataPub(payload)
      } else if (metricsType === 'command') {
        await commandDataPub(payload)
      }
      window.$message?.success($t('card.dataSentSuccess'))
    } catch (error) {
      window.$message?.error($t('card.dataSentFail'))
    }
  }
}
</script>

<template>
  <div class="ac-card">
    <!-- 上方的文字通过props.card.dataSource.deviceSource[0]?.name获取 -->
    <div class="ac-title">
      {{ props.card?.dataSource?.deviceSource[0]?.metricsName || $t('card.airConditioningStatus') }}
    </div>

    <!-- 按钮组 -->
    <div class="ac-buttons">
      <div
        v-for="(option, index) in configOptions"
        :key="index"
        class="ac-button"
        :class="{ active: detail === option.value }"
        @click="handleClick(option.value)"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ac-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  width: 100%;

  .ac-title {
    font-size: 16px;
    margin-bottom: 16px;
    text-align: center;
  }

  .ac-buttons {
    display: flex;
    gap: 8px;

    .ac-button {
      padding: 8px 16px;
      border-radius: 4px;
      background-color: #e0e0e0;
      cursor: pointer;
      transition: background-color 0.3s;
      font-size: 14px;

      &.active {
        background-color: #6f42c1; /* 选中状态背景色 */
        color: white;
      }

      &:hover {
        background-color: #ccc;
      }
    }
  }
}
</style>
