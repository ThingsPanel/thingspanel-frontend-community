<script setup lang="ts">
import { computed, getCurrentInstance, ref } from 'vue';
import type { FormInst } from 'naive-ui';
import { delRolePermissions, fetchUIElementList, getRolePermissions, modifyRolePermissions } from '@/service/api';
import { $t } from '@/locales';
const { proxy }: any = getCurrentInstance();
export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 编辑的表格行数据 */
  editData?: any | null;
}

interface Element {
  id: string;
  parent_id: string;
  element_code: string;
  element_type: number;
  description: string;
  children: Element[];
}

interface TreeNode {
  label: string;
  key: string;
  children: TreeNode[];
}

function convertToTreeNodes(elements: Element[]): TreeNode[] {
  return elements.map(item => ({
    label: item.description,
    key: item.id,
    disabled: item.element_code === 'home', // 禁止选中首页
    children: item.children.length > 0 ? convertToTreeNodes(item.children) : []
  }));
}

defineOptions({ name: 'EditPermissionModal' });

const props = withDefaults(defineProps<Props>(), {
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;

  /** 点击协议 */
  (e: 'success'): void;
}

const emit = defineEmits<Emits>();

const modalVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});
const closeModal = () => {
  modalVisible.value = false;
};

const title = computed(() => {
  return `${$t('page.manage.role.editPermission')} - ${props.editData?.name}`;
});

const formRef = ref<HTMLElement & FormInst>();

const selectedPermissions = ref<string[]>([]);
const treeOptions = ref<any>([]);

const initRolePermissions = async () => {
  // 首页默认选中
  const data = treeOptions.value.find(item => item.label === '首页');
  if (props.editData) {
    const permissions = await getRolePermissions(props.editData.id);
    selectedPermissions.value = [...new Set([data.key, ...permissions])];
  } else {
    selectedPermissions.value = [data.key];
  }
};

const initUIElementList = async () => {
  const uiElementList = await fetchUIElementList();
  treeOptions.value = convertToTreeNodes(uiElementList);
  initRolePermissions();
};

async function handleSubmit() {
  let data: any;
  // delete first element which is the root node
  const indeterminateData = proxy.$refs.treeRef.getIndeterminateData().keys;
  const currentPermissions = [...selectedPermissions.value, ...indeterminateData];
  // currentPermissions.shift();
  selectedPermissions.value = [];
  console.log(currentPermissions);
  if (currentPermissions.length === 0) {
    data = await delRolePermissions(props.editData?.id);
  } else {
    data = await modifyRolePermissions(props.editData?.id, currentPermissions);
  }
  closeModal();
  if (!data.error) {
    emit('success');
  }
}
</script>

<template>
  <n-modal
    v-model:show="modalVisible"
    preset="card"
    :title="title"
    :on-after-enter="
      () => {
        initUIElementList();
      }
    "
  >
    <n-form ref="formRef" label-placement="left" :label-width="80">
      <div class="h-300px overflow-y-auto">
        <n-tree
          ref="treeRef"
          v-model:checked-keys="selectedPermissions"
          :data="treeOptions"
          :cascade="false"
          checkable
          block-line
        />
      </div>
      <n-space class="w-full pt-16px" :size="24" justify="end">
        <n-button class="w-72px" @click="closeModal">{{ $t('generate.cancel') }}</n-button>
        <n-button class="w-72px" type="primary" @click="handleSubmit">{{ $t('page.login.common.confirm') }}</n-button>
      </n-space>
    </n-form>
  </n-modal>
</template>

<style scoped></style>
