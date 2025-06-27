<script lang="ts" setup>
import { ref, watch } from 'vue'
import type { FormInst } from 'naive-ui'
import { $t } from '@/locales'
// import {useMessage} from 'naive-ui';
import { deviceConfigAdd, deviceConfigEdit, deviceTemplate } from '@/service/api/device'

// const message = useMessage();

interface Props {
  modalVisible?: boolean
  modalType?: string
}

const props = withDefaults(defineProps<Props>(), {
  modalVisible: false,
  modalType: 'add'
})
const modalTitle = ref("添加")
const configForm = ref(defaultConfigForm())

function defaultConfigForm() {
  return {
    additional_info: null,
    description: null,
    device_conn_type: null,
    device_template_id: null,
    device_type: null,
    name: null,
    protocol_config: null,
    protocol_type: null,
    remark: null,
    voucher_type: null
  }
}

const configFormRules = ref({
  name: {
    required: true,
    message: "设备配置名称",
    trigger: 'blur'
  },
  device_type: {
    required: true,
    message: "设备接入类型",
    trigger: 'change'
  },
  device_conn_type: {
    required: true,
    message: "设备连接方式",
    trigger: 'change'
  }
})
const deviceTemplateOptions = ref([])
const getDeviceTemplate = () => {
  const paramsData = {
    page: 1,
    page_size: 100
  }
  deviceTemplate(paramsData).then(res => {
    deviceTemplateOptions.value = res.data.list
  })
}

interface Emits {
  (e: 'modalClose'): void

  (e: 'submitted'): void
}

const emit = defineEmits<Emits>()
const visible = ref(false)
watch(
  () => props.modalVisible,
  newValue => {
    visible.value = newValue
    if (props.modalType === 'add') {
      modalTitle.value = "添加"
    } else {
      modalTitle.value = "编辑"
    }
    getDeviceTemplate()
  }
)
const modalClose = () => {
  emit('modalClose')
}

const deviceTemplateScroll = () => {}
const configFormRef = ref<HTMLElement & FormInst>()
const handleClose = () => {
  configFormRef.value?.restoreValidation()
  configForm.value = defaultConfigForm()
  visible.value = false
  modalClose()
}
// 提交表单
const handleSubmit = async () => {
  await configFormRef?.value?.validate()
  if (props.modalType === 'add') {
    const res = await deviceConfigAdd(configForm.value)
    if (!res.error) {
      // message.success('新增成功');
    }
  } else {
    const res = await deviceConfigEdit(configForm.value)
    if (!res.error) {
      // message.success('修改成功');
    }
  }
  handleClose()
  emit('submitted')
}
</script>

<template>
  <div class="overflow-hidden">
    <NCard :title="`${modalTitle}${"设备模板"}`">
      <NForm ref="configFormRef" :model="configForm" :rules="configFormRules" label-placement="left" label-width="auto">
        <NFormItem :label="设备模板名称" path="name">
          <NInput v-model:value="configForm.name" :placeholder="请输入设备名称" />
        </NFormItem>
        <NFormItem :label="选择设备模型" path="device_template_id">
          <NSelect
            v-model:value="configForm.device_template_id"
            :options="deviceTemplateOptions"
            label-field="name"
            value-field="id"
            @scroll="deviceTemplateScroll"
          ></NSelect>
        </NFormItem>
        <NFormItem :label="设备接入类型" path="device_type">
          <n-radio-group v-model:value="configForm.device_type" name="device_type">
            <n-space>
              <n-radio value="1">{{ "直连设备" }}</n-radio>
              <n-radio value="2">{{ "网关" }}</n-radio>
              <n-radio value="3">{{ "网关子设备" }}</n-radio>
            </n-space>
          </n-radio-group>
        </NFormItem>
        <NFormItem :label="设备连接方式" path="device_conn_type">
          <n-radio-group v-model:value="configForm.device_conn_type" name="device_conn_type">
            <n-space>
              <n-radio value="A">{{ "设备连接平台" }}</n-radio>
              <n-radio value="B">{{ "平台连接设备" }}</n-radio>
            </n-space>
          </n-radio-group>
        </NFormItem>
        <NFlex>
          <NButton @click="handleClose">{{ "取消" }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ "确定" }}</NButton>
        </NFlex>
      </NForm>
    </NCard>
  </div>
</template>
