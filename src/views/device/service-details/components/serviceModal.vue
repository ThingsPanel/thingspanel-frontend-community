<script setup lang="ts">
import { ref } from 'vue'
// import { useMessage } from "naive-ui";
import { createServiceDrop, getServiceAccessForm, putServiceDrop, getServiceListDrop } from '@/service/api/plugin'
import { $t } from '@/locales'
import FormInput from './form.vue'

// const message = useMessage();
const isEdit = ref<any>(false)
const emit = defineEmits(['getList', 'isEdit'])
const serviceModals = ref<any>(false)
const formRef = ref<any>(null)
const currentStep = ref(1)

const service_plugin_id = ref<any>('')
const formElements = ref<any>([])
const createDefaultForm = () => ({
  name: '',
  service_plugin_id: '',
  voucher: '',
  vouchers: {}
})
const form = ref<any>(createDefaultForm())
const rules = ref<any>({
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: '请输入接入点名称'
  }
})

const resetForm = () => {
  form.value = createDefaultForm()
}

const parseVoucher = (value: unknown) => {
  if (!value) return {}
  if (typeof value === 'object') return { ...(value as Record<string, unknown>) }
  if (typeof value !== 'string') return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const openModal = async (id: any, row?: any) => {
  resetForm()
  formElements.value = []
  if (row) {
    // 编辑模式：设置 isEdit 为 true 并填充表单数据
    isEdit.value = true
    Object.assign(form.value, row)
    const voucherData = parseVoucher(row.voucher)
    Object.assign(form.value.vouchers, voucherData)
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
  resetForm()
  currentStep.value = 1
  // 重置编辑状态
  isEdit.value = false
}

const submitSevice: () => void = async () => {
  formRef.value?.validate(async errors => {
    if (errors) return

    try {
      form.value.voucher = JSON.stringify(form.value.vouchers)
      const response: any = isEdit.value ? await putServiceDrop(form.value) : await createServiceDrop(form.value)
      const accessPointId = form.value.id || response?.data?.id

      if (!accessPointId) {
        window.$message?.error('接入点保存成功状态未知，请刷新列表后重试')
        emit('getList')
        serviceModals.value = false
        return
      }

      try {
        await getServiceListDrop({
          voucher: form.value.voucher,
          service_type: '',
          page: 1,
          page_size: 10
        })
      } catch (error: any) {
        const message =
          error?.response?.data?.message || error?.message || '接入点已保存，但设备发现失败，请检查凭据或上游连接后再试'
        window.$message?.error(message)
        emit('getList')
        serviceModals.value = false
        return
      }

      serviceModals.value = false
      emit(
        'isEdit',
        form.value.voucher,
        {
          id: accessPointId,
          name: form.value.name
        },
        isEdit.value
      )

      resetForm()
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || '保存接入点失败'
      window.$message?.error(message)
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
    </n-form>
    <div class="box">
      <FormInput v-model:protocol-config="form.vouchers" :form-elements="formElements"></FormInput>
    </div>
    <div class="footer">
      <NButton type="primary" class="btn" @click="submitSevice">{{ $t('card.saveNext') }}</NButton>
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
