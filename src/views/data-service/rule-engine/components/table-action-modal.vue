<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { DataTableColumns, FormInst, FormItemRule, SelectOption } from 'naive-ui'
import { dataServiceFlagOptions, dataServiceSignModeOptions } from '@/constants/business'
import { createRequiredFormRule } from '@/utils/form/rule'
import { $t } from '@/locales'
import { createLogger } from '@/utils/logger'
const logger = createLogger('TableAction')
export interface Props {
  /** 弹窗可见性 */
  visible: boolean
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit'
  /** 编辑的表格行数据 */
  editData?: DataService.Data | null
}

export type ModalType = NonNullable<Props['type']>

defineOptions({ name: 'TableActionModal' })

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
})

interface Emits {
  (e: 'update:visible', visible: boolean): void

  (e: 'getTableData'): void
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
    add: "添加规则",
    edit: "编辑规则"
  }
  return titles[props.type]
})

const formRef = ref<HTMLElement & FormInst>()

type FormModel = Pick<
  DataService.Data,
  'name' | 'signMode' | 'ip' | 'flag' | 'desc' | 'appKey' | 'dataInterval' | 'SQL' | 'status' | 'SQLWritingAid'
>

const formModel = reactive<FormModel>(createDefaultFormModel())

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule("请输入规则名称"),
  signMode: createRequiredFormRule("请选择签名方式"),
  ip: createRequiredFormRule("请输入IP白名单"),
  flag: createRequiredFormRule("请选择接口支持标志"),
  desc: createRequiredFormRule("请输入描述"),
  appKey: createRequiredFormRule("请选择接口支持标志"),
  dataInterval: createRequiredFormRule("请输入推送数据间隔"),
  SQL: createRequiredFormRule("请输入推送数据间隔"),
  status: createRequiredFormRule("请选择状态"),
  SQLWritingAid: createRequiredFormRule("请选择状态")
}

function createDefaultFormModel(): FormModel {
  return {
    name: '',
    signMode: null,
    ip: null,
    flag: null,
    desc: null,
    appKey: '',
    dataInterval: null,
    SQL: null,
    status: null,
    SQLWritingAid: null
  }
}

function handleUpdateFormModel(model: Partial<FormModel>) {
  Object.assign(formModel, model)
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
  const titles: Record<ModalType, string> = {
    add: "添加",
    edit: "编辑"
  }
  window.$message?.success(`${titles[props.type]}${"成功"}!`)
  emit('getTableData')
  closeModal()
}

interface Columns {
  name: string
  dataType: string
  annotation: string
}

const columns: Ref<DataTableColumns<Columns>> = ref([
  {
    key: 'name',
    title: "字段名",
    align: 'left'
  },
  {
    key: 'dataType',
    title: "数据类型",
    align: 'left'
  },
  {
    key: 'annotation',
    title: "注释",
    align: 'left'
  }
]) as Ref<DataTableColumns<Columns>>

const tableData = ref<Columns[]>([])

function setTableData(data: Columns[]) {
  tableData.value = data
}

function handleChangeFlag(value: string, option: SelectOption) {
  logger.info(value, option)
  setTableData([{ name: 'ceshi', dataType: 'ceshi', annotation: 'ceshi' }])
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
        <NFormItemGridItem :span="24" :label="规则名称" path="name">
          <NInput v-model:value="formModel.name" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="签名方式" path="signMode">
          <NSelect v-model:value="formModel.signMode" :options="dataServiceSignModeOptions" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="IP白名单">
          <NInput v-model:value="formModel.ip" type="textarea" :placeholder="多个ip用竖线分割" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="接口支持标志" path="flag">
          <NSelect v-model:value="formModel.flag" :options="dataServiceFlagOptions" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="描述">
          <NInput v-model:value="formModel.desc" type="textarea" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="SQL编写辅助">
          <div class="flex-1">
            <NSelect
              v-model:value="formModel.SQLWritingAid"
              :options="dataServiceFlagOptions"
              @update:value="handleChangeFlag"
            />
            <NDataTable :columns="columns" :data="tableData" class="mt-20px flex-1-hidden" />
          </div>
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" label="SQL">
          <NInput v-model:value="formModel.SQL" />
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ "取消" }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">{{ "确定" }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped></style>
