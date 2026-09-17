<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NButton, NEmpty, NModal, NSelect, NSpace, NSpin, NTable } from 'naive-ui'
import {
  fetchUserDevicePermissions,
  updateUserDevicePermissions,
  type UserDevicePermissionItem
} from '@/service/api/auth'

interface Props {
  visible: boolean
  user?: UserManagement.User | null
}

const props = withDefaults(defineProps<Props>(), { user: null })
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void; (e: 'success'): void }>()

const loading = ref(false)
const saving = ref(false)
const devices = ref<UserDevicePermissionItem[]>([])
const modalVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})
const accessOptions = [
  { label: '不授权', value: '' },
  { label: '只读', value: 'read' },
  { label: '管理', value: 'manage' }
]

async function loadPermissions() {
  if (!props.user?.id) return
  loading.value = true
  try {
    const { data } = await fetchUserDevicePermissions(props.user.id)
    devices.value = data?.devices ?? []
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!props.user?.id) return
  saving.value = true
  try {
    const assignments = devices.value
      .filter(device => device.access_level)
      .map(device => ({ device_id: device.device_id, access_level: device.access_level as 'read' | 'manage' }))
    const response = await updateUserDevicePermissions(props.user.id, assignments)
    if (!response.error) {
      window.$message?.success('设备权限已保存')
      modalVisible.value = false
      emit('success')
    }
  } finally {
    saving.value = false
  }
}

watch(
  () => props.visible,
  visible => {
    if (visible) loadPermissions()
  }
)
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" title="设备权限" class="w-760px">
    <NSpin :show="loading">
      <div class="mb-12px text-14px text-gray-500">
        为 {{ props.user?.name || props.user?.email }} 配置可见和可管理的设备。未授权设备不会出现在设备列表中。
      </div>
      <NTable v-if="devices.length" :single-line="false" striped>
        <thead>
          <tr>
            <th>设备名称</th>
            <th>设备编号</th>
            <th class="w-140px">权限</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="device in devices" :key="device.device_id">
            <td>{{ device.device_name || '未命名设备' }}</td>
            <td>{{ device.device_number }}</td>
            <td>
              <NSelect v-model:value="device.access_level" size="small" :options="accessOptions" />
            </td>
          </tr>
        </tbody>
      </NTable>
      <NEmpty v-else description="当前租户暂无已激活设备" />
      <NSpace justify="end" class="mt-16px">
        <NButton @click="modalVisible = false">取消</NButton>
        <NButton type="primary" :loading="saving" @click="submit">保存</NButton>
      </NSpace>
    </NSpin>
  </NModal>
</template>
