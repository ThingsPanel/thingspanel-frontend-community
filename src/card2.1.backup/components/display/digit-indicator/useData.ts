import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { getAttributeDataSet, telemetryDataCurrentKeys } from '@/service/api/device'
import { createLogger } from '@/utils/logger'

const logger = createLogger('DigitIndicator')

interface DigitIndicatorProps {
  properties?: any
  metadata?: any
}

export function useDigitIndicatorData(props: DigitIndicatorProps) {
  const detail = ref<string>('')
  const unit = ref<string>('%')
  const fontSize = ref('14px')
  const cardRef = ref<HTMLDivElement | null>(null)
  let resizeObserver: ResizeObserver | null = null

  // 设置数据源
  const setSeries = async (dataSource: any) => {
    if (!dataSource?.deviceSource?.[0]) return

    const { metricsType, deviceId, metricsId } = dataSource.deviceSource[0]

    try {
      if (metricsType === 'telemetry' && deviceId && metricsId) {
        const detailValue = await telemetryDataCurrentKeys({
          device_id: deviceId,
          keys: metricsId
        })
        unit.value = detailValue?.data?.[0]?.unit ?? '%'
        detail.value = detailValue?.data?.[0]?.value ?? ''
      } else if (metricsType === 'attributes' && deviceId && metricsId) {
        const res = await getAttributeDataSet({ device_id: deviceId })
        const attributeData = res.data.find((item: any) => item.key === metricsId)
        detail.value = attributeData?.value ?? ''
        unit.value = attributeData?.unit ?? '%'
      }
    } catch (error) {
      logger.error('获取设备数据失败:', error)
    }
  }

  // 处理容器大小变化
  const handleResize = (entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect
      const newFontSize = `${Math.min(width, height) / 10}px`
      fontSize.value = newFontSize
    }
  }

  // 更新数据
  const updateData = (deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    // 只有当数据有效时才更新
    if (!metricsId || data[metricsId] === undefined || data[metricsId] === null || data[metricsId] === '') {
      logger.warn(`No data returned from websocket for ${metricsId}`)
      return
    }
    detail.value = data[metricsId]
  }

  // 初始化数据
  const initializeData = () => {
    const dataSource = props.metadata?.card2Data?.dataSource
    if (dataSource) {
      setSeries(dataSource)
    }
  }

  // 监听数据源变化
  watch(
    () => props.metadata?.card2Data?.dataSource?.deviceSource,
    () => {
      detail.value = ''
      unit.value = ''
      const dataSource = props.metadata?.card2Data?.dataSource
      if (dataSource) {
        setSeries(dataSource)
      }
    },
    { deep: true }
  )

  onMounted(() => {
    initializeData()

    // 设置 ResizeObserver
    if (cardRef.value) {
      resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(cardRef.value)
    }
  })

  onBeforeUnmount(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  })

  return {
    detail,
    unit,
    fontSize,
    cardRef,
    updateData,
    setSeries,
    initializeData
  }
}
