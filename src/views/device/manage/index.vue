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
 */

// EventSource 连接实例，专用于设备管理页面的状态监控
let eventSource: EventSourcePolyfill | null = null
// 重连尝试次数计数器
let reconnectAttempts = 0
// 最大重连尝试次数限制
const MAX_RECONNECT_ATTEMPTS = 3

/**
 * 更新表格中设备状态的函数
 * 根据设备ID在当前显示的设备列表中找到对应设备并更新其在线状态
 * @param {string} deviceId - 设备唯一标识ID
 * @param {boolean} isOnline - 设备在线状态：true=在线，false=离线
 */
const updateDeviceStatusInTable = (deviceId: string, isOnline: boolean) => {
  try {
    // 通过表格组件引用获取当前显示的设备数据列表
    if (tablePageRef.value?.dataList && Array.isArray(tablePageRef.value.dataList)) {
      // 在当前页面的设备列表中查找目标设备
      const deviceIndex = tablePageRef.value.dataList.findIndex(
        device => device.device_id === deviceId
      )
      
      if (deviceIndex !== -1) {
        // 找到设备，更新其在线状态 (1=在线, 0=离线)
        tablePageRef.value.dataList[deviceIndex].is_online = isOnline ? 1 : 0
        console.info(`设备 ${deviceId} 状态已更新为 ${isOnline ? '在线' : '离线'}`)
      } else {
        // 设备不在当前页面显示范围内（可能在其他分页或已被过滤）
        console.warn(`设备 ${deviceId} 未在当前表格数据中找到，可能不在当前页面显示范围内`)
      }
    } else {
      console.warn('表格数据未加载或格式异常，无法更新设备状态')
    }
  } catch (error) {
    console.error('更新表格中设备状态时发生错误:', error)
  }
}

/**
 * 创建设备管理页面专用的EventSource连接
 * 建立与后端的实时通信，专门用于更新当前页面表格中的设备状态
 */
const createEventSourceConnection = () => {
  try {
    // 获取用户认证token
    const token = localStg.get('token')
    if (!token) {
      console.warn('未找到用户token，无法建立设备状态监控连接')
      return
    }

    // 清理之前可能存在的连接，避免重复连接
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }

    /**
     * 创建专用于设备管理页面的EventSource连接
     * 与全局的base-layout连接共享同一个端点，但处理逻辑不同：
     * - 全局连接：显示通知 + 播放音效
     * - 页面连接：仅更新表格数据
     */
    eventSource = new EventSourcePolyfill(`${import.meta.env.MODE === 'development' ? '/proxy-default' : ''}/events`, {
      heartbeatTimeout: 3 * 60 * 1000, // 心跳超时：3分钟
      headers: {
        'x-token': token // 用户身份验证
      }
    })

    /**
     * 连接建立成功回调
     * 重置重连计数器，记录连接状态
     */
    eventSource.onopen = () => {
      reconnectAttempts = 0
      console.info('设备管理页面EventSource连接建立成功')
    }

    /**
     * 监听设备状态变化事件
     * 专注于更新当前页面表格中的设备状态显示
     */
    eventSource.addEventListener('device_online', (event: any) => {
      try {
        // 数据安全验证：确保事件数据存在
        if (!event?.data) {
          console.warn('接收到空的设备状态事件数据')
          return
        }

        // 解析服务器推送的JSON数据
        const data = JSON.parse(event.data)
        
        // 验证设备ID字段的有效性
        if (!data.device_id || typeof data.device_id !== 'string') {
          console.warn('设备状态事件中缺少有效的设备ID:', data)
          return
        }

        // 验证在线状态字段的有效性
        if (typeof data.is_online !== 'boolean') {
          console.warn('设备状态事件中在线状态值无效:', data)
          return
        }
        
        /**
         * 调用表格更新函数
         * 仅更新表格显示，不显示通知（避免与全局通知重复）
         */
        updateDeviceStatusInTable(data.device_id, data.is_online)
        
      } catch (parseError) {
        console.error('解析设备状态事件数据失败:', parseError, '原始数据:', event.data)
      }
    })

    /**
     * 错误处理和智能重连机制
     * 采用递增延迟策略，避免频繁重连对服务器造成压力
     */
    eventSource.onerror = (error) => {
      console.error('设备管理页面EventSource连接错误:', error)
      
      // 立即清理当前连接
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }

      // 智能重连：递增延迟策略 (5s -> 10s -> 15s)
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts += 1
        const delay = reconnectAttempts * 5000 // 延迟时间递增
        console.info(`正在尝试重连设备管理页面EventSource (第${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}次尝试)，${delay/1000}秒后重连`)
        
        setTimeout(() => {
          createEventSourceConnection()
        }, delay)
      } else {
        console.error('设备管理页面EventSource重连次数已达上限，停止重连尝试')
      }
    }

  } catch (error) {
    console.error('创建设备管理页面EventSource连接失败:', error)
  }
}

/**
 * 清理EventSource连接
 * 确保页面切换或组件销毁时正确释放连接资源，防止内存泄漏
 */
const cleanupEventSource = () => {
  if (eventSource) {
    eventSource.close()
    eventSource = null
    console.info('设备管理页面EventSource连接已清理')
  }
  // 重置重连计数器
  reconnectAttempts = 0
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
 * 组件挂载完成后建立设备状态监控连接
 * 确保页面加载完成后立即开始监控当前页面中设备的状态变化
 */
onMounted(() => {
  createEventSourceConnection()
})

/**
 * 组件卸载前清理EventSource连接
 * 确保用户离开设备管理页面时正确清理资源，避免内存泄漏
 */
onUnmounted(() => {
  cleanupEventSource()
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
