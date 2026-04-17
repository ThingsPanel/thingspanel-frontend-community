<script setup lang="tsx">
import { onMounted, ref } from 'vue'
import type { Ref } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NPopconfirm, NSpace } from 'naive-ui'
import {
  addChildDevice,
  childDeviceSelectList,
  childDeviceTableList,
  deviceUpdate,
  removeChildDevice
} from '@/service/api/device'
// import { useRouterPush } from '@/hooks/common/router';
import { $t } from '@/locales'

const router = useRouter()
// const { routerPushByKey } = useRouterPush();
const props = defineProps<{
  id: string
}>()
const showAddDialog = ref(false)
const showSetDialog = ref(false)
const showDeleteDialog = ref(false)
const deviceSetName = ref()
const deviceSetId = ref()
const tableData = ref([])
const total = ref(0)
const log_page = ref(1)
const selectChild = ref<string[]>([])
const sOptions = ref<any[]>([])
const getData = async () => {
  const res = await childDeviceTableList({
    page: log_page.value,
    page_size: 5,
    id: props.id
  })
  tableData.value = res.data.list || []
  total.value = res.data.total
}
const selectConfig = v => {
  selectChild.value = v
}
const deleteDevice = async id => {
  const { error } = await removeChildDevice({
    sub_device_id: id
  })
  if (!error) {
    showDeleteDialog.value = false
    log_page.value = 1
    tableData.value = []
    getData()
  }
}

const handleLook = (id: string) => {
  router.push({ path: 'details-child', query: { d_id: id } })
}

const handleSetAddress = async (id, subDeviceAddr) => {
  deviceSetId.value = id
  showSetDialog.value = true
  deviceSetName.value = subDeviceAddr
}

const columns: Ref<any> = ref([
  {
    title: $t('custom.devicePage.deviceName'),
    minWidth: '140px',
    key: 'name'
  },
  {
    title: $t('custom.devicePage.subDeviceAddress'),
    minWidth: '140px',
    key: 'subDeviceAddr'
  },
  {
    title: $t('common.actions'),
    key: '',
    minWidth: '140px',
    render: row => {
      return (
        <NSpace>
          <NButton type="primary" size="small" onClick={() => handleLook(row.id)}>
            {$t('generate.view')}
          </NButton>
          <NButton type="success" size="small" onClick={() => handleSetAddress(row.id, row.subDeviceAddr)}>
            {$t('generate.setSubDevices')}
          </NButton>
          <NPopconfirm
            negative-text={$t('common.cancel')}
            positive-text={$t('common.confirm')}
            onPositiveClick={() => deleteDevice(row.id)}
          >
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton type="error" size={'small'}>
                  {$t('common.delete')}
                </NButton>
              )
            }}
          </NPopconfirm>
        </NSpace>
      )
    }
  }
]) as Ref<any>

const setDeviceAddress = async () => {
  if (!deviceSetName.value) {
    window.$message?.error($t('generate.enter-sub-device-address'))
    return
  }
  const res = await deviceUpdate({
    id: deviceSetId.value,
    parent_id: props.id,
    sub_device_addr: deviceSetName.value
  })
  if (res) {
    tableData.value = []
    showSetDialog.value = false
    log_page.value = 1
    getData()
  }
}

const addChildDeviceSure = () => {
  if (selectChild.value.length === 0) {
    window.$message?.error($t('generate.selectSubDevices'))
  } else {
    addChildDevice({
      id: props.id,
      son_id: selectChild.value.join(',')
    }).then(res => {
      if (!res.error) {
        showAddDialog.value = false
        selectChild.value = []
        sOptions.value = []
        tableData.value = []
        getData()
      }
    })
  }
}

const getDeviceList = async () => {
  const res = await childDeviceSelectList()
  if (res.data.length !== 0) {
    sOptions.value = []
    const tempSOptions = res.data?.map(item => {
      return { label: item.name, value: item.id }
    })
    sOptions.value = sOptions.value.concat(tempSOptions)
  }
}

const addDevice = () => {
  showAddDialog.value = true
  getDeviceList()
}

getData()

onMounted(() => {})
</script>

<template>
  <n-card class="w-full">
    <NButton type="primary" @click="addDevice">{{ $t('generate.add-sub-device') }}</NButton>
    <n-modal
      v-model:show="showAddDialog"
      preset="dialog"
      :title="$t('generate.add-sub-device')"
      style="width: 520px"
      :showIcon="false"
      :mask-closable="false"
    >
      <n-form class="mt-6" label-placement="left" label-width="auto">
        <n-form-item :label="$t('generate.select-sub-device')">
          <n-select
            v-model:value="selectChild"
            multiple
            max-tag-count="responsive"
            :options="sOptions"
            :virtual-scroll="false"
            @update:value="selectConfig"
          >
            <template #header>{{ $t('page.irrigation.group.deviceName') }}</template>
          </n-select>
        </n-form-item>
      </n-form>
      <template #action>
        <div class="modal-footer">
          <NButton @click="showAddDialog = false">{{ $t('generate.cancel') }}</NButton>
          <NButton type="primary" @click="addChildDeviceSure">{{ $t('page.login.common.confirm') }}</NButton>
        </div>
      </template>
    </n-modal>
    <n-modal v-model:show="showSetDialog" :title="$t('generate.issue-attribute')" class="w-[400px]">
      <n-card>
        <n-form>
          <n-form-item :label="$t('generate.sub-device-address-setting')">
            <n-input v-model:value="deviceSetName" type="text" :placeholder="$t('generate.enter-sub-device-address')" />
          </n-form-item>
          <NSpace style="display: flex; justify-content: flex-end">
            <NButton @click="showSetDialog = false">{{ $t('generate.cancel') }}</NButton>
            <NButton @click="setDeviceAddress">{{ $t('page.login.common.confirm') }}</NButton>
          </NSpace>
        </n-form>
      </n-card>
    </n-modal>

    <n-data-table :columns="columns" :data="tableData" class="mt-4" />
    <div class="mt-4 w-full flex justify-end">
      <n-pagination
        :item-count="total"
        :page-size="5"
        @update:page="
          page => {
            log_page = page
            log_page = page
            getData()
          }
        "
      />
    </div>
  </n-card>
</template>

<style scoped>
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
