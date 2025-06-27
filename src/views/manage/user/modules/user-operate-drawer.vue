<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useFormRules, useNaiveForm } from '@/hooks/common/form'
import { fetchGetAllRoles } from '@/service/api'
import { $t } from '@/locales'
import { enableStatusOptions, userGenderOptions } from '@/constants/business'

defineOptions({
  name: 'UserOperateDrawer'
})

/**
 * the type of operation
 *
 * - add: add user
 * - edit: edit user
 */
export type OperateType = 'add' | 'edit'

interface Props {
  /** the type of operation */
  operateType: OperateType
  /** the edit row data */
  rowData?: Api.SystemManage.User | null
}

const props = defineProps<Props>()

interface Emits {
  (e: 'submitted'): void
}

const emit = defineEmits<Emits>()

const visible = defineModel<boolean>('visible', {
  default: false
})

const { formRef, validate, restoreValidation } = useNaiveForm()
const { defaultRequiredRule } = useFormRules()

const title = computed(() => {
  const titles: Record<OperateType, string> = {
    add: "新增用户",
    edit: "编辑用户"
  }
  return titles[props.operateType]
})

type Model = Pick<
  Api.SystemManage.User,
  'userName' | 'userGender' | 'nickName' | 'userPhone' | 'userEmail' | 'userRoles' | 'status'
>

const model: Model = reactive(createDefaultModel())

function createDefaultModel(): Model {
  return {
    userName: '',
    userGender: null,
    nickName: '',
    userPhone: '',
    userEmail: '',
    userRoles: [],
    status: null
  }
}

type RuleKey = Extract<keyof Model, 'userName' | 'status'>

const rules: Record<RuleKey, App.Global.FormRule> = {
  userName: defaultRequiredRule,
  status: defaultRequiredRule
}

/** the enabled role options */
const roleOptions = ref<CommonType.Option<string>[]>([])

async function getRoleOptions() {
  const { error, data } = await fetchGetAllRoles({ page: 1, page_size: 10 })

  if (!error) {
    const options = data.map(item => ({
      label: item.roleName,
      value: item.roleCode
    }))

    // the mock data does not have the roleCode, so fill it
    // if the real requestTs, remove the following code
    const userRoleOptions = model.userRoles.map(item => ({
      label: item,
      value: item
    }))
    // end

    roleOptions.value = [...userRoleOptions, ...options]
  }
}

function handleUpdateModelWhenEdit() {
  if (props.operateType === 'add') {
    Object.assign(model, createDefaultModel())
    return
  }

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model, props.rowData)
  }
}

function closeDrawer() {
  visible.value = false
}

async function handleSubmit() {
  await validate()
  // requestTs
  // window.$message?.success("更新成功");
  closeDrawer()
  emit('submitted')
}

watch(visible, () => {
  if (visible.value) {
    handleUpdateModelWhenEdit()
    restoreValidation()
    getRoleOptions()
  }
})
</script>

<template>
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="360">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules">
        <NFormItem :label="姓名" path="userName">
          <NInput v-model:value="model.userName" :placeholder="请输入姓名" />
        </NFormItem>
        <NFormItem :label="性别" path="userGender">
          <NRadioGroup v-model:value="model.userGender">
            <NRadio
              v-for="item in userGenderOptions"
              :key="item.value"
              :value="item.value"
              :label="标签"
            />
          </NRadioGroup>
        </NFormItem>
        <NFormItem :label="昵称" path="nickName">
          <NInput v-model:value="model.nickName" :placeholder="请输入昵称" />
        </NFormItem>
        <NFormItem :label="手机号" path="userPhone">
          <NInput v-model:value="model.userPhone" :placeholder="请输入手机号" />
        </NFormItem>
        <NFormItem :label="邮箱" path="email">
          <NInput v-model:value="model.userEmail" :placeholder="请输入邮箱" />
        </NFormItem>
        <NFormItem :label="租户状态" path="status">
          <NRadioGroup v-model:value="model.status">
            <NRadio
              v-for="item in enableStatusOptions"
              :key="item.value"
              :value="item.value"
              :label="标签"
            />
          </NRadioGroup>
        </NFormItem>
        <NFormItem :label="租户角色" path="roles">
          <NSelect
            v-model:value="model.userRoles"
            multiple
            :options="roleOptions"
            :placeholder="请选择租户角色"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace :size="16">
          <NButton @click="closeDrawer">{{ "取消" }}</NButton>
          <NButton type="primary" @click="handleSubmit">{{ "确认" }}</NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped></style>
