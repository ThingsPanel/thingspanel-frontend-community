<script setup lang="tsx">
import { reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { NButton, NSpace, NTag } from 'naive-ui'
import type { DataTableColumns, FormInst } from 'naive-ui'
import dayjs from 'dayjs'
import { useBoolean, useLoading } from '@sa/hooks'
import { dataClearSettingEnabledTypeOptions } from '@/constants/business'
import { editDataClear, fetchDataClearList } from '@/service/api/setting'
import { deepClone } from '@/utils/common/tool'
import { $t } from '@/locales'

const { loading, startLoading, endLoading } = useLoading(false)
const { bool: visible, setTrue: openModal, setFalse: closeModal } = useBoolean()
const tableThemeOverrides = {
  borderColor: 'var(--border-color)',
  fontSizeMedium: '14px',
  lineHeight: '1.5',
  thColor: 'var(--body-color)',
  thColorHover: 'var(--body-color)',
  thFontWeight: '400',
  thTextColor: 'var(--text-color)',
  tdColorHover: 'var(--primary-color-suppl)',
  tdTextColor: 'var(--text-color)',
  thPaddingMedium: '12px',
  tdPaddingMedium: '13px 12px'
}

const tableData = ref<GeneralSetting.DataClearSetting[]>([])

function setTableData(data: GeneralSetting.DataClearSetting[]) {
  tableData.value = data
}

type QueryFormModel = {
  page: number
  page_size: number
}

const queryParams = reactive<QueryFormModel>({
  page: 1,
  page_size: 10
})

async function getTableData() {
  startLoading()
  const { data } = await fetchDataClearList(queryParams)
  if (data) {
    const list: Api.GeneralSetting.DataClearSetting[] = data.list
    setTableData(list)
    endLoading()
  }
}

const columns: Ref<DataTableColumns<GeneralSetting.DataClearSetting>> = ref([
  {
    key: 'id',
    title: 'ID',
    align: 'center',
    width: '100px'
  },
  {
    key: 'data_type',
    title: () => $t('page.manage.setting.dataClearSetting.form.cleanupType'),
    align: 'left',
    render: row => {
      if (row.data_type) {
        const tagTypes: Record<GeneralSetting.CleanupTypeKey, NaiveUI.ThemeColor> = {
          '1': 'success',
          '2': 'warning'
        }
        const key =
          row.data_type === '1'
            ? 'page.manage.setting.dataClearSetting.type.equipmentData'
            : 'page.manage.setting.dataClearSetting.type.operationLog'
        return <NTag type={tagTypes[row.data_type]}>{$t(key)}</NTag>
      }
      return <span></span>
    }
  },
  {
    key: 'retention_days',
    title: () => $t('page.manage.setting.dataClearSetting.form.retentionDays'),
    align: 'left'
  },
  {
    key: 'last_cleanup_time',
    title: () => $t('page.manage.setting.dataClearSetting.form.lastCleanupTime'),
    align: 'left',
    render: row => {
      return <span>{dayjs(row.last_cleanup_time).format('YYYY-MM-DD HH:mm:ss')}</span>
    }
  },
  {
    key: 'last_cleanup_data_time',
    title: () => $t('page.manage.setting.dataClearSetting.form.lastCleanupDataTime'),
    align: 'left',
    render: row => {
      return <span>{dayjs(row.last_cleanup_data_time).format('YYYY-MM-DD HH:mm:ss')}</span>
    }
  },
  {
    key: 'remark',
    title: () => $t('common.remark'),
    align: 'left'
  },
  {
    key: 'actions',
    title: () => $t('common.actions'),
    align: 'center',
    width: '100px',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton size={'small'} type="primary" onClick={() => handleEditTable(row)}>
            {$t('common.edit')}
          </NButton>
        </NSpace>
      )
    }
  }
]) as Ref<DataTableColumns<GeneralSetting.DataClearSetting>>

const formRef = ref<HTMLElement & FormInst>()

type FormModel = Pick<GeneralSetting.DataClearSetting, 'retention_days' | 'enabled' | 'remark'>

const editData = reactive<FormModel>(createDefaultFormModel())

function createDefaultFormModel(): FormModel {
  return {
    retention_days: 0,
    enabled: '1',
    remark: null
  }
}

function setEditData(data: GeneralSetting.DataClearSetting | null) {
  Object.assign(editData, data)
}

function handleEditTable(row: any) {
  setEditData(row)
  openModal()
}

async function handleSubmit() {
  await formRef.value?.validate()
  const formData = deepClone(editData)
  const data: any = await editDataClear(formData)
  if (!data.error) {
    window.$message?.success(data.msg)
    getTableData()
  }
  closeModal()
}

function init() {
  getTableData()
}

init()
</script>

<template>
  <div class="h-full flex-col">
    <NDataTable
      size="medium"
      :theme-overrides="tableThemeOverrides"
      :bordered="true"
      :bottom-bordered="true"
      :single-column="false"
      :single-line="true"
      :striped="false"
      :scroll-x="980"
      :row-key="row => row.id"
      flex-height
      min-height="150px"
      :columns="columns"
      :data="tableData"
      :loading="loading"
      class="standard-table flex-1-hidden"
    >
      <template #empty>
        <NEmpty size="small" :description="$t('common.nodata')" />
      </template>
    </NDataTable>

    <NModal v-model:show="visible" preset="card" :title="$t('common.edit')" class="w-700px">
      <NForm ref="formRef" label-placement="left" :label-width="120" :model="editData">
        <NGrid :cols="24" :x-gap="18">
          <NFormItemGridItem :span="24" :label="$t('page.manage.setting.dataClearSetting.form.retentionDays')">
            <NInputNumber v-model:value="editData.retention_days" class="flex-1" />
          </NFormItemGridItem>
          <NFormItemGridItem :span="24" :label="$t('page.manage.setting.dataClearSetting.form.enabled')" path="enabled">
            <NRadioGroup v-model:value="editData.enabled">
              <NRadio v-for="item in dataClearSettingEnabledTypeOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </NRadio>
            </NRadioGroup>
          </NFormItemGridItem>
          <NFormItemGridItem :span="24" :label="$t('common.remark')">
            <NInput v-model:value="editData.remark" type="textarea" placeholder="" />
          </NFormItemGridItem>
        </NGrid>
        <NSpace class="w-full pt-16px" :size="24" justify="center">
          <NButton class="w-72px" type="primary" @click="handleSubmit">{{ $t('common.edit') }}</NButton>
        </NSpace>
      </NForm>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.standard-table {
  min-width: 100%;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-color);

  :deep(.n-data-table-th),
  :deep(.n-data-table-td) {
    padding-left: 12px;
    padding-right: 12px;
  }

  :deep(.n-data-table-th) {
    height: 44px;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-td) {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
    transition: background-color 180ms ease, box-shadow 180ms ease;
  }

  :deep(.n-data-table-tr:not(.n-data-table-tr--summary):hover > .n-data-table-td) {
    background: rgb(239 246 255) !important;
    box-shadow: inset 0 1px 0 rgb(191 219 254 / 60%), inset 0 -1px 0 rgb(191 219 254 / 60%) !important;
  }

  :deep(.n-data-table-td--last-col),
  :deep(.n-data-table-th--last-col) {
    padding-right: 20px;
  }
}
</style>
