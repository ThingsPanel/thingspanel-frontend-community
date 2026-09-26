<script setup lang="ts">
import { ref } from 'vue'
// import { useMessage } from "naive-ui";
import {
  batchAddServiceMenuList,
  createServiceDrop,
  getServiceAccessForm,
  putServiceDrop,
  getServiceListDrop
} from '@/service/api/plugin'
import { $t } from '@/locales'
import FormInput from './form.vue'

// const message = useMessage();
const isEdit = ref<any>(false)
const emit = defineEmits(['getList', 'isEdit'])
const serviceModals = ref<any>(false)
const formRef = ref<any>(null)
const currentStep = ref(1)
const saving = ref(false)

const service_plugin_id = ref<any>('')
const formElements = ref<any>([])
const defaultForm = {
  name: '',
  service_plugin_id: '',
  voucher: {},
  vouchers: {},
  auth_type: 'manual' // 添加模式字段，默认为手动
}
const form = ref<any>({ ...defaultForm })
const rules = ref<any>({
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入接入点名称'
  },
  auth_type: {
    required: true,
    trigger: ['change'],
    message: '请选择模式'
  }
})
const openModal: (id: any, row?: any) => void = async (id, row) => {
  if (row) {
    // 编辑模式：设置 isEdit 为 true 并填充表单数据
    isEdit.value = true
    Object.assign(form.value, row)
    const voucherData = JSON.parse(row.voucher)
    Object.assign(form.value.vouchers, voucherData)
    // 从 voucher 解析的数据中回显 auth_type 到选择模式字段
    if (voucherData.auth_type) {
      form.value.auth_type = voucherData.auth_type
    }
  } else {
    // 新增模式：重置 isEdit 为 false
    isEdit.value = false
  }
  service_plugin_id.value = id
  form.value.service_plugin_id = id
  const data = await getServiceAccessForm({
    service_plugin_id: service_plugin_id.value
  })
  if (data.data) {
    formElements.value = data.data
    serviceModals.value = true
  }
}
const close: () => void = () => {
  serviceModals.value = false
  form.value = { ...defaultForm }
  form.value.vouchers = {}
  currentStep.value = 1
  // 重置编辑状态
  isEdit.value = false
}

const submitSevice: () => void = async () => {
  formRef.value?.validate(async errors => {
    if (errors || saving.value) return
    saving.value = true

    try {
      // 在 vouchers 中添加 auth_type 字段
      form.value.vouchers.auth_type = form.value.auth_type
      form.value.voucher = JSON.stringify(form.value.vouchers)
      const data: any = isEdit.value ? await putServiceDrop(form.value) : await createServiceDrop(form.value)
      const id = isEdit.value ? form.value.id : data?.data?.id

      if (form.value.auth_type === 'auto') {
        if (!id) throw new Error('接入点保存成功，但未返回接入点 ID，无法同步设备')
        const pageSize = 100
        const candidates: any[] = []
        let page = 1
        let total = Number.POSITIVE_INFINITY
        while (candidates.length < total) {
          const response: any = await getServiceListDrop({
            voucher: form.value.voucher,
            service_type: '',
            page,
            page_size: pageSize
          })
          const result = response?.data || {}
          const items = Array.isArray(result.list) ? result.list : []
          total =
            result.total != null && Number.isFinite(Number(result.total))
              ? Number(result.total)
              : Number.POSITIVE_INFINITY
          if (items.length === 0) break
          candidates.push(...items)
          if (items.length < pageSize && !Number.isFinite(total)) break
          page += 1
        }

        const chunkSize = 100
        let imported = 0
        for (let offset = 0; offset < candidates.length; offset += chunkSize) {
          const deviceList = candidates.slice(offset, offset + chunkSize).map(item => ({
            device_name: item.device_name || item.device_number,
            device_number: item.device_number,
            description: item.description,
            protocol_config:
              typeof item.protocol_config === 'string'
                ? item.protocol_config
                : JSON.stringify(item.protocol_config || {}),
            additional_info:
              typeof item.additional_info === 'string'
                ? item.additional_info
                : JSON.stringify(item.additional_info || {})
          }))
          const batch: any = await batchAddServiceMenuList({ service_access_id: id, device_list: deviceList })
          imported += Array.isArray(batch?.data) ? batch.data.length : 0
        }

        window.$message?.success(
          candidates.length === 0
            ? '接入点已保存，未发现可同步的设备'
            : `同步完成：发现 ${candidates.length} 项，本次新增 ${imported} 项，其余已存在`
        )
        serviceModals.value = false
        emit('getList')
      } else {
        serviceModals.value = false
        emit('isEdit', form.value.voucher, id, isEdit.value)
      }

      // 重置表单
      form.value = { ...defaultForm }
      form.value.vouchers = {}
    } catch (error: any) {
      window.$message?.error(error?.response?.data?.message || error?.message || '设备同步失败，请检查接入配置后重试')
    } finally {
      saving.value = false
    }
  })
}

defineExpose({ openModal })
</script>

<template>
  <n-modal
    v-model:show="serviceModals"
    preset="dialog"
    :title="$t('card.addNewAccessPoint')"
    class="w"
    @after-leave="close"
  >
    <n-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      require-mark-placement="right-hanging"
    >
      <n-form-item :label="$t('card.accessPointName')" path="name">
        <n-input v-model:value="form.name" placeholder="请输入接入点名称" />
      </n-form-item>
      <n-form-item :label="$t('common.selectionMode')" path="auth_type">
        <n-radio-group v-model:value="form.auth_type">
          <n-radio value="manual">{{ $t('common.manual') }}</n-radio>
          <n-radio value="auto">{{ $t('common.automatic') }}</n-radio>
        </n-radio-group>
      </n-form-item>
    </n-form>
    <div class="box">
      <FormInput v-model:protocol-config="form.vouchers" :form-elements="formElements"></FormInput>
    </div>
    <div class="footer">
      <NButton type="primary" class="btn" :loading="saving" :disabled="saving" @click="submitSevice">
        {{ $t('card.saveNext') }}
      </NButton>
      <NButton @click="close">{{ $t('common.cancel') }}</NButton>
    </div>
  </n-modal>
</template>

<style lang="scss" scoped>
.selectType {
  width: 100%;
}
.footer {
  display: flex;
  flex-direction: row-reverse;
  .btn {
    margin-left: 10px;
  }
}
.box {
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss">
.w {
  width: 70% !important;
  margin-top: 15vh;
  height: max-content !important;
  max-height: 800px !important;
  overflow: auto;
}
</style>
