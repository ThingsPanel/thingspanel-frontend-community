<script setup lang="tsx">
import { h, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useBoolean, useLoading } from '@sa/hooks';
import { routerSysFlagLabels, routerTypeLabels } from '@/constants/business';
import { delElement, fetchElementList } from '@/service/api/route';
import { deepClone } from '@/utils/common/tool';
import { $t } from '@/locales';
import TableActionModal from './components/table-action-modal.vue';
import type { ModalType } from './components/table-action-modal.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();

type QueryFormModel = {
  page: number;
  page_size: number;
};

const queryParams = reactive<QueryFormModel>({
  page: 1,
  page_size: 10
});

const tableData = ref<CustomRoute.Route[]>([]);

function setTableData(data: CustomRoute.Route[]) {
  tableData.value = data;
}

const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  itemCount: 0,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page;
    queryParams.page = page;
    getTableData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    queryParams.page = 1;
    queryParams.page_size = pageSize;
    getTableData();
  }
});

async function getTableData() {
  startLoading();
  const { data } = await fetchElementList(queryParams);
  if (data) {
    const list: Api.Route.MenuRoute[] = data.list;
    pagination.itemCount = data.total;
    setTableData(list);
    endLoading();
  }
}

const rowKey = (row: CustomRoute.Route) => {
  return row.id;
};

const columns: Ref<DataTableColumns<CustomRoute.Route>> = ref([
  {
    key: 'description',
    title: () => "菜单管理",
    align: 'left',
    minWidth: '140px',
    render: row => {
      if (row.multilingual && row.multilingual !== 'default') {
        return <span>{"文本"}</span>;
      }
      return <span>{row.description}</span>;
    }
  },

  {
    key: 'param2',
    title: () => "图标",
    align: 'left',
    minWidth: '140px',
    render: row => {
      if (row.param2) {
        return <svg-icon icon={row.param2} />;
      }
      return <span></span>;
    }
  },
  {
    key: 'element_code',
    minWidth: '140px',
    title: () => "菜单名称",
    align: 'left'
  },
  {
    key: 'param1',
    minWidth: '140px',
    title: () => "路由名称",
    align: 'left'
  },
  // {
  //   key: 'param3',
  //   minWidth: '140px',
  //   title: () => "组件类型",
  //   align: 'left'
  // },
  {
    key: 'element_type',
    minWidth: '140px',
    title: () => "菜单类型",
    align: 'left',
    render: row => {
      if (row.element_type) {
        const tagTypes: Record<CustomRoute.routerTypeKey, NaiveUI.ThemeColor> = {
          '1': 'success',
          // "2": "error",
          '3': 'warning'
          // "4": "default",
          // "5": "info",
        };
        return <NTag type={tagTypes[row.element_type]}>{routerTypeLabels[row.element_type]}</NTag>;
      }
      return <span></span>;
    }
  },
  {
    key: 'authority',
    minWidth: '140px',
    title: () => "权限",
    align: 'left',
    render: row => {
      if (row.authority && row.authority.length) {
        const tags = row.authority.map((tagKey: string) => {
          return h(
            NTag,
            {
              type: 'success'
            },
            {
              default: () => routerSysFlagLabels[tagKey]
            }
          );
        });
        return tags;
      }
      return <span></span>;
    }
  },
  {
    key: 'remark',
    minWidth: '140px',
    title: () => "备注",
    align: 'left'
  },
  {
    key: 'actions',
    title: () => "操作",
    align: 'left',
    minWidth: '140px',
    render: row => {
      return (
        <NSpace>
          <NButton type="primary" size={'small'} onClick={() => handleEditTable(row)}>
            {"编辑"}
          </NButton>
          <NPopconfirm
            negative-text={"取消"}
            positive-text={"确认"}
            onPositiveClick={() => handleDeleteTable(row.id)}
          >
            {{
              default: () => "确认",
              trigger: () => (
                <NButton type="error" size={'small'}>
                  {"删除"}
                </NButton>
              )
            }}
          </NPopconfirm>
        </NSpace>
      );
    }
  }
]) as Ref<DataTableColumns<CustomRoute.Route>>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<CustomRoute.Route | null>(null);

function handleAddTable() {
  openModal();
  setModalType('add');
}

function handleEditTable(row: any) {
  editData.value = deepClone(row);
  setModalType('edit');
  openModal();
}

async function handleDeleteTable(rowId: string) {
  const data = await delElement(rowId);
  if (!data.error) {
    window.$message?.success("删除成功");
    await getTableData();
  }
}

function init() {
  getTableData();
}

// 初始化
init();
</script>

<template>
  <div>
    <NCard :title="菜单管理" :bordered="false" class="h-full rounded-8px shadow-sm">
      <template #header-extra>
        <NButton type="primary" @click="handleAddTable">
          <IconIcRoundPlus class="mr-4px text-20px" />
          {{ "新增" }}
        </NButton>
      </template>
      <div class="h-full flex-col">
        <NDataTable
          size="small"
          :row-key="rowKey"
          :remote="true"
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          class="flex-1-hidden"
        />
        <TableActionModal
          v-model:visible="visible"
          :type="modalType"
          :edit-data="editData"
          :table-list="tableData"
          @success="getTableData"
        />
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
