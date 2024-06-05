<script setup lang="tsx">
import type { PropType } from 'vue';
import { reactive } from 'vue';
import { NButton, NSelect, NSpace } from 'naive-ui';
import { $t } from '@/locales';
import { enumDataTypeOption } from '@/constants/business';

const emit = defineEmits(['updateAdditionalInfo']);

const props = defineProps({
  additionalInfo: {
    type: Array as PropType<any[]>,
    required: true
  }
});

const booleanOptions: any = reactive([
  {
    label: 'True',
    value: true
  },
  {
    label: 'False',
    value: false
  }
]);

const onAdd = () => {
  const additionalInfo = [...props.additionalInfo];
  additionalInfo.push({
    value_type: '',
    value: '',
    description: ''
  });
  emit('updateAdditionalInfo', additionalInfo);
};

const onChange: (newVal, rowIndex: number, field: string) => void = (newVal, rowIndex, field) => {
  const additionalInfo = [...props.additionalInfo];
  (additionalInfo as any)[rowIndex][field] = newVal;
  emit('updateAdditionalInfo', additionalInfo);
};

const onDel: (rowIndex: number) => void = rowIndex => {
  const additionalInfo = [...props.additionalInfo];
  additionalInfo.splice(rowIndex, 1);
  emit('updateAdditionalInfo', additionalInfo);
};

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
      );
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
        return <n-input-number v-model:value={rowData.value} show-button={false} />;
      } else if (rowData.value_type === 'Boolean') {
        return <NSelect v-model:value={rowData.value} options={booleanOptions} />;
      }

      return <n-input value={rowData.value} onInput={newVal => onChange(newVal, rowIndex, 'value')} />;
    }
  },
  {
    key: 'description',
    title: $t('device_template.table_header.enumDescription'),
    align: 'center',
    className: 'enum-header',
    render: (rowData, rowIndex) => {
      return <n-input value={rowData.description} onInput={newVal => onChange(newVal, rowIndex, 'description')} />;
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
      );
    }
  }
];
</script>

<template>
  <div>{{ $t('device_template.table_header.setEnum') }}</div>
  <n-data-table :columns="columns" :data="props.additionalInfo" class="enum-table m-b2 m-t2" />
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
