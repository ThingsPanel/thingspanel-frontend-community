<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { FormInst } from 'naive-ui'
import { NButton, NSpace, useMessage, NInputNumber, NTooltip, NIcon, NInput, NSelect, NSwitch } from 'naive-ui'
import { deviceConfigInfo, deviceDetail, deviceLocation } from '@/service/api'
import { $t } from '@/locales'
import TencentMap from './public/tencent-map.vue'
import { getCoordinateStringValidationError } from '@/utils/common/map-validator'

const props = defineProps<{
  id: string
  deviceConfigId: string
}>()

const latitude = ref('')
const longitude = ref('')
const isShow = ref(false)
const additionInfo = ref([] as ExtensionInfo[])
const extensionFormRef = ref<HTMLElement & FormInst>()

interface ExtensionInfo {
  name: string
  type: 'String' | 'Number' | 'Boolean' | 'Enum'
  default_value: string
  value?: string | number | boolean | null
  desc?: string
  enable: boolean
  options?: Array<{ label: string; value: string }>
}

const safeParseJSON = <T,>(payload: string | null | undefined, fallback: T): T => {
  if (!payload) return fallback

  try {
    return JSON.parse(payload) as T
  } catch (error) {
    console.warn('Failed to parse JSON payload:', error)
    return fallback
  }
}

const normalizeExtendedInfo = (payload: unknown): Array<{ name: string; value: any }> => {
  if (Array.isArray(payload)) {
    return payload as Array<{ name: string; value: any }>
  }

  if (payload && typeof payload === 'object') {
    return Object.entries(payload as Record<string, any>).map(([name, value]) => ({
      name,
      value
    }))
  }

  return []
}

const coerceValueByType = (value: unknown, type: ExtensionInfo['type']) => {
  if (value === null || value === undefined || value === '') {
    return undefined
  }

  switch (type) {
    case 'Number': {
      const numberValue = Number(value)
      return Number.isNaN(numberValue) ? undefined : numberValue
    }
    case 'Boolean': {
      if (typeof value === 'boolean') return value
      if (value === 'true' || value === 'false') {
        return value === 'true'
      }
      return Boolean(value)
    }
    default:
      return String(value)
  }
}

const { query } = useRoute()
const message = useMessage()

const handleSave = async () => {
  try {
    if (latitude.value && longitude.value) {
      const error = getCoordinateStringValidationError(latitude.value, longitude.value)
      if (error) {
        message.error(`缁忕含搴︽棤鏁? ${error}`)
        return
      }
    }

    if (extensionFormRef.value) {
      await extensionFormRef.value.validate()
    }

    const extentedInfoObject = additionInfo.value.reduce<Record<string, string | number | boolean | null | undefined>>(
      (acc, item) => {
        acc[item.name] = item.value
        return acc
      },
      {}
    )

    const res = await deviceLocation({
      id: props.id,
      location: `${longitude.value},${latitude.value}`,
      additional_info: JSON.stringify(extentedInfoObject)
    })

    if (!res.error) {
      message.success($t('common.modifySuccess'))
    }
  } catch {
    message.error('淇濆瓨澶辫触')
  }
}

const onPositionSelected = (position: { lat: number; lng: number }) => {
  latitude.value = position.lat.toString()
  longitude.value = position.lng.toString()
  isShow.value = false
}

const openMapAndGetPosition = () => {
  if (latitude.value && longitude.value) {
    const error = getCoordinateStringValidationError(latitude.value, longitude.value)
    if (error) {
      window.$message?.error(`褰撳墠缁忕含搴︽棤鏁? ${error}`)
      return
    }
  }

  isShow.value = true
}

const getConfigInfo = async () => {
  const result = await deviceDetail(query.d_id as string)
  const location = result?.data?.location || ''
  const deviceAdditionalInfo = safeParseJSON<Record<string, any>>(result?.data?.additional_info, {})
  const locationData = location?.split(',') || []
  latitude.value = locationData[1] || ''
  longitude.value = locationData[0] || ''

  if (props.deviceConfigId) {
    const resultData = await deviceConfigInfo({ id: props.deviceConfigId })
    const parsedAdditionalInfo = safeParseJSON<ExtensionInfo[]>(resultData?.data?.additional_info, [])
    const extendedInfoCandidates = deviceAdditionalInfo?.extendedInfo ?? deviceAdditionalInfo ?? []
    const extendedInfo = normalizeExtendedInfo(extendedInfoCandidates)
    const extendedInfoMap = new Map(extendedInfo.map(info => [info.name, info.value]))

    additionInfo.value = parsedAdditionalInfo.map(item => {
      const resolvedValue = extendedInfoMap.has(item.name) ? extendedInfoMap.get(item.name) : item.default_value

      return {
        ...item,
        value: coerceValueByType(resolvedValue, item.type),
        options: item.options || []
      }
    })
  }
}

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})

onMounted(getConfigInfo)
</script>

<template>
  <div>
    <NCard :title="$t('generate.device-location')" class="mb-4">
      <NSpace>
        <NInput v-model:value="longitude" :placeholder="$t('generate.longitude')" class="w-140px" />
        <NInput v-model:value="latitude" :placeholder="$t('generate.latitude')" class="w-140px" />

        <NButton type="primary" @click="openMapAndGetPosition">{{ $t('generate.location') }}</NButton>
      </NSpace>
    </NCard>

    <NCard :title="$t('generate.extension-info')" class="mb-4">
      <div v-if="additionInfo.filter(item => item.enable === true).length > 0">
        <NForm ref="extensionFormRef" class="mt-4">
          <div class="space-y-4">
            <div
              v-for="item in additionInfo.filter(item => item.enable === true)"
              :key="item.name"
              class="flex items-center gap-3"
            >
              <div class="w-40 text-sm font-medium text-gray-700 flex-shrink-0 flex items-center gap-1">
                <span class="truncate" :title="item.name">{{ item.name }}</span>
                <NTooltip trigger="hover">
                  <template #trigger>
                    <NIcon size="14" class="text-gray-400 cursor-help">
                      <svg viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41c0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
                        />
                      </svg>
                    </NIcon>
                  </template>
                  <div class="max-w-xs">
                    <div class="text-sm font-medium mb-1">鍚嶇О: {{ item.name }}</div>
                    <div class="text-sm font-medium mb-1">绫诲瀷: {{ item.type }}</div>
                    <div class="text-sm mb-1">榛樿鍊? {{ item.default_value }}</div>
                    <div class="text-sm text-gray-600">{{ item.desc || '鏃犳弿杩?' }}</div>
                  </div>
                </NTooltip>
              </div>

              <div class="flex-1">
                <NInput
                  v-if="item.type === 'String'"
                  v-model:value="item.value"
                  :placeholder="`榛樿鍊? ${item.default_value || ''}`"
                />
                <NInputNumber
                  v-else-if="item.type === 'Number'"
                  v-model:value="item.value"
                  :placeholder="`榛樿鍊? ${item.default_value || ''}`"
                  class="w-full"
                />
                <NSwitch
                  v-else-if="item.type === 'Boolean'"
                  v-model:value="item.value"
                  :checked-value="true"
                  :unchecked-value="false"
                />
                <NSelect
                  v-else-if="item.type === 'Enum'"
                  v-model:value="item.value"
                  :options="item.options || []"
                  :placeholder="`榛樿鍊? ${item.default_value || ''}`"
                />
                <NInput
                  v-else
                  v-model:value="item.value"
                  :placeholder="`榛樿鍊? ${item.default_value || ''}`"
                />
              </div>
            </div>
          </div>
        </NForm>
      </div>

      <div v-else class="text-center text-gray-400 py-8">
        {{ $t('common.noData') }}
      </div>
    </NCard>

    <NButton type="primary" @click="handleSave">{{ $t('common.save') }}</NButton>
    <NModal v-model:show="isShow" class="flex-center" :class="getPlatform ? 'max-w-90%' : 'max-w-720px'">
      <NCard class="flex flex-1">
        <TencentMap
          v-show="isShow"
          class="flex-1 h-440px w-680px"
          :longitude="longitude"
          :latitude="latitude"
          @position-selected="onPositionSelected"
        />
      </NCard>
    </NModal>
  </div>
</template>
