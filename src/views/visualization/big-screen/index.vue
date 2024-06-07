<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue';
// import {useRouter} from 'vue-router';
import { NButton, NCard, NForm, NFormItem, NGrid, NGridItem, NInput, NModal, useMessage } from 'naive-ui';
import type { LastLevelRouteKey } from '@elegant-router/types'; // 假设您已经定义好了这些API
import { DelBoard, PostBoard, PutBoard, getBoardList } from '@/service/api';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { $t } from '@/locales';

const { routerPushByKey } = useRouterPush();
const message = useMessage();
const nameSearch = ref('');
const currentPage = ref(1);
const pageSize = ref(12); // 或根据你的实际需求来设置
const total = ref(0);
const boards = ref<Panel.Board[]>([]);
const showModal = ref<boolean>(false);
const isEditMode = ref(false);
// 初始化表单数据
const formData = reactive({
  id: '',
  name: '',
  home_flag: 'N',
  description: ''
});

// 设置表单数据
const setFormData = data => {
  Object.assign(formData, data);
};

// 清除表单数据
const clearFormData = () => {
  setFormData({ id: '', name: '', home_flag: 'N', description: '' });
  isEditMode.value = false;
};

const setupData = v => {
  boards.value = v;
};
// 获取大屏列表
const fetchBoards = async () => {
  const { data } = await getBoardList({ page: currentPage.value, page_size: pageSize.value, name: nameSearch.value });
  if (data && data.list) {
    setupData(data.list as Panel.Board[]);
    total.value = data.total;
  }
};

// 提交表单
const submitForm = async () => {
  if (!formData.name) {
    message.error($t('common.screenNameNull'));
    return;
  }

  if (isEditMode.value) {
    await PutBoard(formData); // 编辑大屏
  } else {
    await PostBoard(formData); // 新建大屏
  }

  message.success(isEditMode.value ? $t('common.modifySuccess') : $t('common.addSuccess'));
  showModal.value = false;
  clearFormData();
  await fetchBoards();
};

const editBoard = board => {
  setFormData({ ...board });
  isEditMode.value = true;
  showModal.value = true;
};

// 删除大屏
const deleteBoard = async (id: string) => {
  await DelBoard(id); // 假设DelBoard接收大屏的id
  message.success($t('common.deleteSuccess'));
  await fetchBoards(); // 刷新大屏列表
};

// Edit big screen with Visual Editor
const editWithVEditor = board => {
  const id = board.id;
  const token = localStg.get('token');
  const expiresTime = localStg.get('token_expires_in');
  sessionStorage.setItem('thingspanel_token', token || '');
  const visualUrl = import.meta.env.PROD ? '/visual' : 'http://localhost:5173';
  const url = `${visualUrl}/editor?id=${id}&token=${token}&expiresTime=${expiresTime}`;
  window.open(url, '_blank');
};

// View big screen in Visual Editor
const viewWithVEditor = board => {
  const id = board.id;
  const token = localStg.get('token');
  const expiresTime = localStg.get('token_expires_in');
  const visualUrl = import.meta.env.PROD ? '/visual' : 'http://localhost:5173';
  const url = `${visualUrl}/display?id=${id}&token=${token}&expiresTime=${expiresTime}`;
  window.open(url, '_blank');
};

// 页面跳转
const goRouter = (name: LastLevelRouteKey, id: string) => {
  routerPushByKey(name, { query: { id } });
};
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
onMounted(fetchBoards);
</script>

<template>
  <div class="h-full w-full">
    <NCard>
      <div class="flex-1-hidden">
        <div class="m-b-20px flex flex-wrap items-center gap-15px">
          <!-- 新建按钮 -->
          <div class="flex-1">
            <NButton type="primary" @click="showModal = true">+{{ $t('generate.create-large-screen') }}</NButton>
          </div>
          <!-- 搜索部分 -->
          <div class="flex items-center gap-20px">
            <NInput
              v-model:value="nameSearch"
              clearable
              :placeholder="$t('generate.search-by-name')"
              @clear="
                () => {
                  nameSearch = '';
                  fetchBoards();
                }
              "
            />

            <NButton type="primary" @click="fetchBoards">{{ $t('common.search') }}</NButton>
          </div>
        </div>
        <!-- 大屏列表 -->
        <NGrid x-gap="24" y-gap="16" cols="1 s:2 m:3 l:4" responsive="screen">
          <NGridItem
            v-for="board in boards"
            :key="board.id"
            @click="goRouter('visualization_kanban-details', board.id as string)"
          >
            <NCard hoverable style="height: 160px" @click.stop="viewWithVEditor(board)">
              <div class="mb-8px text-16px font-600">{{ board.name }}</div>
              <!-- 使用NTooltip组件 -->
              <NTooltip trigger="hover" placement="top-start" :style="{ maxWidth: '200px' }">
                <template #trigger>
                  <div class="description">{{ board.description }}</div>
                </template>
                {{ board.description }}
              </NTooltip>
              <div class="mt-4 flex justify-end gap-2">
                <n-tooltip trigger="hover" placement="top">
                  <template #trigger>
                    <NButton strong secondary circle @click.stop="editWithVEditor(board)">
                      <template #icon>
                        <icon-material-symbols:edit-square class="text-24px text-blue" />
                      </template>
                    </NButton>
                  </template>
                  {{ $t('common.visualEditing') }}
                </n-tooltip>

                <n-tooltip trigger="hover" placement="top">
                  <template #trigger>
                    <NButton strong secondary circle @click.stop="editBoard(board)">
                      <template #icon>
                        <icon-material-symbols:contract-edit-outline class="text-24px text-blue" />
                      </template>
                    </NButton>
                  </template>
                  {{ $t('common.editNameAndDesc') }}
                </n-tooltip>

                <n-tooltip trigger="hover" placement="top">
                  <template #trigger>
                    <NButton strong secondary circle @click.stop="deleteBoard(board.id as string)">
                      <template #icon>
                        <icon-material-symbols:delete-outline class="text-24px text-red" />
                      </template>
                    </NButton>
                  </template>
                  {{ $t('common.delete') }}
                </n-tooltip>
              </div>
            </NCard>
          </NGridItem>
        </NGrid>
      </div>
      <!-- 大屏列表后面添加分页器 -->
      <NFlex justify="end">
        <NPagination v-model:page="currentPage" :page-size="pageSize" :item-count="total" @update:page="fetchBoards" />
      </NFlex>
    </NCard>
    <!-- 新建和编辑大屏的模态框 -->
    <NModal
      v-model:show="showModal"
      :title="isEditMode ? $t('common.editScreen') : $t('common.addScreen')"
      :class="getPlatform ? 'w-90%' : 'w-500px'"
    >
      <NCard bordered>
        <NForm :model="formData" class="flex-1">
          <NFormItem :label="$t('generate.large-screen-name')" path="name">
            <NInput v-model:value="formData.name" :placeholder="$t('generate.enter-large-screen-name')" />
          </NFormItem>
          <NFormItem :label="$t('device_template.table_header.description')">
            <NInput
              v-model:value="formData.description"
              type="textarea"
              :placeholder="$t('generate.enter-description')"
            />
          </NFormItem>
        </NForm>
        <template #footer>
          <div class="flex justify-end gap-2">
            <NButton
              type="default"
              @click="
                showModal = false;
                clearFormData();
              "
            >
              {{ $t('generate.cancel') }}
            </NButton>
            <NButton type="primary" @click="submitForm">{{ $t('common.save') }}</NButton>
          </div>
        </template>
      </NCard>
    </NModal>
  </div>
</template>

<style scoped>
.description {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  /* 确保这是一个块级元素 */
  max-width: 100%;
  color: #666;
  margin-bottom: 12px;
}
</style>
