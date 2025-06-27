<script setup lang="tsx">
import { reactive, ref, watch } from 'vue'
import { addAttributes, putAttributes } from '@/service/api/system-data'
import { $t } from '@/locales'
import { getAdditionalInfo } from '../../utils'
import EnumInfo from './enum-info.vue'

const emit = defineEmits(['update:addAndEditModalVisible', 'update:objItem', 'determine'])

const props = defineProps({
  addAndEditModalVisible: {
    type: Boolean,
    required: true
  },
  deviceTemplateId: {
    type: String,
    required: true
  },
  objItem: {
    type: Object,
    required: true
  }
})

// 提交表单
const formRef: any = ref(null)
const deviceTemplateId = ref<string>(props.deviceTemplateId)

let addFrom: any = reactive({})

type Rule = {
  required: boolean
  trigger: string[]
  message: string
}

type Rules = {
  data_name: Rule
  data_identifier: Rule
  read_write_flag: Rule
  data_type: Rule
}

const fromRules: Rules = {
  data_name: {
    required: true,
    trigger: ['blur', 'input'],
    message: "请输入属性名称"
  },
  data_identifier: {
    required: true,
    trigger: ['blur', 'input'],
    message: "请输入属性标识符"
  },
  data_type: {
    required: true,
    trigger: ['blur', 'input'],
    message: "请输入属性类型"
  },
  read_write_flag: {
    required: true,
    trigger: ['blur', 'input'],
    message: "请输入读写标志"
  }
}

const objItem = reactive<any>(props.objItem)

// 监听一下父组件传递过来的编辑数据
watch(
  objItem,
  newVal => {
    if (objItem.id) {
      addFrom = reactive({
        device_template_id: deviceTemplateId,
        ...newVal,
        additional_info: getAdditionalInfo(newVal.additional_info)
      })
    } else {
      addFrom = reactive({
        device_template_id: deviceTemplateId,
        data_name: '',
        data_identifier: '',

        unit: '',
        description: '',
        additional_info: []
      })
    }
  },
  { deep: true, immediate: true }
)

const generalOptions: any = reactive(
  ['String', 'Number', 'Boolean', 'Enum'].map(v => ({
    label: v,
    value: v
  }))
)

const readAndWriteOptions: any = reactive(
  ['R-只读', 'RW-读/写'].map(v => ({
    label: v,
    value: v
  }))
)

// 确定按钮
const submit: () => void = async () => {
  await formRef.value?.validate()
  const updateForm = { ...addFrom }
  if (updateForm.data_type === 'Enum') {
    updateForm.additional_info = JSON.stringify(updateForm.additional_info)
  } else {
    updateForm.additional_info = '[]'
  }
  if (updateForm.read_write_flag === 'R-只读') {
    updateForm.read_write_flag = 'R'
  } else {
    updateForm.read_write_flag = 'RW'
  }
  if (props.objItem.id) {
    const response: any = await putAttributes(updateForm)
    if (response.data) {
      emit('update:objItem', {})
      emit('update:addAndEditModalVisible', false)
      emit('determine')
      emit('update:objItem', {})
      emit('update:addAndEditModalVisible', false)
      emit('determine')
      window.$message?.success("编辑成功")
    }
  } else {
    const response: any = await addAttributes(updateForm)
    if (response.data) {
      emit('update:addAndEditModalVisible', false)
      emit('determine')
      emit('update:objItem', {})
      emit('update:addAndEditModalVisible', false)
      emit('determine')
      window.$message?.success('新增成功')
    }
  }
}

// 取消按钮
const clear: () => void = () => {
  emit('update:objItem', {})
  emit('update:addAndEditModalVisible', false)
}

const updateAdditionalInfo: (newVal) => void = newVal => {
  addFrom.additional_info = newVal
}
</script>

<template>
  <n-form
    ref="formRef"
    :model="addFrom"
    :rules="fromRules"
    label-placement="left"
    label-width="100"
    require-mark-placement="right-hanging"
    class="addFrom"
  >
    <n-form-item :label="属性名称" path="data_name">
      <n-input
        v-model:value.trim="addFrom.data_name"
        :placeholder="请输入属性名称"
      />
    </n-form-item>
    <n-form-item :label="属性标识符" path="data_identifier">
      <n-input
        v-model:value.trim="addFrom.data_identifier"
        :placeholder="请输入属性标识符"
      />
    </n-form-item>
    <n-form-item :label="属性类型" path="data_type">
      <n-select
        v-model:value="addFrom.data_type"
        :options="generalOptions"
        :placeholder="请输入属性类型"
      />
    </n-form-item>
    <template v-if="addFrom.data_type === 'Enum'">
      <EnumInfo :additional-info="addFrom.additional_info" @update-additional-info="updateAdditionalInfo" />
    </template>
    <n-form-item :label="读写标志" path="read_write_flag">
      <n-select
        v-model:value="addFrom.read_write_flag"
        :options="readAndWriteOptions"
        :placeholder="请输入读写标志"
      />
    </n-form-item>
    <n-form-item :label="单位">
      <n-input v-model:value.trim="addFrom.unit" :placeholder="请输入单位" />
    </n-form-item>
    <n-form-item :label="描述">
      <n-input
        v-model:value.trim="addFrom.description"
        :placeholder="请输入描述"
        type="textarea"
      />
    </n-form-item>
  </n-form>
  <div class="box1">
    <n-button class="m-r3" @click="clear">{{ "取消" }}</n-button>
    <n-button type="primary" @click="submit">{{ "确定" }}</n-button>
  </div>
</template>

<style lang="scss" scoped>
.box1 {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
