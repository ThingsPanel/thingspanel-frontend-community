<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FormInst } from 'naive-ui'
import { useMessage } from 'naive-ui'
import { deviceAdd, deviceConfigInfo, deviceTemplateDetail } from '@/service/api/device'
import { checkThingmodelAvailability, thingModelApi } from '@/service/thingmodel'
import { extractLegacyThingModelBinding } from '@/views/device/template/thing-model-binding'
import { $t } from '@/locales'

const props = defineProps<{
  configOptions: any[]
  nextCallback: () => void
  setIdCallback: (dId, cId, dobj) => void
}>()
const formRef = ref<FormInst | null>(null)
const message = useMessage()
const formValue = ref({
  name: '',
  label: [],
  device_config_id: ''
})

const thingModelInfo = ref<{
  name: string
  status?: string
  snapshotId?: string
} | null>(null)
const thingModelInfoLoading = ref(false)

const rules = {
  name: {
    required: true,
    message: $t('custom.devicePage.enterDeviceName'),
    trigger: 'blur'
  }
}

async function resolveThingModelInfo(configId: string) {
  if (!configId) {
    thingModelInfo.value = null
    return
  }

  thingModelInfoLoading.value = true
  thingModelInfo.value = null

  try {
    const encoreAvailable = await checkThingmodelAvailability()
    if (!encoreAvailable) return

    let templateId = props.configOptions.find(option => option.id === configId)?.device_template_id

    if (!templateId) {
      const configRes = await deviceConfigInfo({ id: configId })
      templateId = configRes.data?.device_template_id
    }

    if (!templateId) return

    const templateRes = await deviceTemplateDetail({ id: templateId })
    const binding = extractLegacyThingModelBinding(templateRes.data)
    if (!binding?.thingModelId) return

    const thingModelRes = await thingModelApi.get(binding.thingModelId)
    const thingModel = (thingModelRes as any).data ?? thingModelRes

    if (!thingModel?.name) return

    thingModelInfo.value = {
      name: thingModel.name,
      status: thingModel.status,
      snapshotId: binding.thingModelSnapshotId || thingModel.current_snapshot_id
    }
  } catch {
    thingModelInfo.value = null
  } finally {
    thingModelInfoLoading.value = false
  }
}

watch(
  () => formValue.value.device_config_id,
  configId => {
    resolveThingModelInfo(configId)
  }
)

function handleValidateClick(e: MouseEvent) {
  e.preventDefault()
  formRef.value?.validate(async errors => {
    if (!errors) {
      const res = await deviceAdd({ ...formValue.value, label: formValue.value.label.join(','), access_way: 'A' })
      const configId = formValue.value.device_config_id
      const deviceId = res.data.id
      props.setIdCallback(deviceId, configId, res.data.voucher)
      props.nextCallback()
    } else {
      message.error($t('custom.devicePage.validationFailed'))
    }
  })
}
</script>

<template>
  <div>
    <n-card :bordered="false">
      <n-form ref="formRef" :label-width="80" :model="formValue" :rules="rules" size="small">
        <n-form-item :label="$t('custom.devicePage.deviceName')" path="name">
          <n-input v-model:value="formValue.name" :placeholder="$t('custom.devicePage.inputDeviceName')" />
        </n-form-item>
        <n-form-item :label="$t('custom.devicePage.label')" path="label">
          <n-dynamic-tags v-model:value="formValue.label" />
        </n-form-item>
        <n-form-item :label="$t('device_template.equipmentConfig')" path="device_config_id">
          <n-select
            v-model:value="formValue.device_config_id"
            :placeholder="$t('custom.devicePage.selectDeviceConfig')"
            label-field="name"
            value-field="id"
            :options="configOptions"
            filterable
          />
        </n-form-item>
        <n-form-item v-if="thingModelInfoLoading || thingModelInfo" :label="$t('generate.linked-thing-model')">
          <n-spin :show="thingModelInfoLoading" size="small">
            <div v-if="thingModelInfo" class="thing-model-info">
              <span>{{ thingModelInfo.name }}</span>
              <span v-if="thingModelInfo.status" class="info-meta">
                · {{ $t('generate.thing-model-status') }}: {{ thingModelInfo.status }}
              </span>
              <span v-if="thingModelInfo.snapshotId" class="info-meta">
                · snapshot: {{ thingModelInfo.snapshotId.slice(0, 8) }}
              </span>
            </div>
          </n-spin>
        </n-form-item>
        <n-form-item>
          <n-button type="primary" attr-type="button" @click="handleValidateClick">
            {{ $t('custom.devicePage.saveAndNext') }}
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>
  </div>
</template>

<style scoped>
.thing-model-info {
  font-size: 13px;
  color: #666;
}

.info-meta {
  color: #999;
}
</style>
