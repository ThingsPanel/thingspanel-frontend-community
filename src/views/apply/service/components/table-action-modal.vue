<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInst } from 'naive-ui'
import { deepClone } from '@/utils/common/tool'
import { addProtocolPlugin, editProtocolPlugin } from '@/service/api'
import { createRequiredFormRule } from '@/utils/form/rule'
import { $t } from '@/locales'

export interface Props {
  /** 弹窗可见性 */
  visible: boolean
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit'
  /** 编辑的表格行数据 */
  editData?: ServiceManagement.Service | null
}

export type ModalType = NonNullable<Props['type']>

defineOptions({ name: 'TableActionModal' })

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
})

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'success'): void
}

const emit = defineEmits<Emits>()

const modalVisible = computed({
  get() {
    return props.visible
  },
  set(visible) {
    emit('update:visible', visible)
  }
})
const closeModal = () => {
  modalVisible.value = false
}

const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: "新增",
    edit: "编辑"
  }
  return titles[props.type]
})

const formRef = ref<HTMLElement & FormInst>()

const deviceOptions = ref<any[]>([
  { label: "直连设备", value: 1 },
  { label: "网关设备", value: 2 }
])

type FormModel = Pick<
  ServiceManagement.Service,
  | 'name'
  | 'device_type'
  | 'protocol_type'
  | 'access_address'
  | 'http_address'
  | 'sub_topic_prefix'
  | 'description'
  | 'additional_info'
  | 'language_code'
> & {
  additional_info_list: any[]
}

const formModel = reactive<FormModel>(createDefaultFormModel())

const rules = {
  name: createRequiredFormRule("请检查数值"),
  device_type: createRequiredFormRule("请检查数值"),
  protocol_type: createRequiredFormRule("请检查数值"),
  access_address: createRequiredFormRule("请检查数值"),
  http_address: createRequiredFormRule("请检查数值"),
  sub_topic_prefix: createRequiredFormRule("请检查数值")
}

function createDefaultFormModel(): FormModel {
  return {
    name: '',
    device_type: '',
    protocol_type: '',
    access_address: null,
    http_address: null,
    sub_topic_prefix: null,
    description: null,
    language_code: 'zh',
    additional_info: '',
    additional_info_list: []
  }
}

function handleUpdateFormModel(model: Partial<FormModel>) {
  Object.assign(formModel, model)
  const additional_info_list: any = []
  const additional_info = JSON.parse(formModel.additional_info || '{}')
  for (const key in additional_info) {
    if (Object.hasOwn(additional_info, key)) {
      const value = additional_info[key]
      additional_info_list.push({ key, value })
    }
  }
  formModel.additional_info_list = additional_info_list
}

function handleUpdateFormModelByModalType() {
  const handlers: Record<ModalType, () => void> = {
    add: () => {
      const defaultFormModel = createDefaultFormModel()
      handleUpdateFormModel(defaultFormModel)
    },
    edit: () => {
      if (props.editData) {
        handleUpdateFormModel(props.editData)
      }
    }
  }

  handlers[props.type]()
}

async function handleSubmit() {
  await formRef.value?.validate()
  const formData = deepClone(formModel)
  formData.device_type = Number(formData.device_type)

  const additional_info = {}
  formData.additional_info_list.map((item: any) => {
    if (item.key && item.value) {
      return (additional_info[item.key] = item.value)
    }
    return additional_info[item.key]
  })
  formData.additional_info = JSON.stringify(additional_info)
  delete formData.additional_info_list
  let data: any
  if (props.type === 'add') {
    data = await addProtocolPlugin(formData)
  } else if (props.type === 'edit') {
    data = await editProtocolPlugin(formData)
  }
  if (!data.error) {
    // window.$message?.success(data.msg);
    emit('success')
  }
  closeModal()
}

function handleAddAdditionalInfo() {
  formModel.additional_info_list.push({
    key: '',
    value: ''
  })
}

watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      handleUpdateFormModelByModalType()
    }
  }
)
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-700px">
    <NForm ref="formRef" label-placement="left" :label-width="120" :model="formModel" :rules="rules">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="24" :label="服务名称" path="name">
          <NInput v-model:value="formModel.name" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="设备类型" path="device_type">
          <NSelect v-model:value="formModel.device_type" :options="deviceOptions" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="协议类型" path="protocol_type">
          <NInput v-model:value="formModel.protocol_type" />
          <!-- <NSelect v-model:value="formModel.protocol_type" :options="serviceManagementProtocolTypeOptions" /> -->
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="接入地址" path="access_address">
          <NInput v-model:value="formModel.access_address" placeholder=" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="HTTP服务地址" path="http_address">
          <NInput v-model:value="formModel.http_address" placeholder=" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="插件订阅主题前缀" path="sub_topic_prefix">
          <NInput v-model:value="formModel.sub_topic_prefix" placeholder=" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="描述">
          <NInput v-model:value="formModel.description" type="textarea" placeholder=" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="链接参数">
          <NButton class="w-72px" type="primary" @click="handleAddAdditionalInfo">
            {{ "新增" }}
          </NButton>
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" label=" ">
          <div>
            <div v-for="(item, index) in formModel.additional_info_list" :key="index" class="mt-10px flex">
              <NInput v-model:value="item.key" :placeholder="键" />
              <NInput v-model:value="item.value" class="ml-20px" :placeholder="值" />
            </div>
          </div>
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">
          {{ "取消" }}
        </NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">
          {{ "确认" }}
        </NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped></style>
