<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useFormRules, useNaiveForm } from '@/hooks/common/form'
import { $t } from '@/locales'
import { enableStatusOptions } from '@/constants/business'

defineOptions({
  name: 'RoleOperateDrawer'
})

/**
 * the type of operation
 *
 * - add: add role
 * - edit: edit role
 */
export type OperateType = 'add' | 'edit'

interface Props {
  /** the type of operation */
  operateType: OperateType
  /** the edit row data */
  rowData?: Api.SystemManage.Role | null
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
    add: "新增角色",
    edit: "编辑角色"
  }
  return titles[props.operateType]
})

type Model = Pick<Api.SystemManage.Role, 'roleName' | 'roleCode' | 'roleDesc' | 'status'>

const model: Model = reactive(createDefaultModel())

function createDefaultModel(): Model {
  return {
    roleName: '',
    roleCode: '',
    roleDesc: '',
    status: null
  }
}

type RuleKey = Exclude<keyof Model, 'roleDesc'>

const rules: Record<RuleKey, App.Global.FormRule> = {
  roleName: defaultRequiredRule,
  roleCode: defaultRequiredRule,
  status: defaultRequiredRule
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
  }
})
</script>

<template>
  <NDrawer v-model:show="visible" :title="title" display-directive="show" :width="360">
    <NDrawerContent :title="title" :native-scrollbar="false" closable>
      <NForm ref="formRef" :model="model" :rules="rules">
        <NFormItem :label="角色名称" path="roleName">
          <NInput v-model:value="model.roleName" :placeholder="请输入角色名称" />
        </NFormItem>
        <NFormItem :label="角色编码" path="roleCode">
          <NInput v-model:value="model.roleCode" :placeholder="请输入角色编码" />
        </NFormItem>
        <NFormItem :label="角色状态" path="status">
          <NRadioGroup v-model:value="model.status">
            <NRadio
              v-for="item in enableStatusOptions"
              :key="item.value"
              :value="item.value"
              :label="标签"
            />
          </NRadioGroup>
        </NFormItem>
        <NFormItem :label="角色描述" path="roleDesc">
          <NInput v-model:value="model.roleDesc" :placeholder="请输入角色描述" />
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
