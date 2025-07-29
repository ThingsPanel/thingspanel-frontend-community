<script setup lang="ts">
import type { Ref } from 'vue'
import { computed, getCurrentInstance, h, onMounted, ref } from 'vue'
import type { DataTableColumns, FormInst } from 'naive-ui'
import { NButton, NDataTable, NFlex, NForm, NFormItem, NModal, NPagination, NPopconfirm, useMessage } from 'naive-ui'
import moment from 'moment/moment'
import { deviceConfigBatch, deviceDelete, deviceList, getDeviceListForSelect } from '@/service/api'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'
import DeviceSelectWithScroll from './DeviceSelectWithScroll.vue'

const message = useMessage()

interface Props {
  deviceConfigId?: string
}

const props = withDefaults(defineProps<Props>(), {
  deviceConfigId: ''
})
const visible = ref(false)
const associatedFormRef = ref<HTMLElement & FormInst>()

interface AssociatedFormType {
  device_ids: string[] | null
  device_config_id: string
}
const associatedForm = ref<AssociatedFormType>(defaultAssociatedForm())
const deviceOptions = ref<Api.Device.DeviceSelectItem[]>([])
const hasMoreDevices = ref(true)
const loadingMore = ref(false)

const queryDevice = ref({
  page: 1,
  page_size: 30
})

function initQueryDevice() {
  queryDevice.value = {
    page: 1,
    page_size: 30
  }
  deviceOptions.value = []
  hasMoreDevices.value = true
}

function defaultAssociatedForm() {
  return {
    device_ids: null,
    device_config_id: ''
  }
}

const queryData = ref({
  device_config_id: props.deviceConfigId,
  page: 1,
  page_size: 10
})

const associatedFormRules = ref({
  // device_ids: {
  //   required: true,
  //   message: '请选择设备',
  //   trigger: 'change'
  // },
})

const addDevice = () => {
  visible.value = true
}
const modalClose = () => {
  initQueryDevice()
  associatedForm.value = defaultAssociatedForm()
}
const handleSubmit = async () => {
  await associatedFormRef?.value?.validate()

  if (!associatedForm.value.device_ids || associatedForm.value.device_ids.length === 0) {
    message.warning($t('custom.associatedDevices.selectDeviceFirst'))
    return
  }

  associatedForm.value.device_config_id = props.deviceConfigId
  const { error } = await deviceConfigBatch(associatedForm.value)
  if (!error) {
    message.success($t('common.addSuccess') || 'Added successfully')
    handleClose()
  }
}
const handleClose = () => {
  associatedFormRef.value?.restoreValidation()
  associatedForm.value = defaultAssociatedForm()
  visible.value = false
  queryData.value.page = 1
  getDeviceList()
}

const getDeviceOptions = async (isInitialLoad = false) => {
  if (loadingMore.value) {
    console.warn('Load request ignored, already loading.')
    return
  }
  if (!isInitialLoad && !hasMoreDevices.value) return

  if (isInitialLoad) {
    queryDevice.value.page = 1
    deviceOptions.value = []
    hasMoreDevices.value = true
  }

  loadingMore.value = true

  const params: Api.Device.DeviceSelectorParams = {
    page: String(queryDevice.value.page),
    page_size: String(queryDevice.value.page_size),
    has_device_config: false
  }

  try {
    const { data, error } = await getDeviceListForSelect(params)

    if (!error && data?.list) {
      deviceOptions.value.push(...data.list)

      if (data.list.length < queryDevice.value.page_size) {
        // eslint-disable-next-line require-atomic-updates
        hasMoreDevices.value = false
      } else {
        // eslint-disable-next-line require-atomic-updates
        hasMoreDevices.value = true
      }
    } else {
      // eslint-disable-next-line require-atomic-updates
      hasMoreDevices.value = false
      if (error) {
        message.error($t('common.fetchDataFailed'))
      }
    }
  } catch (apiError) {
    message.error($t('common.networkError'))
    // eslint-disable-next-line require-atomic-updates
    hasMoreDevices.value = false
  } finally {
    // eslint-disable-next-line require-atomic-updates
    loadingMore.value = false
  }
}

const handleLoadMoreDevices = () => {
  queryDevice.value.page += 1
  getDeviceOptions()
}

const handleInitialLoadDevices = () => {
  getDeviceOptions(true)
}

const configDevice = ref([])
const configDeviceTotal = ref(0)
const getDeviceList = async () => {
  queryData.value.device_config_id = props.deviceConfigId
  const { data, error } = await deviceList(queryData.value)
  if (!error && data?.list) {
    data.list.forEach(sitem => {
      sitem.activate_flag = sitem.is_online === 0 ? $t('custom.devicePage.offline') : $t('custom.devicePage.online')
    })
    configDevice.value = data.list || []
    configDeviceTotal.value = data.total || 0
  } else {
    configDevice.value = []
    configDeviceTotal.value = 0
  }
}

const handleDelete = async row => {
  const { error } = await deviceDelete({
    device_id: row.id,
    device_config_id: ''
  })
  if (!error) {
    message.success($t('card.removeSuccess') || 'Removed successfully')
    getDeviceList()
  }
}

const columnsData: Ref<DataTableColumns<any>> = ref([
  {
    key: 'name',
    minWidth: '140px',
    title: $t('custom.devicePage.deviceName')
  },
  {
    key: 'device_number',
    minWidth: '140px',
    title: $t('page.irrigation.group.deviceCode')
  },
  {
    key: 'activate_flag',
    minWidth: '140px',
    title: $t('custom.devicePage.onlineStatus')
  },
  {
    key: 'ts',
    minWidth: '140px',
    title: $t('custom.devicePage.pushTime'),
    render: row => {
      if (row.ts) {
        return moment(row.ts).format('YYYY-MM-DD HH:mm:ss')
      }
      return ''
    }
  },
  {
    key: 'actions',
    title: () => $t('common.actions'),
    align: 'center',
    width: '250px',
    render: row => {
      return h(
        NPopconfirm,
        {
          onPositiveClick: () => handleDelete(row)
        },
        {
          default: () => $t('common.confirmDelete'),
          trigger: () => {
            return h(
              NButton,
              {
                type: 'error',
                size: 'small',
                onClick: e => {
                  e.stopPropagation()
                }
              },
              { default: () => $t('common.remove') }
            )
          }
        }
      )
    }
  }
])

const { routerPushByKey } = useRouterPush()
const rowProps = (row: any) => {
  return {
    style: 'cursor: pointer;',
    onClick: () => {
      routerPushByKey('device_details', {
        query: {
          d_id: row.id
        }
      })
    }
  }
}
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
onMounted(async () => {
  await getDeviceList()
})
</script>

<template>
  <div class="associated-box">
    <NButton type="primary" @click="addDevice()">{{ $t('generate.+add-device') }}</NButton>
    <n-data-table
      :columns="columnsData"
      :data="configDevice"
      size="small"
      :row-key="item => item.id"
      class="table-class"
      :row-props="rowProps"
    />

    <div class="pagination-box">
      <NPagination
        v-model:page="queryData.page"
        :page-size="queryData.page_size"
        :item-count="configDeviceTotal"
        @update:page="getDeviceList"
      />
    </div>
    <NModal
      v-model:show="visible"
      :mask-closable="false"
      :title="$t('generate.add-device')"
      :class="getPlatform ? 'w-90%' : 'w-600px'"
      preset="card"
      @after-leave="modalClose"
    >
      <NForm
        ref="associatedFormRef"
        :model="associatedForm"
        :rules="associatedFormRules"
        label-placement="left"
        label-width="auto"
      >
        <NFormItem :label="$t('page.irrigation.rotation.chooseDevice')" path="device_ids">
          <DeviceSelectWithScroll
            v-model:modelValue="associatedForm.device_ids"
            :options="deviceOptions"
            :loading="loadingMore"
            :has-more="hasMoreDevices"
            :placeholder="$t('page.irrigation.rotation.chooseDevice') || '请选择设备'"
            @load-more="handleLoadMoreDevices"
            @initial-load="handleInitialLoadDevices"
          />
        </NFormItem>
        <NFlex justify="flex-end">
          <NButton @click="handleClose">{{ $t('generate.cancel') }}</NButton>
          <NButton
            type="primary"
            :disabled="!associatedForm.device_ids || associatedForm.device_ids.length === 0"
            @click="handleSubmit"
          >
            {{ $t('generate.add') }}
          </NButton>
        </NFlex>
      </NForm>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.associated-box {
  height: 100%;
}

.pagination-box {
  display: flex;
  justify-content: flex-end;
}

.table-class {
  margin: 10px;
  height: 50%;
}
</style>
