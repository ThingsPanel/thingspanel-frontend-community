<script setup lang="tsx">
import { onBeforeMount, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { DrawerPlacement, StepsProps } from 'naive-ui'
import { NSpace, NTag,NButton } from 'naive-ui'
import _ from 'lodash'
import type { TreeSelectOption } from 'naive-ui/es/tree-select/src/interface'
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
  // console.log(pattern, '我请求了筛选');

  const res = await getDeviceConfigList({
    page: 1,
    page_size: 99
    // device_type: pattern
  })
  let options: any[] = []
  if (res.data && res.data.list) {
    options = res.data.list
  }
  configOptions.value = [{ name: "不限设备模板", id: '' }, ...options]

  return configOptions.value
}

const columns_to_show: Ref<any> = ref([
  {
    key: 'name',
    minWidth: '180px',
    label: () => "设备名称",
    render: (row: any) => {
      return <NButton type="primary" text onClick={() => goDeviceDetails(row)}>{row.name}</NButton>
    }
  },
  
 
  {
    key: 'is_online',
    minWidth: '100px',
    label: () => "在线状态",
    render: row => {
      if (row?.is_online === 1) {
        return (
          <NSpace>
            <NTag type="success">{"在线"}</NTag>
          </NSpace>
        )
      }
      return (
        <NSpace>
          <NTag type="default"  style="color: #999;">{"离线"}</NTag>
        </NSpace>
      )
    }
  },
  {
    key: 'warn_status',
    minWidth: '100px',
    label: () => "告警",
    render: row => {
      if (row?.warn_status === 'Y') {
        return (
          <NSpace>
            <NTag type="warning" style="color: #ff9900;">
              {"告警"}
            </NTag>
          </NSpace>
        )
      }
      return (
        <NSpace>
          <NTag type="default" style="color: #999;">
            {"未告警"}
          </NTag>
        </NSpace>
      )
    }
  },
  {
    key: 'device_type',
    minWidth: '100px',
    label: () => "设备类型",
    render: row => {
      if (row?.device_type === '1') {
        return "直连设备"
      } else if (row?.device_type === '2') {
        return "网关"
      } else if (row?.device_type === '3') {
        return "网关子设备"
      }
      return '-'
    }
  },
  {
    key: 'device_config_name',
    minWidth: '100px',
    label: () => "设备模板"
  },
  {
    key: 'device_type',
    minWidth: '160px',
    label: () => "通过服务/协议",
    render: row => {
      if (row?.access_way === '') return '-'
      return row?.access_way === 'A'
        ? `${"通过协议"}(${row?.protocol_type || '-'})`
        : `${"通过服务"}(${row?.protocol_type || '-'})`
    }
  },
  {
    key: 'ts',
    minWidth: '140px',
    label: () => "上报时间"
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
    label: 'custom.devicePage.selectGroup',
    type: 'tree-select',
    multiple: false,
    initValue: query.group_id,
    options: [{ label: "分组", key: '' }],
    loadOptions: getDeviceGroupOptions
  },
  {
    key: 'device_config_id',
    label: 'custom.devicePage.unlimitedDeviceConfig',
    type: 'select',
    options: [],
    initValue: query.device_config_id,
    labelField: 'name',
    valueField: 'id',
    loadOptions: getDeviceConfigOptions
  },
  {
    key: 'is_online',
    label: 'custom.devicePage.unlimitedOnlineStatus',
    type: 'select',
    initValue: query.is_online,
    options: [
      { label: () => "不限在线状态", value: '' },
      { label: () => "在线", value: 1 },
      { label: () => "离线", value: 0 }
    ]
  },
  {
    key: 'warn_status',
    label: 'custom.devicePage.unlimitedAlarmStatus',
    type: 'select',
    initValue: query.warn_status,
    options: [
      { label: () => "不限告警状态", value: '' },
      { label: () => "告警", value: 'Y' },
      { label: () => "不告警", value: 'N' }
    ]
  },
  {
    key: 'device_type',
    label: 'custom.devicePage.unlimitedAccessType',
    initValue: query.device_type,
    type: 'select',
    options: [
      { label: "不限设备类型", value: '' },
      { label: "直连设备", value: '1' },
      { label: "网关", value: '2' },
      { label: "网关子设备", value: '3' }
      // { label: "通过协议", value: 'A' },
      // { label: "通过服务", value: 'B' }
    ]
  },
  {
    key: 'service_identifier',
    label: 'card.anyProtocolService',
    type: 'select',
    initValue: query.service_identifier,
    options: [{ label: "不限协议/服务", value: '' }]
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
const dropOption = [
  {
    label: () => "手动添加",
    key: 'hands'
  },
  {
    label: () => "通过编码添加",
    key: 'number',
    disabled: true
  },
  {
    label: () => "通过服务添加",
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
        { label: "不限协议/服务", value: '' },
        {
          type: 'group',
          label: "协议",
          key: 'protocol',
          children: [...protocolOptions]
        },
        {
          type: 'group',
          label: "服务",
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

const topActions = [
  {
    element: () => (
      <n-dropdown options={dropOption} trigger="hover" onSelect={handleSelect}>
        <n-button type="primary">+{"添加设备"}</n-button>
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
  console.log('tablePageRef in completeHandAdd:', tablePageRef.value)

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
        :title="手动添加设备"
        class="flex-center pt-24px"
      >
        <n-steps :current="current" :status="currentStatus">
          <n-step :title="创建设备" :description="创建设备的基本信息" />
          <n-step :title="配置设备端" :description="根据系统提供的连接配置参数配置设备" />
          <n-step :title="配置设备完成" :description="如果设备端配置完成，则完成设备添加" />
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
        :title="通过编码添加"
      >
        <n-h4 align-text>
          <n-li>
            <NText strong>{{ "输入设备编码立即完成设备添加" }}</NText>
          </n-li>
        </n-h4>
        <div style="display: flex; margin-bottom: 20px">
          <n-input
            v-model:value="deviceNumber"
            :placeholder="请输入设备编码"
            class="max-w-240px"
          ></n-input>
          <NText v-if="showMessage" :style="messageStyle">
            {{
              buttonDisabled
                ? "设备编码不可用"
                : "请输入设备编码"
            }}
          </NText>
        </div>
        <n-button type="primary" :disabled="buttonDisabled" @click="completeAdd">
          {{ "完成" }}
        </n-button>
      </n-drawer-content>
      <n-drawer-content
        v-if="addKey === 'server'"
        class="flex-center pt-24px"
        :title="通过服务添加"
      >
        <n-steps :current="currentServer" :status="currentServerStatus">
          <n-step
            :title="选择服务"
            :description="这是一段很长很长的描述性文字"
          />
          <n-step
            :title="配置服务"
            :description="这是一段很长很长的描述性文字"
          />
          <n-step :title="配置设备完成" :description="如果设备端配置完成，则完成设备添加" />
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
