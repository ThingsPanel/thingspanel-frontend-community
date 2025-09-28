<script setup lang="tsx">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { TransferRenderSourceList } from 'naive-ui'
import { NTree } from 'naive-ui'
import {
  deleteDeviceGroupRelation,
  deleteDevice,
  deviceDetail,
  deviceGroupRelation,
  deviceGroupTree,
  deviceLocation,
  deviceUpdateConfig,
  getDeviceConfigList,
  getDeviceGroupRelation
} from '@/service/api'
import { useDeviceDataStore } from '@/store/modules/device'
import { useTabStore } from '@/store/modules/tab'
import { getTabIdByRoute } from '@/store/modules/tab/shared'
import { $t } from '@/locales'

const props = defineProps<{
  id: string
  online: string
}>()
const valueRef = ref<Array<string | number>>([])
const device_coding = ref<string>('')
const emit = defineEmits(['change'])
const is_online = ref<string>('')
const treeData = ref()
type Option = {
  label: string
  value: string
  children?: Option[]
}
const options = ref<Option[]>()
const sOptions = ref<any[]>([{ label: $t('generate.unbind'), value: '' }])
const route = useRoute()
const { query } = route
const { removeTab } = useTabStore()
const currentTabId = getTabIdByRoute(route)
const deviceConfigList = async name => {
  const { data, error } = await getDeviceConfigList({
    page: 1,
    page_size: 99,
    name
  })
  if (!error && data) {
    const tempSOptions = data?.list?.map(item => {
      return { label: item.name, value: item.id }
    })
    sOptions.value = sOptions.value.concat(tempSOptions)
  }
}

function transformDataToOptions(data) {
  // 定义转换函数
  const transform = item => {
    // 基本转换
    const option = {
      label: item.group.name,
      value: item.group.id,
      children: undefined
    }

    // 如果存在子项，则递归转换
    if (item.children && item.children.length > 0) {
      option.children = item.children.map(transform)
    }

    return option
  }

  // 对输入的数据应用转换函数
  return data.map(transform)
}

const getTreeData = async () => {
  const { data, error } = await deviceGroupTree({})
  if (!error && data) {
    treeData.value = transformDataToOptions(data)
    options.value = flattenTree(treeData.value)
  }
}
const getTreeRelationData = async () => {
  const { data, error } = await getDeviceGroupRelation({ device_id: props.id })
  if (!error && data) {
    valueRef.value = data?.map(item => item.group_id)
  }
}
const deviceDataStore = useDeviceDataStore()
const selectedValues = ref('')

function flattenTree(list: undefined | Option[]): Option[] {
  const result: Option[] = []

  function flatten(_list: Option[] = []) {
    _list.forEach(item => {
      result.push(item)
      flatten(item.children)
    })
  }

  flatten(list)
  return result
}

const handleUpdateValue = async () => {
  const { error }: any = await deviceLocation({
    id: props.id,
    is_online: Number(is_online.value)
  })
  !error && emit('change')
}
const renderSourceList: TransferRenderSourceList = ({ pattern }) => {
  return (
    <NTree
      data={treeData.value}
      style="margin: 0 4px;"
      checkedKeys={valueRef.value}
      keyField="value"
      defaultExpandAll
      checkable
      checkOnClick
      blockLine
      selectable={false}
      onUpdateCheckedKeys={(keys, _option, meta) => {
        valueRef.value = keys
        if (meta.node) {
          if (meta.action === 'check') {
            deviceGroupRelation({
              group_id: meta.node.value,
              device_id_list: [props.id]
            })
          } else {
            deleteDeviceGroupRelation({
              group_id: meta.node.value,
              device_id: props.id
            })
          }
        }
        //
      }}
      pattern={pattern}
    />
  )
}
watch(
  () => valueRef.value,
  (value, oldValue) => {
    if (oldValue.length > value.length) {
      const difference = oldValue.filter(x => !value.includes(x))
      difference.forEach(item => {
        deleteDeviceGroupRelation({ group_id: item, device_id: props.id })
      })
    }
  }
)

const initData = async () => {
  const result = await deviceDetail(query.d_id as string)
  device_coding.value = result?.data?.device_number
  selectedValues.value = result?.data?.device_config_id || ''
  getTreeData()
  getTreeRelationData()
}

onMounted(() => {
  //  is_online.value = String(props.online)
  initData()
  deviceConfigList('')
})

const selectConfig = v => {
  selectedValues.value = v
  deviceUpdateConfig({ device_id: props.id, device_config_id: v })
  deviceDataStore.fetchData(props.id)
  initData()
  emit('change')
}

const handleDeleteDevice = () => {
  // 二次确认删除
  window.$dialog?.warning({
    title: $t('common.delete'),
    content: $t('common.confirmDelete'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      deleteD(props.id)
    }
  })
}

const deleteD = async (id: string) => {
  try {
    await deleteDevice({ id })
    window.$message?.success($t('common.deleteSuccess'))
    // 关闭当前标签页
    removeTab(currentTabId)
  } catch (error) {
    console.error('删除设备失败:', error)
  }
}
</script>

<template>
  <div class="flex-col gap-16px p-t-10px">
    <div class="flex items-center">
      <div>{{ $t('card.configTemplate') }}：</div>
      <NSelect
        v-model:value="selectedValues"
        filterable
        class="w-200px"
        :options="sOptions"
        @update:value="selectConfig"
        @search="deviceConfigList"
      />
    </div>
    <div class="flex items-center gap-13px">
      <span>{{ $t('generate.deviceCode') }}</span>
      <span>{{ device_coding }}</span>
    </div>

    <div class="flex items-center">
      {{ $t('generate.device-firmware') }}
      <span class="ml-4">{{ deviceDataStore?.deviceData?.current_version || '--' }}</span>
    </div>

    <div class="flex items-center">
      <n-button type="error" size="small" @click="handleDeleteDevice">
        {{ $t('common.delete') }}
      </n-button>
    </div>

    <div class="flex-1">
      <div class="mb-4">{{ $t('generate.device-group') }}</div>
      <n-transfer
        v-model:value="valueRef"
        :options="options"
        :render-source-list="renderSourceList"
        source-filterable
      />
    </div>
  </div>
</template>

<style scoped></style>
