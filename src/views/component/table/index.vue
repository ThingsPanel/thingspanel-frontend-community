<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NButton, NPopconfirm, NSpace } from 'naive-ui';
import type { DataTableColumn } from 'naive-ui';
import useLoadingEmpty from '@/hooks/common/use-loading-empty';
import { getRandomInteger } from '@/utils/common/number';
import { $t } from '@/locales';

interface DataSource {
  name: string;
  age: number;
  address: string;
}

const { loading, startLoading, endLoading, empty, setEmpty } = useLoadingEmpty();

const columns: DataTableColumn<DataSource>[] = [
  {
    title: 'Name',
    key: 'name',
    align: 'center'
  },
  {
    title: 'Age',
    key: 'age',
    align: 'center'
  },
  {
    title: 'Address',
    key: 'address',
    align: 'center'
  },
  {
    key: 'action',
    title: 'Action',
    align: 'center',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton
            size={'small'}
            onClick={() => {
              handleEdit(row.name);
            }}
          >
            编辑
          </NButton>
          <NPopconfirm
            onPositiveClick={() => {
              handleDelete(row.name);
            }}
          >
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => <NButton size={'small'}>删除</NButton>
            }}
          </NPopconfirm>
        </NSpace>
      );
    }
  }
];

const dataSource = ref<DataSource[]>([]);

function createDataSource(): DataSource[] {
  return Array(100)
    .fill(1)
    .map((_item, index) => {
      return {
        name: `Name${index}`,
        age: getRandomInteger(30, 20),
        address: '中国'
      };
    });
}

function getDataSource() {
  startLoading();
  setTimeout(() => {
    dataSource.value = createDataSource();
    endLoading();
    setEmpty(!dataSource.value.length);
  }, 1000);
}

function getEmptyDataSource() {
  startLoading();
  setTimeout(() => {
    dataSource.value = [];
    endLoading();
    setEmpty(!dataSource.value.length);
  }, 1000);
}

function handleEdit(_name: string) {
  //
}

function handleDelete(_name: string) {
  //
}

onMounted(() => {
  getDataSource();
});
</script>

<template>
  <div class="h-full overflow-hidden">
    <NCard :title="$t('generate.table')">
      <NSpace :vertical="true">
        <NSpace>
          <NButton @click="getDataSource">{{ $t('generate.has-data') }}</NButton>
          <NButton @click="getEmptyDataSource">{{ $t('generate.no-data') }}</NButton>
        </NSpace>
        <LoadingEmptyWrapper class="h-480px" :loading="loading" :empty="empty">
          <NDataTable :columns="columns" :data="dataSource" :flex-height="true" class="h-480px" />
        </LoadingEmptyWrapper>
      </NSpace>
    </NCard>
  </div>
</template>

<style scoped></style>
