<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { NEmpty } from 'naive-ui'
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
    add: $t('generate.addRule'),
    edit: $t('generate.editRule')
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
  name: createRequiredFormRule($t('generate.ruleName')),
  signMode: createRequiredFormRule($t('generate.signatureMethod')),
  ip: createRequiredFormRule($t('generate.IPwhitelist')),
  flag: createRequiredFormRule($t('generate.supportFlag')),
  desc: createRequiredFormRule($t('device_template.table_header.PleaseEnterADescription')),
  appKey: createRequiredFormRule($t('generate.supportFlag')),
  dataInterval: createRequiredFormRule($t('generate.dataInterval')),
  SQL: createRequiredFormRule($t('generate.dataInterval')),
  status: createRequiredFormRule($t('generate.selectStatus')),
  SQLWritingAid: createRequiredFormRule($t('generate.selectStatus'))
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
    add: $t('generate.add'),
    edit: $t('common.edit')
  }
  window.$message?.success(`${titles[props.type]}${$t('custom.devicePage.success')}!`)
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
    title: $t('generate.fieldName'),
    align: 'left'
  },
  {
    key: 'dataType',
    title: $t('device_template.table_header.dataType'),
    align: 'left'
  },
  {
    key: 'annotation',
    title: $t('generate.annotation'),
    align: 'left'
  }
]) as Ref<DataTableColumns<Columns>>

const tableData = ref<Columns[]>([])
const rowKey = (row: Columns) => `${row.name}-${row.dataType}-${row.annotation}`

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
        <NFormItemGridItem :span="24" :label="$t('generate.rule-name')" path="name">
          <NInput v-model:value="formModel.name" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('generate.signature-method')" path="signMode">
          <NSelect v-model:value="formModel.signMode" :options="dataServiceSignModeOptions" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('generate.ip2')">
          <NInput v-model:value="formModel.ip" type="textarea" :placeholder="$t('generate.ip')" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('generate.api-support-flag')" path="flag">
          <NSelect v-model:value="formModel.flag" :options="dataServiceFlagOptions" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('device_template.table_header.description')">
          <NInput v-model:value="formModel.desc" type="textarea" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('generate.sql2')">
          <div class="flex-1">
            <NSelect
              v-model:value="formModel.SQLWritingAid"
              :options="dataServiceFlagOptions"
              @update:value="handleChangeFlag"
            />
            <NDataTable
              class="table-standard mt-20px flex-1-hidden"
              size="medium"
              :bordered="true"
              :bottom-bordered="true"
              :single-column="false"
              :single-line="true"
              :striped="false"
              :scroll-x="640"
              :row-key="rowKey"
              :columns="columns"
              :data="tableData"
            >
              <template #empty>
                <NEmpty size="small" :description="$t('common.noData')" />
              </template>
            </NDataTable>
          </div>
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" label="SQL">
          <NInput v-model:value="formModel.SQL" />
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('generate.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">{{ $t('page.login.common.confirm') }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped>
.table-standard {
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-color);
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);

  :deep(.n-data-table-th),
  :deep(.n-data-table-td) {
    padding-left: 12px;
    padding-right: 12px;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
  }

  :deep(.n-data-table-th) {
    height: 44px;
    color: var(--text-color);
    background: var(--body-color) !important;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-td) {
    color: var(--text-color);
    background: var(--card-color) !important;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
    transition:
      background-color 180ms ease,
      box-shadow 180ms ease;
  }

  :deep(.n-data-table-tr:not(.n-data-table-tr--summary):hover > .n-data-table-td) {
    background: rgb(239 246 255) !important;
    box-shadow:
      inset 0 1px 0 rgb(191 219 254 / 60%),
      inset 0 -1px 0 rgb(191 219 254 / 60%) !important;
  }

  :deep(.n-data-table-td--last-col),
  :deep(.n-data-table-th--last-col) {
    padding-right: 20px;
  }
}
</style>
