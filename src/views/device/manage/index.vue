<script setup lang="tsx">
import { computed, h, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { DrawerPlacement, StepsProps } from 'naive-ui'
import { NAlert, NIcon, NTag, NButton, useMessage } from 'naive-ui'
import _ from 'lodash'
import type { TreeSelectOption } from 'naive-ui/es/tree-select/src/interface'
import { AppsOutline, FolderOpenOutline, FolderOutline, LayersOutline } from '@vicons/ionicons5'
import { localStg } from '@/utils/storage'
import { useDeviceStatusWebSocket } from '@/utils/deviceStatusWebSocket'
import {
  deviceDictProtocolServiceFirstLevel,
  deviceDictProtocolServiceSecondLevel,
  putDeviceActive
} from '@/service/api/device'
import { deviceNative } from '@/service/api/device-native'
import { deviceGroupNative } from '@/service/api/device-group-native'
import { templateNative } from '@/service/api/template-native'
import type { SearchConfig } from '@/components/data-table-page/index.vue'
import AddDevicesStep1 from '@/views/device/manage/modules/add-devices-step1.vue'
import AddDevicesServer1 from '@/views/device/manage/modules/add-devices-server1.vue'
import NativeDeviceRegistrationResult from '@/views/device/manage/modules/native-device-registration-result.vue'
import type { Device } from '@/service/api/device-native'
import DeviceReadingsCompact from '@/views/device/manage/modules/device-readings-compact.vue'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'
import { usePageCache } from '../../../utils/usePageCache'

interface ServiceIds {
  service_identifier: string
  service_plugin_id: string
}

const addKey = ref()
const deviceNumber = ref()
const configOptions = ref<any[]>([])
const registeredDevice = ref<Device | null>(null)
const tablePageRef = ref()
const buttonDisabled = ref(true)
const showMessage = ref(false)
const messageColor = ref('')
const route: any = useRoute()
const router: any = useRouter()
const message = useMessage()
const initialDeviceConfigId = ref(typeof route.query.deviceConfigId === 'string' ? route.query.deviceConfigId : '')

const secondLevelOptions = ref<DeviceManagement.ServiceData[]>([])
const selectedFirstLevel = ref<string | null>(null)
const serviceIds = ref<ServiceIds[]>([])
const queryOfServiceIdentifier = ref(route.query.service_identifier)
const queryOfServiceAccessId = ref(route.query.service_access_id)
const { cache: query, setCache } = usePageCache()
type DeviceGroupTreeOption = TreeSelectOption & {
  deviceCount?: number
  children?: DeviceGroupTreeOption[]
}

const groupOptions = ref<DeviceGroupTreeOption[]>([])
const groupTreeError = ref('')
const selectedGroupName = computed(() => {
  if (selectedGroupScope.value === 'ungrouped') return $t('custom.devicePage.ungroupedDevices')
  if (selectedGroupScope.value !== 'group') return $t('custom.devicePage.allDevices')

  const findGroupName = (groups: DeviceGroupTreeOption[]): string | undefined => {
    for (const group of groups) {
      if (String(group.key) === selectedGroupId.value) return String(group.label)
      const nestedName = group.children ? findGroupName(group.children) : undefined
      if (nestedName) return nestedName
    }
    return undefined
  }

  return findGroupName(groupOptions.value) || $t('custom.devicePage.group')
})
const groupTreeLoading = ref(false)
type GroupScope = 'all' | 'ungrouped' | 'group'
type DeviceGroupSelection = {
  scope: GroupScope
  groupId: string
}
const savedGroupSelection = localStg.get('deviceManageGroupSelection') as DeviceGroupSelection | null
const hasCachedGroupSelection = Boolean(query.group_id || query.group_scope)
const initialGroupSelection: DeviceGroupSelection = hasCachedGroupSelection
  ? {
      scope: query.group_id ? 'group' : query.group_scope === 'ungrouped' ? 'ungrouped' : 'all',
      groupId: query.group_id ? String(query.group_id) : ''
    }
  : savedGroupSelection?.scope === 'group' && savedGroupSelection.groupId
    ? { scope: 'group', groupId: String(savedGroupSelection.groupId) }
    : savedGroupSelection?.scope === 'ungrouped'
      ? { scope: 'ungrouped', groupId: '' }
      : { scope: 'all', groupId: '' }
const selectedGroupId = ref(initialGroupSelection.groupId)
const selectedGroupScope = ref<GroupScope>(initialGroupSelection.scope)
const allDeviceCount = ref<number | null>(null)
const ungroupedDeviceCount = ref<number | null>(null)
const groupStatsError = ref('')
const deviceListError = ref('')
const deviceListRefreshing = ref(false)
const groupPanelVisible = ref(false)
let deviceListRequestGeneration = 0

const renderGroupPrefix = ({ option }: { option: DeviceGroupTreeOption }) =>
  h(
    NIcon,
    {
      size: 16,
      depth: option.children?.length ? 2 : 3
    },
    {
      default: () => h(option.children?.length ? FolderOpenOutline : FolderOutline)
    }
  )

const renderGroupLabel = ({ option }: { option: DeviceGroupTreeOption }) =>
  h('span', { class: 'device-group-tree__label' }, [
    h('span', { class: 'device-group-tree__label-text' }, option.label),
    typeof option.deviceCount === 'number' ? h('span', { class: 'device-group-tree__count' }, option.deviceCount) : null
  ])

// 初始化设备状态 WebSocket 管理器
const deviceStatusWS = useDeviceStatusWebSocket()

/**
 * 更新表格中设备状态的函数
 */
const updateDeviceStatusInTable = (deviceId: string, isOnline: boolean) => {
  try {
    // 更新表格中的设备状态
    if (tablePageRef.value?.dataList && Array.isArray(tablePageRef.value.dataList)) {
      const deviceIndex = tablePageRef.value.dataList.findIndex(device => device.id === deviceId)

      if (deviceIndex !== -1) {
        tablePageRef.value.dataList[deviceIndex].is_online = isOnline ? 1 : 0
      }
    }
  } catch (error) {
    console.error('更新设备状态失败:', error)
  }
}

/**
 * 订阅当前页面的设备状态
 */
const subscribeDeviceStatus = () => {
  // 获取当前页面的设备ID列表
  const deviceIds = tablePageRef.value?.dataList?.map((device: any) => device.id) || []

  if (deviceIds.length > 0) {
    // 连接并订阅（第一次会建立连接，后续会更新订阅）
    deviceStatusWS.connect(deviceIds, updateDeviceStatusInTable)
  } else {
    // 没有设备时断开连接
    deviceStatusWS.disconnect()
  }
}

const onNativeDeviceRegistered = (device: Device) => {
  registeredDevice.value = device
}
const returnToNativeDeviceList = () => {
  active.value = false
}
const openNativeDeviceDetails = () => {
  if (!registeredDevice.value) return
  const device = registeredDevice.value
  active.value = false
  goDeviceDetails(device)
}
const getDeviceGroupOptions = async () => {
  // 将原始数据转换为树形结构
  function convertTreeNodeToTarget(
    treeNode: Awaited<ReturnType<typeof deviceGroupNative.tree>>['nodes'][number]
  ): DeviceGroupTreeOption {
    const { group, children } = treeNode
    const targetNode: DeviceGroupTreeOption = {
      label: group.name,
      key: String(group.id),
      deviceCount: group.subtreeDeviceCount
    }

    if (children && children.length > 0) {
      targetNode.children = children.map(convertTreeNodeToTarget)
    }

    return targetNode
  }

  // 将 TreeNode 数组转换为目标数据结构的数组
  function convertTreeNodesToTarget(
    treeNodes: Awaited<ReturnType<typeof deviceGroupNative.tree>>['nodes']
  ): DeviceGroupTreeOption[] {
    return treeNodes.map(convertTreeNodeToTarget)
  }

  const tree = await deviceGroupNative.tree(32)
  if (tree.truncated) throw new Error('设备分组树超过可读取深度，暂不能完整显示')
  return convertTreeNodesToTarget(tree.nodes)
}

const getDeviceConfigOptions = async () => {
  const options: Array<{
    id: string
    name: string
    deviceKind: string
    accessMode: string
    protocol: string
  }> = []
  let page = 1
  let total = Number.POSITIVE_INFINITY
  while (options.length < total) {
    const res = await templateNative.list({ page, pageSize: 100 })
    options.push(
      ...res.items.map(template => ({
        id: template.id,
        name: template.name,
        deviceKind: template.configuration?.deviceKind ?? '',
        accessMode: template.configuration?.access?.mode ?? '',
        protocol: template.configuration?.access?.protocol ?? ''
      }))
    )
    total = res.total
    if (res.items.length === 0) break
    page += 1
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
        <div class="device-name-cell">
          <span
            class={['device-status-dot', row?.is_online === 1 ? 'device-status-dot--online' : null]}
            aria-hidden="true"
          />
          <NButton
            class="device-name-button"
            type="primary"
            text
            disabled={Boolean(deviceListError.value || deviceListRefreshing.value)}
            onClick={() => goDeviceDetails(row)}
          >
            {row.name}
          </NButton>
        </div>
      )
    }
  },

  {
    key: 'is_online',
    minWidth: '100px',
    label: () => $t('custom.devicePage.onlineStatus'),
    render: row => {
      if (row?.is_online === 1) {
        return <NTag type="success">{$t('custom.devicePage.online')}</NTag>
      }
      if (row?.is_online === 0) return <NTag type="default">{$t('custom.devicePage.offline')}</NTag>
      return <span>-</span>
    }
  },
  {
    key: 'warn_status',
    minWidth: '100px',
    label: () => $t('custom.devicePage.alarmStatus'),
    render: row => {
      if (row?.warn_status === 'Y') {
        return <NTag type="warning">{$t('custom.devicePage.alarmed')}</NTag>
      }
      if (row?.warn_status === 'N') return <NTag type="default">{$t('custom.devicePage.notAlarmed')}</NTag>
      return <span>-</span>
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
    label: () => $t('custom.devicePage.deviceConfig'),
    render: row => {
      const template = configOptions.value.find(option => option.id === row?.device_config_id)
      return template?.name || '-'
    }
  },
  {
    key: 'access_way',
    minWidth: '160px',
    label: () => $t('custom.devicePage.accessServiceProtocol'),
    render: row => {
      const template = configOptions.value.find(option => option.id === row?.device_config_id)
      if (!template || !template.accessMode) return '-'
      const accessLabel =
        template.accessMode === 'service_connector'
          ? $t('custom.devicePage.byService')
          : ['direct', 'protocol_connector', 'gateway'].includes(template.accessMode)
            ? $t('custom.devicePage.byProtocol')
            : ''
      if (!accessLabel) return '-'
      return `${accessLabel}(${template.protocol || '-'})`
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
  if (deviceListError.value || deviceListRefreshing.value) return
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
    label: 'custom.devicePage.selectGroup',
    type: 'tree-select',
    multiple: false,
    initValue: query.group_id,
    options: [{ label: $t('custom.devicePage.group'), key: '' }],
    loadOptions: getDeviceGroupOptions
  },
  {
    key: 'device_config_id',
    label: 'custom.devicePage.unlimitedDeviceConfig',
    type: 'select',
    initValue: query.device_config_id,
    options: [],
    labelField: 'name',
    valueField: 'id',
    dropdownMinWidth: '320px',
    loadOptions: getDeviceConfigOptions
  },
  {
    key: 'is_online',
    label: 'custom.devicePage.unlimitedOnlineStatus',
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
    label: 'custom.devicePage.unlimitedAlarmStatus',
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
    label: 'custom.devicePage.unlimitedAccessType',
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
    dropdownMinWidth: '240px',
    initValue: query.service_identifier,
    options: [{ label: $t('card.anyProtocolService'), value: '' }]
  },
  {
    key: 'search',
    initValue: query.search,
    label: 'custom.devicePage.deviceNameOrNumber',
    type: 'input'
  },
  {
    key: 'label',
    initValue: query.label,
    label: 'custom.devicePage.label',
    type: 'input'
  }
])

const deviceSearchConfigs = computed(() => searchConfigs.value.filter(item => item.key !== 'group_id'))
const selectedGroupKeys = computed(() =>
  selectedGroupScope.value === 'group' && selectedGroupId.value ? [selectedGroupId.value] : []
)
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

const loadGroupOptions = async () => {
  groupTreeLoading.value = true
  groupTreeError.value = ''
  try {
    groupOptions.value = await getDeviceGroupOptions()
  } catch (error) {
    console.error('加载设备分组失败:', error)
    groupOptions.value = []
    groupTreeError.value = error instanceof Error ? error.message : '设备分组读取失败'
  } finally {
    groupTreeLoading.value = false
  }
}

const loadDeviceGroupCounts = async () => {
  try {
    const statistics = await deviceNative.statistics({})
    allDeviceCount.value = statistics.total
    ungroupedDeviceCount.value = statistics.ungrouped
    groupStatsError.value = ''
  } catch (error) {
    allDeviceCount.value = null
    ungroupedDeviceCount.value = null
    groupStatsError.value = error instanceof Error ? error.message : '设备统计读取失败'
  }
}

function toNativeDeviceFilters(params: Record<string, any>) {
  const query: Record<string, unknown> = {}
  if (typeof params.search === 'string' && params.search) query.search = params.search
  if (typeof params.device_config_id === 'string' && params.device_config_id) query.templateId = params.device_config_id
  if (typeof params.group_id === 'string' && params.group_id) {
    query.groupId = params.group_id
    query.includeDescendants = true
  }
  if (params.group_scope === 'ungrouped') query.groupScope = 'ungrouped'
  if (typeof params.label === 'string' && params.label) query.label = params.label
  if (params.is_online === 1 || params.is_online === '1') query.connectivity = 'online'
  if (params.is_online === 0 || params.is_online === '0') query.connectivity = 'offline'
  if (params.warn_status === 'Y') query.alarmState = 'active'
  if (params.warn_status === 'N') query.alarmState = 'none'
  if (params.device_type) {
    const kind = String(params.device_type)
    if (kind === '1') query.deviceKind = 'standalone'
    if (kind === '2') query.deviceKind = 'gateway'
    if (kind === '3') query.deviceKind = 'subdevice'
  }
  const identifier = typeof params.service_identifier === 'string' ? params.service_identifier : ''
  if (identifier) {
    const service = serviceIds.value.find(item => item.service_identifier === identifier)
    if (service) {
      query.accessWay = 'service'
      query.providerId = service.service_plugin_id
      if (typeof params.service_access_id === 'string' && params.service_access_id) {
        query.serviceInstanceId = params.service_access_id
      }
    } else {
      query.accessWay = 'protocol'
      query.protocol = identifier
    }
  }
  return query
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
  await Promise.all([fetchFirstLevelOptions(), loadGroupOptions(), loadDeviceGroupCounts()])
  setServiceParams()
})

/**
 * 组件挂载完成后初始化 WebSocket
 */
onMounted(() => {
  // 不需要在这里初始化，等待 fetchData 完成后自动订阅
  if (initialDeviceConfigId.value) {
    void activate('bottom', 'hands')
  }
})

/**
 * 组件卸载前清理 WebSocket 连接
 */
onUnmounted(() => {
  deviceStatusWS.disconnect()
})

const topActions = [
  {
    element: () => (
      <n-dropdown options={dropOption} trigger="hover" onSelect={handleSelect}>
        <n-button type="primary">{$t('custom.devicePage.addDevice')}</n-button>
      </n-dropdown>
    )
  }
]
const active = ref(false)
const placement = ref<DrawerPlacement>('right')
const current = ref<number>(1)
const currentStatus = ref<StepsProps['status']>('process')
const currentServer = ref<number>(1)
const currentServerStatus = ref<StepsProps['status']>('process')
const activate = async (place: DrawerPlacement, key: string | number) => {
  if (key === 'server') {
    router.push('/device/integration')
  } else {
    current.value = 1
    currentServer.value = 1
    registeredDevice.value = null
    active.value = true
    addKey.value = key
    placement.value = place
    if (key === 'hands') {
      await getDeviceConfigOptions()
    }
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
  tablePageRef.value?.handleSearch()
  void loadDeviceGroupCounts()
}

async function handleSelect(key: string | number) {
  await activate('bottom', key)
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
      const { available } = await deviceNative.checkNumber(newDeviceNumber)
      if (available) {
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
const fetchData = async (params: Record<string, any>) => {
  const generation = ++deviceListRequestGeneration
  deviceListRefreshing.value = true
  deviceListError.value = ''
  const requestParams = Object.fromEntries(
    Object.entries(params).filter(([key]) => key !== 'group_id' && key !== 'group_scope')
  )
  if (selectedGroupScope.value === 'group' && selectedGroupId.value) {
    requestParams.group_id = selectedGroupId.value
  } else if (selectedGroupScope.value === 'ungrouped') {
    requestParams.group_scope = 'ungrouped'
  }
  setCache({
    ...requestParams,
    group_id: selectedGroupScope.value === 'group' ? selectedGroupId.value : '',
    group_scope: selectedGroupScope.value
  })
  const nativeQuery = {
    ...toNativeDeviceFilters(requestParams),
    page: Number(requestParams.page) || 1,
    pageSize: Number(requestParams.page_size) || 10
  }
  let nativePage: Awaited<ReturnType<typeof deviceNative.list>>
  try {
    nativePage = await deviceNative.list(nativeQuery as Parameters<typeof deviceNative.list>[0])
  } catch (error) {
    if (generation !== deviceListRequestGeneration) return { error, data: { list: [], total: 0 } }
    deviceListRefreshing.value = false
    deviceListError.value = error instanceof Error ? error.message : '原生设备列表读取失败'
    message.error(error instanceof Error ? error.message : '原生设备列表读取失败')
    return { error, data: { list: [], total: 0 } }
  }
  if (generation !== deviceListRequestGeneration) {
    return { error: new Error('已忽略过期的设备列表响应'), data: { list: [], total: 0 } }
  }
  deviceListRefreshing.value = false
  deviceListError.value = ''
  const result = {
    data: {
      list: nativePage.items.map(device => ({
        ...device,
        device_number: device.deviceNumber,
        device_type: device.deviceKind === 'standalone' ? '1' : device.deviceKind === 'gateway' ? '2' : '3',
        device_config_id: device.templateId ?? '',
        device_config_name: '',
        access_way: '',
        protocol_type: '',
        is_online: undefined,
        warn_status: undefined
      })),
      total: nativePage.total
    }
  }

  // 数据加载完成后，订阅当前页面的设备状态
  // 使用 nextTick 确保 tablePageRef.value.dataList 已更新
  setTimeout(() => {
    subscribeDeviceStatus()
  }, 100)

  return result
}

const persistGroupSelection = () => {
  const selection: DeviceGroupSelection = {
    scope: selectedGroupScope.value,
    groupId: selectedGroupScope.value === 'group' ? selectedGroupId.value : ''
  }
  localStg.set('deviceManageGroupSelection', selection)
  setCache({
    group_id: selection.groupId,
    group_scope: selection.scope
  })
}

const handleGroupSelect = (keys: Array<string | number>) => {
  selectedGroupScope.value = keys.length ? 'group' : 'all'
  selectedGroupId.value = keys.length ? String(keys[0]) : ''
  persistGroupSelection()
  tablePageRef.value?.handleSearch()
}

const handleAllGroups = () => {
  selectedGroupScope.value = 'all'
  selectedGroupId.value = ''
  persistGroupSelection()
  tablePageRef.value?.handleSearch()
}

const handleUngroupedDevices = () => {
  selectedGroupScope.value = 'ungrouped'
  selectedGroupId.value = ''
  persistGroupSelection()
  tablePageRef.value?.handleSearch()
}

const handleFilterReset = () => {
  selectedGroupScope.value = 'all'
  selectedGroupId.value = ''
  persistGroupSelection()
}

const toggleGroupPanel = () => {
  groupPanelVisible.value = !groupPanelVisible.value
}
</script>

<template>
  <div class="device-manage-page">
    <div class="device-manage-layout" :class="{ 'device-manage-layout--with-group': groupPanelVisible }">
      <aside v-if="groupPanelVisible" id="device-group-sidebar" class="device-group-sidebar">
        <div class="device-group-system">
          <button
            type="button"
            class="device-group-system-item device-group-system-item--root"
            :class="{ 'device-group-system-item--active': selectedGroupScope === 'all' }"
            :aria-current="selectedGroupScope === 'all' ? 'page' : undefined"
            @click="handleAllGroups"
          >
            <span class="device-group-system-item__icon" aria-hidden="true">
              <NIcon size="16"><AppsOutline /></NIcon>
            </span>
            <span class="device-group-system-item__label">{{ $t('custom.devicePage.allDevices') }}</span>
            <span v-if="allDeviceCount !== null" class="device-group-system-item__count">{{ allDeviceCount }}</span>
          </button>
          <div class="device-group-system__child">
            <button
              type="button"
              class="device-group-system-item device-group-system-item--child"
              :class="{ 'device-group-system-item--active': selectedGroupScope === 'ungrouped' }"
              :aria-current="selectedGroupScope === 'ungrouped' ? 'page' : undefined"
              @click="handleUngroupedDevices"
            >
              <span class="device-group-system-item__icon" aria-hidden="true">
                <NIcon size="15"><FolderOutline /></NIcon>
              </span>
              <span class="device-group-system-item__label">{{ $t('custom.devicePage.ungroupedDevices') }}</span>
              <span v-if="ungroupedDeviceCount !== null" class="device-group-system-item__count">
                {{ ungroupedDeviceCount }}
              </span>
            </button>
          </div>
        </div>
        <NAlert v-if="groupStatsError" type="error" :bordered="false" class="device-group-stats-error">
          设备统计暂时无法读取：{{ groupStatsError }}
        </NAlert>
        <div class="device-group-divider" aria-hidden="true" />
        <div class="device-group-tree">
          <NAlert v-if="groupTreeError" type="error" :bordered="false">
            {{ groupTreeError }}
            <NButton text size="small" @click="loadGroupOptions">重试</NButton>
          </NAlert>
          <n-spin :show="groupTreeLoading">
            <n-tree
              v-if="groupOptions.length && !groupTreeError"
              block-line
              selectable
              :data="groupOptions"
              :selected-keys="selectedGroupKeys"
              :default-expand-all="true"
              :indent="18"
              show-line
              key-field="key"
              label-field="label"
              children-field="children"
              :render-prefix="renderGroupPrefix"
              :render-label="renderGroupLabel"
              @update:selected-keys="handleGroupSelect"
            />
            <n-empty v-else-if="!groupTreeError" size="small" :description="$t('custom.devicePage.noDeviceGroups')" />
          </n-spin>
        </div>
      </aside>

      <main class="device-manage-content">
        <data-table-page
          ref="tablePageRef"
          page-title="设备管理"
          page-count-label="个设备"
          :fetch-data="fetchData"
          :columns-to-show="columns_to_show"
          :table-actions="actions"
          :search-configs="deviceSearchConfigs"
          :primary-search-keys="['search', 'is_online', 'warn_status', 'device_config_id']"
          :top-actions="topActions"
          :init-page="query.page"
          :init-page-size="query.page_size"
          :row-click="goDeviceDetails"
          @params-update="paramsUpdateHandle"
          @reset="handleFilterReset"
        >
          <template #search-toolbar-before>
            <NAlert
              v-if="deviceListError || deviceListRefreshing"
              :type="deviceListError ? 'error' : 'warning'"
              :bordered="false"
              class="device-list-state-alert"
            >
              <template v-if="deviceListError">
                列表读取失败：{{ deviceListError }}。
                <span v-if="tablePageRef?.dataList?.length">下方显示的是上次成功结果，当前不可打开。</span>
                <span v-else>目前没有可显示的成功结果。</span>
              </template>
              <template v-else>正在读取新筛选结果；下方暂时保留的是上次成功结果。</template>
            </NAlert>
            <n-button
              class="device-group-filter-toggle"
              :type="groupPanelVisible || selectedGroupId ? 'primary' : 'default'"
              size="small"
              :aria-expanded="groupPanelVisible"
              aria-controls="device-group-sidebar"
              @click="toggleGroupPanel"
            >
              <template #icon>
                <NIcon><LayersOutline /></NIcon>
              </template>
              分组
            </n-button>
          </template>
          <template #dense-view="{ filters }">
            <DeviceReadingsCompact
              :filters="toNativeDeviceFilters(filters)"
              :group-id="selectedGroupScope === 'group' ? selectedGroupId : ''"
              :group-scope="selectedGroupScope"
              :group-name="selectedGroupName"
              @open-device="goDeviceDetails"
            />
          </template>
        </data-table-page>
      </main>
    </div>
    <n-drawer v-model:show="active" :height="720" :placement="placement" @after-leave="completeHandAdd">
      <n-drawer-content
        v-if="addKey === 'hands'"
        :title="$t('generate.manually-add-device')"
        class="flex-center pt-24px"
      >
        <n-steps v-if="current === 1" :current="1" :status="currentStatus">
          <n-step :title="$t('custom.devicePage.step1Title')" :description="$t('custom.devicePage.step1Desc')" />
        </n-steps>
        <n-card class="mt-6" bordered border>
          <div v-if="current === 1">
            <AddDevicesStep1
              :set-device-callback="onNativeDeviceRegistered"
              :config-options="configOptions"
              :initial-config-id="initialDeviceConfigId"
              :next-callback="
                () => {
                  current += 1
                }
              "
            />
          </div>
          <div v-else-if="registeredDevice">
            <NativeDeviceRegistrationResult
              :device="registeredDevice"
              :on-back="returnToNativeDeviceList"
              :on-details="openNativeDeviceDetails"
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

<style scoped lang="scss">
.device-manage-page {
  height: 100%;
  min-height: 0;
}

.device-manage-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  gap: 16px;
  overflow: hidden;
}

.device-manage-layout--with-group {
  grid-template-columns: 236px minmax(0, 1fr);
}

.device-group-sidebar {
  position: relative;
  min-width: 0;
  height: 100%;
  box-sizing: border-box;
  padding: 8px 10px 14px;
  overflow: auto;
  background: rgb(var(--primary-color) / 2%);
  border: 1px solid rgb(var(--primary-color) / 8%);
  border-radius: 12px;
}

.device-group-system {
  position: relative;
}

.device-group-system-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  color: var(--text-color-2);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 8px;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    transform 0.18s ease;
}

.device-group-system-item--root {
  height: 40px;
  font-weight: 550;
}

.device-group-system__child {
  position: relative;
  margin: 2px 0 0 14px;
  padding-left: 12px;
}

.device-group-system__child::before {
  position: absolute;
  top: 0;
  bottom: 17px;
  left: 2px;
  width: 1px;
  content: '';
  background: rgb(var(--primary-color) / 12%);
}

.device-group-system-item--child {
  height: 34px;
  padding: 0 8px;
  color: var(--text-color-3);
  font-size: 12px;
}

.device-group-system-item:hover {
  color: var(--primary-color);
  background: rgb(var(--primary-color) / 7%);
}

.device-group-system-item--active {
  color: var(--primary-color);
  background: rgb(var(--primary-color) / 10%);
}

.device-group-system-item--child.device-group-system-item--active {
  background: rgb(var(--primary-color) / 8%);
}

.device-group-system-item:active {
  transform: translateY(1px);
}

.device-group-system-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  color: var(--text-color-3);
}

.device-group-system-item--root .device-group-system-item__icon {
  flex-basis: 24px;
  width: 24px;
  height: 24px;
  color: var(--primary-color);
  background: rgb(var(--primary-color) / 8%);
  border-radius: 6px;
}

.device-group-system-item__label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-group-system-item__count {
  min-width: 20px;
  margin-left: auto;
  color: var(--text-color-3);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.device-group-system-item--active .device-group-system-item__count {
  color: var(--primary-color);
}

.device-group-divider {
  height: 1px;
  margin: 12px 8px 10px;
  background: rgb(var(--primary-color) / 8%);
}

.device-group-tree {
  padding: 0;
}

.device-group-tree :deep(.n-tree) {
  --n-node-border-radius: 8px;
}

.device-group-tree :deep(.n-tree-node-wrapper) {
  padding: 1px 0;
}

.device-group-tree :deep(.n-tree-node-content) {
  min-height: 36px;
  padding: 0 8px 0 4px;
  color: var(--text-color-2);
  border-radius: 8px;
}

.device-group-tree :deep(.n-tree-node-content__prefix) {
  width: 20px;
  margin-right: 6px;
  color: rgb(var(--primary-color) / 68%);
}

.device-group-tree :deep(.n-tree-node-content__text) {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  font-size: 13px;
  font-weight: 450;
}

.device-group-tree :deep(.device-group-tree__label) {
  display: flex;
  min-width: 0;
  align-items: center;
  width: 100%;
  line-height: 20px;
}

.device-group-tree :deep(.device-group-tree__label-text) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-group-tree :deep(.device-group-tree__count) {
  flex: 0 0 auto;
  min-width: 20px;
  margin-left: auto;
  padding-left: 8px;
  color: var(--text-color-3);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.device-group-tree :deep(.n-tree-node-switcher) {
  color: var(--text-color-3);
}

.device-group-tree :deep(.n-tree-node-indent::before),
.device-group-tree :deep(.n-tree-node-indent::after) {
  border-color: rgb(var(--primary-color) / 12%);
}

.device-group-tree :deep(.n-tree-node-content:hover) {
  color: var(--text-color);
  background: rgb(var(--primary-color) / 7%);
}

.device-group-tree :deep(.n-tree-node--selected) {
  color: var(--primary-color);
  background: rgb(var(--primary-color) / 10%);
}

.device-group-tree :deep(.n-tree-node--selected .n-tree-node-content) {
  color: var(--primary-color);
}

.device-group-tree :deep(.n-tree-node--selected .n-tree-node-content__text) {
  font-weight: 600;
}

.device-group-tree :deep(.n-tree-node--selected .n-tree-node-content__prefix),
.device-group-tree :deep(.n-tree-node--selected .n-tree-node-switcher) {
  color: var(--primary-color);
}

.device-manage-content {
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.device-group-filter-toggle {
  flex-shrink: 0;
  height: 36px;
  min-width: 72px;
  border-radius: 8px;
  transition:
    color 0.18s ease,
    background-color 0.18s ease,
    border-color 0.18s ease;
}

.device-group-filter-toggle:not(.n-button--primary):hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

@media (max-width: 900px) {
  .device-manage-layout {
    grid-template-columns: 204px minmax(0, 1fr);
    gap: 12px;
  }

  .device-manage-layout:not(.device-manage-layout--with-group) {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 768px) {
  .device-manage-page {
    height: auto;
  }

  .device-manage-layout {
    display: block;
    height: auto;
    overflow: visible;
  }

  .device-group-sidebar {
    height: auto;
    max-height: 240px;
    margin-bottom: 12px;
  }

  .device-manage-content {
    height: auto;
    overflow: visible;
  }
}
</style>
