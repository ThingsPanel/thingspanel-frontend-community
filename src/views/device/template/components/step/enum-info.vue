<script setup lang="tsx">
import type { PropType } from 'vue'
import { reactive } from 'vue'
import { NButton, NEmpty, NSelect, NSpace } from 'naive-ui'
import { $t } from '@/locales'
import { enumDataTypeOption } from '@/constants/business'

const emit = defineEmits(['updateAdditionalInfo'])

const props = defineProps({
  additionalInfo: {
    type: Array as PropType<any[]>,
    required: true
  }
})

const booleanOptions: any = reactive([
  {
    label: 'True',
    value: true
  },
  {
    label: 'False',
    value: false
  }
])

const onAdd = () => {
  const additionalInfo = [...props.additionalInfo]
  additionalInfo.push({
    value_type: '',
    value: '',
    description: ''
  })
  emit('updateAdditionalInfo', additionalInfo)
}

const onChange: (newVal, rowIndex: number, field: string) => void = (newVal, rowIndex, field) => {
  const additionalInfo = [...props.additionalInfo]
  ;(additionalInfo as any)[rowIndex][field] = newVal
  emit('updateAdditionalInfo', additionalInfo)
}

const onDel: (rowIndex: number) => void = rowIndex => {
  const additionalInfo = [...props.additionalInfo]
  additionalInfo.splice(rowIndex, 1)
  emit('updateAdditionalInfo', additionalInfo)
}

const enumTableThemeOverrides = {
  borderColor: 'var(--border-color)',
  borderRadius: '10px',
  fontSizeMedium: '14px',
  lineHeight: '1.5',
  thColor: 'var(--body-color)',
  thColorHover: 'var(--body-color)',
  thFontWeight: '400',
  thTextColor: 'var(--text-color)',
  tdColor: 'var(--card-color)',
  tdColorHover: 'var(--primary-color-suppl)',
  tdTextColor: 'var(--text-color)',
  thPaddingMedium: '12px',
  tdPaddingMedium: '13px 12px'
}

const enumRowKeys = new WeakMap<object, number>()
let nextEnumRowKey = 0
const enumTableRowKey = (row: object) => {
  if (!enumRowKeys.has(row)) {
    enumRowKeys.set(row, nextEnumRowKey++)
  }
  return enumRowKeys.get(row) as number
}

const columns: any = [
  {
    key: 'value_type',
    title: $t('device_template.table_header.enumDataType'),
    align: 'center',
    className: 'enum-header',
    width: 125,
    render: (rowData, rowIndex) => {
      return (
        <NSelect
          value={rowData.value_type}
          onChange={newVal => onChange(newVal, rowIndex, 'value_type')}
          options={enumDataTypeOption}
        ></NSelect>
      )
    }
  },
  {
    key: 'value',
    title: $t('device_template.table_header.enumDataValue'),
    align: 'center',
    className: 'enum-header',
    width: 120,
    render: (rowData, rowIndex) => {
      if (rowData.value_type === 'Number') {
        return <n-input-number v-model:value={rowData.value} show-button={false} />
      } else if (rowData.value_type === 'Boolean') {
        return <NSelect v-model:value={rowData.value} options={booleanOptions} />
      }

      return <n-input value={rowData.value} onInput={newVal => onChange(newVal, rowIndex, 'value')} />
    }
  },
  {
    key: 'description',
    title: $t('device_template.table_header.enumDescription'),
    align: 'center',
    className: 'enum-header',
    render: (rowData, rowIndex) => {
      return <n-input value={rowData.description} onInput={newVal => onChange(newVal, rowIndex, 'description')} />
    }
  },
  {
    key: 'actions',
    width: 40,
    align: 'center',
    className: 'enum-action',
    render: (_rowData, rowIndex) => {
      return (
        <NSpace justify={'center'}>
          <NButton quaternary type="primary" size="small" class="p-l0 p-r0" onClick={() => onDel(rowIndex)}>
            {$t('common.delete')}
          </NButton>
        </NSpace>
      )
    }
  }
]
</script>

<template>
  <div>{{ $t('device_template.table_header.setEnum') }}</div>
  <n-data-table
    :columns="columns"
    :data="props.additionalInfo"
    class="enum-table m-b2 m-t2"
    size="medium"
    :theme-overrides="enumTableThemeOverrides"
    :bordered="true"
    :bottom-bordered="true"
    :single-column="false"
    :single-line="true"
    :striped="false"
    :scroll-x="520"
    :row-key="enumTableRowKey"
  >
    <template #empty>
      <NEmpty size="small" :description="$t('common.noData')" />
    </template>
  </n-data-table>
  <NButton class="add-button" @click="onAdd">
    <template #icon>
      <SvgIcon local-icon="add" />
    </template>
    {{ $t('device_template.table_header.addEnum') }}
  </NButton>
</template>

<style lang="scss" scoped>
.add-button {
  margin-bottom: 1rem;
}

.enum-table {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-color);

  :deep(.n-data-table-th) {
    color: var(--text-color);
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-th),
  :deep(.n-data-table-td) {
    padding-left: 12px;
    padding-right: 12px;
  }

  :deep(.n-data-table-td) {
    color: var(--text-color);
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-tr:not(.n-data-table-tr--summary):hover > .n-data-table-td) {
    background: rgb(239 246 255) !important;
    box-shadow:
      inset 0 1px 0 rgb(191 219 254 / 60%),
      inset 0 -1px 0 rgb(191 219 254 / 60%) !important;
  }
}
</style>

<style lang="scss">
.n-data-table-th,
.n-data-table-td {
  &.enum-action {
    padding-left: 0;
    padding-right: 0;
  }
}

.n-data-table-th.enum-header {
  font-weight: normal;
}

.enum-table {
  .n-data-table-empty {
    padding: 0;
  }
}
</style>
