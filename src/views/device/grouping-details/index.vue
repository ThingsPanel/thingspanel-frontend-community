<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { type DataTableColumns, NButton, NDataTable, type PaginationProps, useMessage } from 'naive-ui';
import {
  deleteDeviceGroup,
  deleteDeviceGroupRelation,
  deviceGroupDetail,
  deviceListByGroup,
  getDeviceGroup
} from '@/service/api/device';
import { AddOrEditDevices } from '@/views/device/grouping/components';
import { createNoSelectDeviceColumns, group_columns } from '@/views/device/modules/all-columns';
import useLoadingEmpty from '@/hooks/common/use-loading-empty';
import DeviceSelectList from '@/views/device/grouping-details/modules/device-select-list.vue';
import { $t } from '@/locales';
import { formatDateTime } from '@/utils/common/datetime';
import { useRouterPush } from '@/hooks/common/router';

const group_data = ref([]);
const device_data = ref<DeviceManagement.DeviceData[]>([]);

const { loading, startLoading, endLoading } = useLoadingEmpty(false);
const route = useRoute();

const currentId = ref(route.query.id);
const isEdit = ref(true);
const the_modal1 = ref();
const the_modal2 = ref();

const editData = ref({ id: '', parent_id: '', name: '', description: '' });

const addChildData = reactive({
  id: '',
  parent_id: currentId.value as string,
  name: '',
  description: ''
});
const details_data = ref({
  detail: {
    created_at: '',
    description: '',
    id: '',
    name: '',
    parent_id: '',
    remark: '',
    tenant_id: '',
    tier: 0,
    updated_at: ''
  },
  tier: {
    group_path: ''
  }
});
const message = useMessage();

const queryParams = reactive<{
  parent_id: string;
  page: number;
  page_size: number;
}>({
  parent_id: '',
  page: 1,
  page_size: 10
});

const { routerPush } = useRouterPush();

const getDetails = async (tid: string) => {
  if (!currentId.value) {
    message.error('00');
  } else {
    queryParams.parent_id = tid;
    startLoading();
    const { data, error } = await deviceGroupDetail({ id: tid });

    if (!error && data) {
      details_data.value = data;
      editData.value.id = data.detail.id;
      editData.value.description = data.detail.description;
      editData.value.name = data.detail.name;
      editData.value.parent_id = data.detail.parent_id;
    }

    const res2 = await getDeviceGroup(queryParams);
    group_data.value = res2.data.list;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    group_pagination.itemCount = res2.data.total;

    endLoading();
  }
};
const group_pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    group_pagination.page = page;
    queryParams.page = page;
    getDetails(currentId.value as string);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getDeviceList(currentId.value as string);
  },
  onUpdatePageSize: (pageSize: number) => {
    group_pagination.pageSize = pageSize;
    group_pagination.page = 1;
    queryParams.page = 1;
    queryParams.page_size = pageSize;
    getDetails(currentId.value as string);
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getDeviceList(currentId.value as string);
  }
});
const router = useRouter();
const viewDetails = (rid: string) => {
  router.push({ name: 'device_grouping-details', query: { id: rid } });
};
// Function to delete a device group
const deleteItem = async (rid: string) => {
  await deleteDeviceGroup({ id: rid });
  await getDetails(currentId.value as string);
};
const group_column = group_columns(viewDetails, deleteItem);
const showGroupModal = () => {
  isEdit.value = true;
  if (the_modal2.value) {
    the_modal2.value.showModal = true;
  }
};

const showGroupDeviceModal = ref(false);
const handleChildChange = (newValue: boolean) => {
  showGroupDeviceModal.value = newValue;
};
const showGroupModalChild = () => {
  addChildData.parent_id = currentId.value as string;
  if (the_modal1.value) {
    the_modal1.value.showModal = true;
  }
};

const queryParams2 = reactive<{
  group_id: string;
  page: number;
  page_size: number;
}>({
  group_id: currentId.value as string,
  page: 1,
  page_size: 5
});
const getDeviceList = async (id: string) => {
  const res = await deviceListByGroup({ ...queryParams2, group_id: id });
  if (res.data?.list) {
    device_data.value = res.data?.list;
  } else {
    device_data.value = [];
  }
  if (res?.data?.total) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    devicePagination.pageCount = Math.ceil(res?.data?.total / 5);
  }
};
const refresh_data = (newValue: boolean) => {
  if (newValue) {
    getDeviceList(currentId.value as string);
  }
};
const devicePagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 5,
  onChange: (page: number) => {
    devicePagination.page = page;
    queryParams2.page = page;
    getDeviceList(currentId.value as string);
  }
});
const viewDeviceDetails = (rid: string) => {
  router.push({ name: 'device_details', query: { d_id: rid } });
};
const deleteDeviceItem = async (rid: string) => {
  await deleteDeviceGroupRelation({
    device_id: rid,
    group_id: currentId.value
  });
  await getDeviceList(currentId.value as string);
};
const deviceColumns: DataTableColumns<DeviceManagement.DeviceData> = createNoSelectDeviceColumns(
  viewDeviceDetails,
  deleteDeviceItem
);
onMounted(async () => {
  await getDetails(currentId.value as string);
  await getDeviceList(currentId.value as string);
});
const reload = async (nid: string) => {
  await getDetails(nid);
  await getDeviceList(nid);
};

/**
 * 导航到父级分组详情页
 */
const goToParentGroup = () => {
  if (details_data.value.detail.parent_id && details_data.value.detail.parent_id !== '0') {
    routerPush({ name: 'device_grouping-details', query: { id: details_data.value.detail.parent_id } });
  } else {
    console.error('无法导航到父级分组，parent_id 无效或为顶级:', details_data.value.detail.parent_id);
  }
};

/**
 * 导航到顶层分组列表页
 */
const goToGroupListRoot = () => {
  routerPush({ name: 'device_grouping' });
};

watch(
  () => route.query.id,
  newId => {
    if (newId) {
      currentId.value = newId;
      reload(newId as string);
    }
  }
);
</script>

<template>
  <div>
    <NSpace vertical :size="16">
      <NCard :title="details_data.detail.name">
        <template #header-extra>
          <NSpace>
            <NButton v-if="details_data.detail.parent_id !== '0'" type="primary" @click="goToParentGroup">
              <template #icon>
                <svg-icon icon="material-symbols:arrow-upward" />
              </template>
              {{ $t('custom.grouping_details.parentLevel') }}
            </NButton>
            <NButton @click="goToGroupListRoot">
              {{ $t('custom.grouping_details.allGroups') }}
            </NButton>
          </NSpace>
        </template>
        <NTabs type="line" animated>
          <NTabPane :name="$t('custom.grouping_details.subGroup')" :tab="$t('custom.grouping_details.subGroup')">
            <NSpace>
              <NButton type="primary" @click="showGroupModalChild">
                {{ $t('custom.grouping_details.addSubGroup') }}
              </NButton>
            </NSpace>
            <NSpace class="mt4">
              <NDataTable
                :columns="group_column"
                :data="group_data"
                :loading="loading"
                remote
                :pagination="group_pagination"
                class="h-auto"
              ></NDataTable>
            </NSpace>
            <AddOrEditDevices
              ref="the_modal1"
              :is-edit="false"
              :edit-data="addChildData"
              is-pid-no-edit
              :refresh-data="
                () => {
                  getDetails(currentId as string);
                }
              "
            />
          </NTabPane>

          <NTabPane name="device" :tab="$t('custom.grouping_details.device')">
            <NSpace class="mb6">
              <NButton type="primary" @click="showGroupDeviceModal = true">
                {{ $t('custom.grouping_details.addDeviceToGroup') }}
              </NButton>
            </NSpace>

            <NDataTable :columns="deviceColumns" :data="device_data" :loading="loading" class="h-auto"></NDataTable>
            <NFlex justify="end" class="mt-4">
              <NPagination
                v-model:page="devicePagination.page"
                v-model:page-size="devicePagination.pageSize"
                :page-count="devicePagination.pageCount"
                @update:page="devicePagination.onChange"
              />
            </NFlex>
          </NTabPane>

          <NTabPane name="$t('common.edit')" :tab="$t('custom.grouping_details.setting')">
            <NButton type="primary" @click="showGroupModal">{{ $t('custom.grouping_details.edit') }}</NButton>
            <NDescriptions label-class="min-w-100px" label-placement="top" bordered :column="3">
              <NDescriptionsItem :label="$t('custom.grouping_details.groupLevel')">
                {{ details_data.tier.group_path }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('custom.grouping_details.description')">
                {{ details_data.detail.description }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('custom.grouping_details.createTime')">
                {{ formatDateTime(details_data.detail.created_at) }}
              </NDescriptionsItem>
            </NDescriptions>
            <AddOrEditDevices
              ref="the_modal2"
              :is-edit="true"
              :edit-data="editData"
              :refresh-data="
                () => {
                  getDetails(currentId as string);
                }
              "
            />
          </NTabPane>
        </NTabs>
      </NCard>
    </NSpace>

    <NModal v-model:show="showGroupDeviceModal">
      <NCard
        style="width: 800px"
        :title="$t('custom.grouping_details.addDeviceToGroup')"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <DeviceSelectList
          :group_id="currentId as string"
          @closed_modal="handleChildChange"
          @refresh_data="refresh_data"
        />
      </NCard>
    </NModal>
  </div>
</template>

<style scoped></style>
