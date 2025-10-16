<script setup lang="tsx">
import { onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { DrawerPlacement, StepsProps } from 'naive-ui'
import { NSpace, NTag, NButton } from 'naive-ui'
import _ from 'lodash'
import type { TreeSelectOption } from 'naive-ui/es/tree-select/src/interface'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { localStg } from '@/utils/storage'
import {
  checkDevice,
  devicCeonnectForm,
  deviceDictProtocolServiceFirstLevel,
  deviceDictProtocolServiceSecondLevel,
  deviceGroupTree,
  deviceList,
  getDeviceConfigList,
  putDeviceActive
} from '@/service/api/device'
import type { SearchConfig } from '@/components/data-table-page/index.vue'
import AddDevicesStep1 from '@/views/device/manage/modules/add-devices-step1.vue'
import AddDevicesStep2 from '@/views/device/manage/modules/add-devices-step2.vue'
import AddDevicesStep3 from '@/views/device/manage/modules/add-devices-step3.vue'
import AddDevicesServer1 from '@/views/device/manage/modules/add-devices-server1.vue'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'
import { usePageCache } from '../../../utils/usePageCache'
import { getSSEEndpoint } from '~/env.config'

interface ServiceIds {
  service_identifier: string
  service_plugin_id: string
}

const addKey = ref()
const deviceNumber = ref()
const configOptions = ref()
const deviceId = ref()
const deviceObj = ref()
const configId = ref()
const formData = ref()
const tablePageRef = ref()
const buttonDisabled = ref(true)
const showMessage = ref(false)
const messageColor = ref('')
const route: any = useRoute()
const router: any = useRouter()

const secondLevelOptions = ref<DeviceManagement.ServiceData[]>([])
const selectedFirstLevel = ref<string | null>(null)
const serviceIds = ref<ServiceIds[]>([])
const queryOfServiceIdentifier = ref(route.query.service_identifier)
const queryOfServiceAccessId = ref(route.query.service_access_id)
const { cache: query, setCache } = usePageCache()

/**
 * ===========================================
 * 设备管理页面实时状态监控系统
 * ===========================================
 *
 * 功能说明：
 * 1. 专门用于设备管理页面的设备状态实时更新
 * 2. 当设备上线/下线时，自动更新表格中的设备状态显示
 * 3. 无需用户手动刷新页面，提供流畅的用户体验
 * 4. 与全局通知系统配合，实现页面级的状态同步
 *
 * 技术特点：
 * - 仅更新表格数据，不显示弹窗通知（避免与全局通知重复）
 * - 智能重连机制，确保连接稳定性
 * - 完整的错误处理和数据验证
 * - 页面卸载时自动清理资源
 * - 网络状态检测和优雅降级
 */

// EventSource 连接实例，专用于设备管理页面的状态监控
let eventSource: EventSourcePolyfill | null = null
// 重连尝试次数计数器
let reconnectAttempts = 0
// 最大重连尝试次数限制
const MAX_RECONNECT_ATTEMPTS = 5
// 重连延迟配置（毫秒）
const RECONNECT_DELAYS = [2000, 5000, 10000, 20000, 30000]
// 连接状态标识
let isConnecting = false
// 重连定时器
let reconnectTimer: NodeJS.Timeout | null = null
// 最后错误时间，用于避免频繁错误日志
let lastErrorTime = 0
const ERROR_LOG_THROTTLE = 10000 // 10秒内只记录一次相同错误

/**
 * 设备状态缓存，用于跟踪设备状态变化
 */
const deviceStatusCache = new Map<string, { isOnline: boolean; lastUpdate: number }>()

/**
 * 更新表格中设备状态的函数
 */
const updateDeviceStatusInTable = (deviceId: string, isOnline: boolean) => {
  try {
    // 检查状态是否真的发生了变化，避免不必要的更新
    const cachedStatus = deviceStatusCache.get(deviceId)
    if (cachedStatus && cachedStatus.isOnline === isOnline) {
      return
    }

    // 更新缓存
    deviceStatusCache.set(deviceId, { isOnline, lastUpdate: Date.now() })

    // 更新表格中的设备状态
    if (tablePageRef.value?.dataList && Array.isArray(tablePageRef.value.dataList)) {
      const deviceIndex = tablePageRef.value.dataList.findIndex(
        device => device.id === deviceId
      )

      if (deviceIndex !== -1) {
        tablePageRef.value.dataList[deviceIndex].is_online = isOnline ? 1 : 0
      }
    }
  } catch (error) {
    console.error('更新设备状态失败:', error)
  }
}

/**
 * 清理过期的设备状态缓存
 */
const cleanupDeviceStatusCache = () => {
  const now = Date.now()
  const maxAge = 60 * 60 * 1000 // 1小时
  
  for (const [deviceId, status] of deviceStatusCache.entries()) {
    if (now - status.lastUpdate > maxAge) {
      deviceStatusCache.delete(deviceId)
    }
  }
}

/**
 * 检查网络连接状态
 */
const checkNetworkStatus = (): boolean => {
  return navigator.onLine !== false
}

/**
 * 节流错误日志记录
 */
const logErrorThrottled = (message: string, error?: any) => {
  const now = Date.now()
  if (now - lastErrorTime > ERROR_LOG_THROTTLE) {
    console.error(message, error)
    lastErrorTime = now
  }
}

/**
 * 创建设备管理页面专用的EventSource连接
 */
const createEventSourceConnection = () => {
  // 防止重复连接
  if (isConnecting || eventSource?.readyState === EventSource.OPEN) {
    return
  }

  try {
    // 检查网络状态
    if (!checkNetworkStatus()) {
      return
    }

    // 获取用户认证token
    const token = localStg.get('token')
    if (!token) {
      return
    }

    isConnecting = true

    // 清理之前可能存在的连接
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }

    // 清除之前的重连定时器
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    /**
     * 创建专用于设备管理页面的EventSource连接
     * 与全局的base-layout连接共享同一个端点，但处理逻辑不同：
     * - 全局连接：显示通知 + 播放音效
     * - 页面连接：仅更新表格数据
     */
    eventSource = new EventSourcePolyfill(getSSEEndpoint(import.meta.env), {
      heartbeatTimeout: 3 * 60 * 1000, // 心跳超时：3分钟
      headers: {
        'x-token': token // 用户身份验证
      }
    })

    /**
     * 连接建立成功回调
     */
    eventSource.onopen = () => {
      isConnecting = false
      reconnectAttempts = 0
    }

    /**
     * 监听设备状态变化事件
     */
    eventSource.addEventListener('device_online', (event: any) => {
      try {
        if (!event?.data) {
          return
        }

        const data = JSON.parse(event.data)

        if (!data.device_id || typeof data.device_id !== 'string') {
          return
        }

        if (typeof data.is_online !== 'boolean') {
          return
        }

        updateDeviceStatusInTable(data.device_id, data.is_online)

      } catch (parseError) {
        logErrorThrottled('解析设备状态事件数据失败:', parseError)
      }
    })

    /**
     * 错误处理和智能重连机制
     */
    eventSource.onerror = (error) => {
      isConnecting = false
      logErrorThrottled('EventSource连接错误:', error)

      // 立即清理当前连接
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }

      // 智能重连：使用预定义的延迟时间
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts += 1
        const delay = RECONNECT_DELAYS[Math.min(reconnectAttempts - 1, RECONNECT_DELAYS.length - 1)]
        

        reconnectTimer = setTimeout(() => {
          if (checkNetworkStatus()) {
            createEventSourceConnection()
          } else {
            // 网络不可用时，延长重连间隔
            reconnectTimer = setTimeout(() => {
              createEventSourceConnection()
            }, 60000) // 1分钟后重试
          }
        }, delay)
      } else {
        // 达到最大重连次数后，每5分钟尝试一次
        reconnectTimer = setTimeout(() => {
          reconnectAttempts = 0 // 重置计数器
          createEventSourceConnection()
        }, 5 * 60 * 1000)
      }
    }

  } catch (error) {
    isConnecting = false
    console.error('创建设备管理页面EventSource连接失败:', error)
  }
}

// 缓存清理定时器
let cacheCleanupTimer: NodeJS.Timeout | null = null

/**
 * 清理EventSource连接
 */
const cleanupEventSource = () => {
  // 清理EventSource连接
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
  
  // 清理重连定时器
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  
  // 清理缓存清理定时器
  if (cacheCleanupTimer) {
    clearInterval(cacheCleanupTimer)
    cacheCleanupTimer = null
  }
  
  // 清理设备状态缓存
  deviceStatusCache.clear()
  
  // 重置状态
  isConnecting = false
  reconnectAttempts = 0
  lastErrorTime = 0
}

const getFormJson = async id => {
  const res = await devicCeonnectForm({ device_id: id })

  formData.value = res.data
}
const setUpId = (dId, cId, dobj) => {
  deviceId.value = dId
  configId.value = cId
  deviceObj.value = JSON.parse(dobj)
  getFormJson(dId)
}
const getDeviceGroupOptions = async () => {
  // 将原始数据转换为树形结构
  function convertTreeNodeToTarget(treeNode: DeviceManagement.TreeNode): TreeSelectOption {
    const { group, children } = treeNode
    const targetNode: TreeSelectOption = {
      label: group.name,
      key: group.id
    }

    if (children && children.length > 0) {
      targetNode.children = children.map(convertTreeNodeToTarget)
    }

    return targetNode
  }

  // 将 TreeNode 数组转换为目标数据结构的数组
  function convertTreeNodesToTarget(treeNodes: DeviceManagement.TreeNode[]): TreeSelectOption[] {
    return treeNodes.map(convertTreeNodeToTarget)
  }

  const res = await deviceGroupTree({})
  let options: any[] = []
  if (res.data) {
    options = convertTreeNodesToTarget(res.data)
  }
  return options
}

const getDeviceConfigOptions = async () => {
  if (process.env.NODE_ENV === 'development') {
  }

  const res = await getDeviceConfigList({
    page: 1,
    page_size: 99
    // device_type: pattern
  })
  let options: any[] = []
  if (res.data && res.data.list) {
    options = res.data.list
  }
  configOptions.value = [{ name: $t('custom.devicePage.unlimitedDeviceConfig'), id: '' }, ...options]

  return configOptions.value
}

const columns_to_show: Ref<any> = ref([
  {
    key: 'name',
    minWidth: '180px',
    label: () => $t('custom.devicePage.deviceName'),
    render: (row: any) => {
      return (
        <NButton type="primary" text onClick={() => goDeviceDetails(row)}>
          {row.name}
        </NButton>
      )
    }
  },

  {
    key: 'is_online',
    minWidth: '100px',
    label: () => $t('custom.devicePage.onlineStatus'),
    render: row => {
      if (row?.is_online === 1) {
        return (
          <NSpace>
            <NTag type="success">{$t('custom.devicePage.online')}</NTag>
          </NSpace>
        )
      }
      return (
        <NSpace>
          <NTag type="default" style="color: #999;">
            {$t('custom.devicePage.offline')}
          </NTag>
        </NSpace>
      )
    }
  },
  {
    key: 'warn_status',
    minWidth: '100px',
    label: () => $t('custom.devicePage.alarmStatus'),
    render: row => {
      if (row?.warn_status === 'Y') {
        return (
          <NSpace>
            <NTag type="warning" style="color: #ff9900;">
              {$t('custom.devicePage.alarmed')}
            </NTag>
          </NSpace>
        )
      }
      return (
        <NSpace>
          <NTag type="default" style="color: #999;">
            {$t('custom.devicePage.notAlarmed')}
          </NTag>
        </NSpace>
      )
    }
  },
  {
    key: 'device_type',
    minWidth: '100px',
    label: () => $t('generate.device-type'),
    render: row => {
      if (row?.device_type === '1') {
        return $t('custom.devicePage.directConnectedDevices')
      } else if (row?.device_type === '2') {
        return $t('custom.devicePage.gateway')
      } else if (row?.device_type === '3') {
        return $t('custom.devicePage.gatewaySubEquipment')
      }
      return '-'
    }
  },
  {
    key: 'device_config_name',
    minWidth: '100px',
    label: () => $t('custom.devicePage.deviceConfig')
  },
  {
    key: 'device_type',
    minWidth: '160px',
    label: () => $t('custom.devicePage.accessServiceProtocol'),
    render: row => {
      if (row?.access_way === '') return '-'
      return row?.access_way === 'A'
        ? `${$t('custom.devicePage.byProtocol')}(${row?.protocol_type || '-'})`
        : `${$t('custom.devicePage.byService')}(${row?.protocol_type || '-'})`
    }
  },
  {
    key: 'ts',
    minWidth: '140px',
    label: () => $t('custom.devicePage.lastPushTime')
  }
]) as Ref<any>

const { routerPushByKey } = useRouterPush()
const goDeviceDetails = row => {
  routerPushByKey('device_details', {
    query: {
      d_id: row.id
    }
  })
}
const actions = []

const searchConfigs = ref<SearchConfig[]>([
  {
    key: 'group_id',
    label: $t('custom.devicePage.selectGroup'),
    type: 'tree-select',
    multiple: false,
    initValue: query.group_id,
    options: [{ label: $t('custom.devicePage.group'), key: '' }],
    loadOptions: getDeviceGroupOptions
  },
  {
    key: 'device_config_id',
    label: $t('custom.devicePage.unlimitedDeviceConfig'),
    type: 'select',
    options: [],
    initValue: query.device_config_id,
    labelField: 'name',
    valueField: 'id',
    loadOptions: getDeviceConfigOptions
  },
  {
    key: 'is_online',
    label: $t('custom.devicePage.unlimitedOnlineStatus'),
    type: 'select',
    initValue: query.is_online,
    options: [
      { label: () => $t('custom.devicePage.unlimitedOnlineStatus'), value: '' },
      { label: () => $t('custom.devicePage.online'), value: 1 },
      { label: () => $t('custom.devicePage.offline'), value: 0 }
    ]
  },
  {
    key: 'warn_status',
    label: $t('custom.devicePage.unlimitedAlarmStatus'),
    type: 'select',
    initValue: query.warn_status,
    options: [
      { label: () => $t('custom.devicePage.unlimitedAlarmStatus'), value: '' },
      { label: () => $t('custom.devicePage.alarm'), value: 'Y' },
      { label: () => $t('custom.devicePage.noAlarm'), value: 'N' }
    ]
  },
  {
    key: 'device_type',
    label: $t('custom.devicePage.unlimitedAccessType'),
    initValue: query.device_type,
    type: 'select',
    options: [
      { label: $t('custom.devicePage.unlimitedAccessType'), value: '' },
      { label: $t('custom.devicePage.directConnectedDevices'), value: '1' },
      { label: $t('custom.devicePage.gateway'), value: '2' },
      { label: $t('custom.devicePage.gatewaySubEquipment'), value: '3' }
      // { label: $t('custom.devicePage.byProtocol'), value: 'A' },
      // { label: $t('custom.devicePage.byService'), value: 'B' }
    ]
  },
  {
    key: 'service_identifier',
    label: 'card.anyProtocolService',
    type: 'select',
    initValue: query.service_identifier,
    options: [{ label: $t('card.anyProtocolService'), value: '' }]
  },
  {
    key: 'search',
    initValue: query.search,
    label: $t('custom.devicePage.deviceNameOrNumber'),
    type: 'input'
  },
  {
    key: 'label',
    initValue: query.label,
    label: $t('custom.devicePage.label'),
    type: 'input'
  }
])
const dropOption = [
  {
    label: () => $t('custom.devicePage.manualAdd'),
    key: 'hands'
  },
  {
    label: () => $t('custom.devicePage.addByNumber'),
    key: 'number',
    disabled: true
  },
  {
    label: () => $t('custom.devicePage.addByServer'),
    key: 'server',
    disabled: false
  }
]

const fetchFirstLevelOptions = async () => {
  const { data } = await deviceDictProtocolServiceFirstLevel({
    language_code: localStg.get('lang')
  })

  const protocolOptions = data.protocol.map(item => ({
    label: item.name,
    value: item.service_identifier,
    type: 'protocol'
  }))

  const serviceOptions = data.service
    ? data.service.map(item => {
        serviceIds.value.push({
          service_identifier: item.service_identifier,
          service_plugin_id: item.service_plugin_id
        })

        return {
          label: item.name,
          value: item.service_identifier,
          type: 'service'
        }
      })
    : []

  searchConfigs.value.map((item: any) => {
    if (item.key === 'service_identifier') {
      item.options = [
        { label: $t('card.anyProtocolService'), value: '' },
        {
          type: 'group',
          label: $t('common.protocol'),
          key: 'protocol',
          children: [...protocolOptions]
        },
        {
          type: 'group',
          label: $t('common.service'),
          key: 'service',
          children: [...serviceOptions]
        }
      ]
    }
    return item
  })
}

const fetchSecondLevelOptions = async (firstLevelValue, page = 1) => {
  if (!firstLevelValue) return
  if (page === 1) {
    // 清空二级选项
    secondLevelOptions.value = []
    searchConfigs.value.map((item: any) => {
      if (item.key === 'service_access_id') {
        item.options = []
      }
      return item
    })
  }

  const pluginId = serviceIds.value.filter(item => item.service_identifier === firstLevelValue)[0]?.service_plugin_id
  const { data } = await deviceDictProtocolServiceSecondLevel({
    params: {
      service_plugin_id: pluginId,
      page,
      page_size: 100
    }
  })

  const { list, total } = data
  if (page === 1) {
    secondLevelOptions.value = list
  } else {
    secondLevelOptions.value = [...secondLevelOptions.value, ...list]
  }
  if (total > secondLevelOptions.value.length) {
    await fetchSecondLevelOptions(firstLevelValue, page + 1)
  } else {
    searchConfigs.value.map((item: any) => {
      if (item.key === 'service_access_id') {
        item.options = secondLevelOptions.value.map(item2 => ({
          label: item2.name,
          value: item2.id
        }))
      }
      return item
    })
  }
}

const paramsUpdateHandle = async params => {
  const firstSelected = params.service_identifier
  if (firstSelected && selectedFirstLevel.value !== firstSelected) {
    selectedFirstLevel.value = firstSelected
    const identifierIndex = searchConfigs.value.findIndex(item => item.key === 'service_identifier')
    const accessIndex = searchConfigs.value.findIndex(item => item.key === 'service_access_id')
    // 重置二级选项
    const isService = serviceIds.value.map(item => item.service_identifier).includes(firstSelected)
    if (isService) {
      if (accessIndex === -1) {
        searchConfigs.value.splice(identifierIndex + 1, 0, {
          key: 'service_access_id',
          label: '选择二级服务',
          type: 'select',
          options: []
        })
      } else if (accessIndex > -1) {
        tablePageRef.value?.forceChangeParamsByKey({
          service_access_id: null
        })
      }
      await fetchSecondLevelOptions(firstSelected)
    } else if (accessIndex > -1) {
      searchConfigs.value.splice(accessIndex, 1)
      tablePageRef.value?.forceChangeParamsByKey({
        service_access_id: null
      })
    }
  }
}

const setServiceParams = () => {
  tablePageRef.value?.forceChangeParamsByKey({
    service_identifier: queryOfServiceIdentifier.value,
    service_access_id: queryOfServiceAccessId.value
  })
}

onBeforeMount(async () => {
  await fetchFirstLevelOptions()
  setServiceParams()
})

/**
 * 网络状态变化处理
 */
const handleNetworkChange = () => {
  if (navigator.onLine) {
    // 网络恢复时，重置重连计数器并尝试连接
    reconnectAttempts = 0
    createEventSourceConnection()
  } else {
    cleanupEventSource()
  }
}

/**
 * 页面可见性变化处理
 */
const handleVisibilityChange = () => {
  if (document.hidden) {
    // 页面隐藏时，清理连接以节省资源
    cleanupEventSource()
  } else {
    // 页面重新可见时，重新建立连接
    createEventSourceConnection()
  }
}

/**
 * 组件挂载完成后建立设备状态监控连接
 */
onMounted(() => {
  createEventSourceConnection()
  
  // 启动定期缓存清理（每30分钟清理一次）
  cacheCleanupTimer = setInterval(cleanupDeviceStatusCache, 30 * 60 * 1000)
  
  // 监听网络状态变化
  window.addEventListener('online', handleNetworkChange)
  window.addEventListener('offline', handleNetworkChange)
  
  // 监听页面可见性变化
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

/**
 * 组件卸载前清理EventSource连接
 */
onUnmounted(() => {
  cleanupEventSource()
  
  // 移除事件监听器
  window.removeEventListener('online', handleNetworkChange)
  window.removeEventListener('offline', handleNetworkChange)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

const topActions = [
  {
    element: () => (
      <n-dropdown options={dropOption} trigger="hover" onSelect={handleSelect}>
        <n-button type="primary">+{$t('custom.devicePage.addDevice')}</n-button>
      </n-dropdown>
    )
  }
]
const active = ref(false)
const isSuccess = ref(false)

const setIsSuccess = (flag: boolean) => {
  isSuccess.value = flag
}
const placement = ref<DrawerPlacement>('right')
const current = ref<number>(1)
const currentStatus = ref<StepsProps['status']>('process')
const currentServer = ref<number>(1)
const currentServerStatus = ref<StepsProps['status']>('process')
const activate = (place: DrawerPlacement, key: string | number) => {
  if (key === 'server') {
    router.push('/device/service-access')
  } else {
    current.value = 1
    currentServer.value = 1
    active.value = true
    addKey.value = key
    placement.value = place
  }
}

const completeAdd = async () => {
  const { error } = await putDeviceActive({
    device_number: deviceNumber.value
  })
  if (!error) {
    active.value = true
  }
}

const completeHandAdd = () => {
  if (process.env.NODE_ENV === 'development') {
  }

  tablePageRef.value?.handleSearch()
}

function handleSelect(key: string | number) {
  activate('bottom', key)
}

const messageStyle = ref({
  color: messageColor,
  marginLeft: '10px',
  marginTop: '5px'
})

watch(
  deviceNumber,
  _.debounce(async newDeviceNumber => {
    try {
      if (!newDeviceNumber) {
        showMessage.value = false
        return
      }
      const { data, error } = await checkDevice(newDeviceNumber)
      if (!error && data && data.is_available) {
        buttonDisabled.value = false
        messageColor.value = 'rgb(2,153,52)'
      } else {
        buttonDisabled.value = true
        messageColor.value = 'rgb(255, 26, 26)'
      }
      showMessage.value = true
    } catch (error) {
      console.error(error)
    }
  }, 500)
)
const fetchData = (params: Record<string, any>) => {
  setCache(params)
  return deviceList(params)
}
</script>

<template>
  <div>
    <data-table-page
      ref="tablePageRef"
      :fetch-data="fetchData"
      :columns-to-show="columns_to_show"
      :table-actions="actions"
      :search-configs="searchConfigs"
      :top-actions="topActions"
      :init-page="query.page"
      :init-page-size="query.page_size"
      :row-click="goDeviceDetails"
      @params-update="paramsUpdateHandle"
    />
    <n-drawer v-model:show="active" :height="720" :placement="placement" @after-leave="completeHandAdd">
      <n-drawer-content
        v-if="addKey === 'hands'"
        :title="$t('generate.manually-add-device')"
        class="flex-center pt-24px"
      >
        <n-steps :current="current" :status="currentStatus">
          <n-step :title="$t('custom.devicePage.step1Title')" :description="$t('custom.devicePage.step1Desc')" />
          <n-step :title="$t('custom.devicePage.step2Title')" :description="$t('custom.devicePage.step2Desc')" />
          <n-step :title="$t('custom.devicePage.step3Title')" :description="$t('custom.devicePage.step3Desc')" />
        </n-steps>
        <n-card class="mt-6" bordered border>
          <div v-if="current === 1">
            <AddDevicesStep1
              :set-id-callback="setUpId"
              :config-options="configOptions"
              :next-callback="
                () => {
                  current += 1
                }
              "
            />
          </div>
          <div v-if="current === 2">
            <AddDevicesStep2
              :set-is-success="setIsSuccess"
              :device_id="deviceId"
              :form-data="deviceObj"
              :form-elements="formData"
              :next-callback="
                () => {
                  current += 1
                }
              "
            />
          </div>
          <div v-if="current === 3">
            <AddDevicesStep3
              :is-success="isSuccess"
              :close-callback="
                () => {
                  active = false
                }
              "
              :back-callback="
                () => {
                  current -= 1
                }
              "
            />
          </div>
        </n-card>
      </n-drawer-content>
      <n-drawer-content
        v-if="addKey === 'number'"
        class="flex-left pt-24px"
        style="margin-left: 500px"
        :title="$t('custom.devicePage.addByNumber')"
      >
        <n-h4 align-text>
          <n-li>
            <NText strong>{{ $t('custom.devicePage.tips') }}</NText>
          </n-li>
        </n-h4>
        <div style="display: flex; margin-bottom: 20px">
          <n-input
            v-model:value="deviceNumber"
            :placeholder="$t('custom.devicePage.enterDeviceNumber')"
            class="max-w-240px"
          ></n-input>
          <NText v-if="showMessage" :style="messageStyle">
            {{
              buttonDisabled
                ? $t('custom.devicePage.deviceNumberNotAvailable')
                : $t('custom.devicePage.enterDeviceNumber')
            }}
          </NText>
        </div>
        <n-button type="primary" :disabled="buttonDisabled" @click="completeAdd">
          {{ $t('custom.devicePage.finish') }}
        </n-button>
      </n-drawer-content>
      <n-drawer-content
        v-if="addKey === 'server'"
        class="flex-center pt-24px"
        :title="$t('custom.devicePage.addByServer')"
      >
        <n-steps :current="currentServer" :status="currentServerStatus">
          <n-step
            :title="$t('custom.devicePage.serverStep1Title')"
            :description="$t('custom.devicePage.serverStep1Desc')"
          />
          <n-step
            :title="$t('custom.devicePage.serverStep2Title')"
            :description="$t('custom.devicePage.serverStep2Desc')"
          />
          <n-step :title="$t('custom.devicePage.step3Title')" :description="$t('custom.devicePage.step3Desc')" />
        </n-steps>
        <n-card class="mt-6" bordered border>
          <AddDevicesServer1
            :next-callback="
              () => {
                currentServer += 1
              }
            "
          />
        </n-card>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>
