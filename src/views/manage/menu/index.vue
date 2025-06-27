<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { fetchGetMenuList } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useTable } from '@/hooks/common/table';
import { $t } from '@/locales';
import { yesOrNoRecord } from '@/constants/common';
import { enableStatusRecord, menuTypeRecord } from '@/constants/business';
import SvgIcon from '@/components/custom/svg-icon.vue';
import MenuOperateDrawer, { type OperateType } from './modules/menu-operate-drawer.vue';

const appStore = useAppStore();
const { bool: drawerVisible, setTrue: openDrawer } = useBoolean();

const wrapperRef = ref<HTMLElement | null>(null);

const { columns, filteredColumns, data, loading, pagination, getData } = useTable<
  Api.SystemManage.Menu,
  typeof fetchGetMenuList,
  'index' | 'operate'
>({
  apiFn: fetchGetMenuList,
  transformer: res => {
    const menus = res.data || [];

    return {
      data: menus,
      pageNum: 1,
      pageSize: 10,
      total: menus.length
    };
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      minWidth: '140px'
    },
    {
      key: 'id',
      minWidth: '140px',
      title: "ID",
      align: 'center'
    },
    {
      key: 'menuType',
      title: "菜单类型",
      align: 'center',
      minWidth: '140px',
      render: row => {
        const tagMap: Record<Api.Common.EnableStatus, NaiveUI.ThemeColor> = {
          1: 'default',
          2: 'primary'
        };

        const label = "动态文本";

        return <NTag type={tagMap[row.menuType]}>{label}</NTag>;
      }
    },
    {
      key: 'menuName',
      title: "菜单名称",
      align: 'center',
      minWidth: '140px',
      render: row => {
        const { i18nKey, menuName } = row;

        const label = i18nKey ? "文本" : menuName;

        return <span>{label}</span>;
      }
    },
    {
      key: 'icon',
      title: "图标",
      align: 'center',
      minWidth: '140px',
      render: row => {
        const icon = row.iconType === '1' ? row.icon : undefined;

        const localIcon = row.iconType === '2' ? row.icon : undefined;

        return (
          <div class="flex-center">
            <SvgIcon icon={icon} localIcon={localIcon} class="text-icon" />
          </div>
        );
      }
    },
    {
      key: 'routeName',
      title: "路由名称",
      align: 'center',
      minWidth: '140px'
    },
    {
      key: 'routePath',
      title: "路由路径",
      align: 'center',
      minWidth: 120
    },
    {
      key: 'status',
      title: "菜单状态",
      align: 'center',
      minWidth: '140px',
      render: row => {
        if (row.status === null) {
          return null;
        }

        const tagMap: Record<Api.Common.EnableStatus, NaiveUI.ThemeColor> = {
          1: 'success',
          2: 'warning'
        };

        const label = "动态文本";

        return <NTag type={tagMap[row.status]}>{label}</NTag>;
      }
    },
    {
      key: 'hideInMenu',
      title: "隐藏菜单",
      align: 'center',
      minWidth: '140px',
      render: row => {
        const hide: CommonType.YesOrNo = row.hideInMenu ? 'Y' : 'N';

        const tagMap: Record<CommonType.YesOrNo, NaiveUI.ThemeColor> = {
          Y: 'error',
          N: 'default'
        };

        const label = "动态文本";

        return <NTag type={tagMap[hide]}>{label}</NTag>;
      }
    },
    {
      key: 'parentId',
      title: "父级菜单ID",
      minWidth: '140px',
      align: 'center'
    },
    {
      key: 'order',
      title: "排序",
      align: 'center',
      minWidth: '140px'
    },
    {
      key: 'operate',
      title: "操作",
      align: 'center',
      minWidth: '140px',
      render: row => (
        <div class="flex-center justify-end gap-8px">
          {row.menuType === '1' && (
            <NButton type="primary" ghost size="small" onClick={() => handleAddChildMenu(row.id)}>
              {"新增子菜单"}
            </NButton>
          )}
          <NButton type="primary" ghost size="small" onClick={() => handleEdit(row.id)}>
            {"编辑"}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
            {{
              default: () => "确认删除",
              trigger: () => (
                <NButton type="error" ghost size="small">
                  {"删除"}
                </NButton>
              )
            }}
          </NPopconfirm>
        </div>
      )
    }
  ]
});

const operateType = ref<OperateType>('add');

function handleAdd() {
  operateType.value = 'add';
  openDrawer();
}

const checkedRowKeys = ref<string[]>([]);

async function handleBatchDelete() {
  // requestTs
  // window.$message?.success("删除成功");

  checkedRowKeys.value = [];

  getData();
}
// eslint-disable-next-line
function handleAddChildMenu(id: number) {
  operateType.value = 'add';
  openDrawer();
}

/** the editing row data */
const editingData = ref<Api.SystemManage.Menu | null>(null);

function handleEdit(id: number) {
  operateType.value = 'edit';
  editingData.value = data.value.find(item => item.id === id) || null;
  openDrawer();
}
// eslint-disable-next-line
async function handleDelete(id: number) {
  // requestTs
  // window.$message?.success("删除成功");

  getData();
}
</script>

<template>
  <div ref="wrapperRef" class="flex-vertical-stretch gap-16px overflow-hidden <sm:overflow-auto">
    <NCard :title="菜单管理" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="filteredColumns"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @refresh="getData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="1088"
        :loading="loading"
        :pagination="pagination"
        :row-key="item => item.id"
        class="flex-1-hidden"
      />
      <MenuOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getData"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
