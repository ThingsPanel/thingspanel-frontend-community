<script setup lang="ts">
import { computed, reactive, ref, toRefs, watch } from 'vue'
import type { FormInst, FormItemRule } from 'naive-ui'
import { formRules, getConfirmPwdRule } from '@/utils/form/rule'
import { editUser } from '@/service/api'
import { $t } from '@/locales'

export interface Props {
  /** 弹窗可见性 */
  visible: boolean
  /** 编辑的表格行数据 */
  editData?: UserManagement.User | null
}

defineOptions({ name: 'EditPasswordModal' })

const props = withDefaults(defineProps<Props>(), {
  editData: null
})

interface Emits {
  (e: 'update:visible', visible: boolean): void

  /** 点击协议 */
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

const formRef = ref<HTMLElement & FormInst>()

type FormModel = Pick<UserManagement.User, 'email'> & {
  password: string
  confirmPwd: string
}

const formModel = reactive<FormModel>(createDefaultFormModel())

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  email: formRules.email,
  password: formRules.pwd,
  confirmPwd: getConfirmPwdRule(toRefs(formModel).password)
}

function createDefaultFormModel(): FormModel {
  return {
    email: '',
    password: '',
    confirmPwd: ''
  }
}

function handleUpdateFormModel(model: Partial<FormModel>) {
  Object.assign(formModel, model)
}

function handleUpdateFormModelByModalType() {
  if (props.editData) {
    handleUpdateFormModel(props.editData)
  }
}

async function handleSubmit() {
  await formRef.value?.validate()
  const data: any = await editUser(formModel)
  if (!data.error) {
    window.$message?.success(data.msg)
    handleUpdateFormModel(createDefaultFormModel())
    closeModal()
    emit('success')
  }
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
  <n-modal v-model:show="modalVisible" preset="card" :title="修改密码">
    <n-form ref="formRef" label-placement="left" :label-width="80" :model="formModel" :rules="rules">
      <n-form-item :label="邮箱" path="email">
        <n-input v-model:value="formModel.email" readonly />
      </n-form-item>
      <n-form-item :label="密码" path="password">
        <n-input v-model:value="formModel.password" type="password" />
      </n-form-item>
      <n-form-item :label="确认密码" path="confirmPwd">
        <n-input v-model:value="formModel.confirmPwd" type="password" />
      </n-form-item>
      <n-space class="w-full pt-16px" :size="24" justify="end">
        <n-button class="w-72px" @click="closeModal">{{ "取消" }}</n-button>
        <n-button class="w-72px" type="primary" @click="handleSubmit">{{ "确定" }}</n-button>
      </n-space>
    </n-form>
  </n-modal>
</template>

<style scoped></style>
