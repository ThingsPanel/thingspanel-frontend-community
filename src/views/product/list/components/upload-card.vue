<script setup lang="ts">
import type { Ref } from 'vue';
import { ref, watch } from 'vue';
// eslint-disable-next-line import/order
import type { UploadFileInfo } from 'naive-ui';
import { localStg } from '@/utils/storage';
import { STATIC_BASE_URL } from '@/constants/common';
import { getDemoServerUrl } from '@/utils/common/tool';
import { resolveBackendAbsoluteUrl } from '@/store/modules/sys-setting/resolve-backend-url';
import { $t } from '~/src/locales';
// eslint-disable-next-line import/order

defineOptions({ name: 'UploadFile' });

const url = ref(resolveBackendAbsoluteUrl(getDemoServerUrl()));

enum SourceType {
  image = 'image',
  upgradePackage = 'upgradePackage',
  importBatch = 'importBatch',
  plugin = 'plugin',
  other = 'other'
}

export interface Props {
  /** 选取文件的类型 */
  accept: string;
  /** 上传的文件类型 */
  fileType: string[];
  sourceType?: string;
  value: string | null | undefined;
  tosValue?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'image/png, image/jpeg, image/jpg, image/gif',
  fileType: () => ['png', 'jpeg', 'jpg', 'gif'],
  sourceType: SourceType.image,
  tosValue: null
});
const toFileList = (value?: string | null): UploadFileInfo[] => (
  value?.split(',').filter(Boolean).map((item, index) => ({
    id: `${item}-${index}`,
    name: item.split('/').pop() || 'product-image',
    status: 'finished',
    url: /^https?:\/\//i.test(item) ? item : item.replace('.', STATIC_BASE_URL)
  })) || []
);
const dataList: Ref<UploadFileInfo[]> = ref(toFileList(props.value));

watch(() => props.value, value => {
  dataList.value = toFileList(value);
});

interface Emits {
  (e: 'update:value', val: string): void;

  (e: 'update:tosValue', val: string): void;

  (e: 'success', file: UploadFileInfo): void;
}

const emit = defineEmits<Emits>();
const migratingLegacyImage = ref(false);

async function migrateLegacyProductImage(value?: string | null) {
  if (
    migratingLegacyImage.value ||
    props.tosValue ||
    props.sourceType !== 'product-image' ||
    !/(?:^|\/)files\/image\//.test(value || '')
  ) return;
  migratingLegacyImage.value = true;
  try {
    const imageUrl = /^https?:\/\//i.test(value as string)
      ? value as string
      : (value as string).replace('.', STATIC_BASE_URL);
    const source = await fetch(imageUrl);
    if (!source.ok) throw new Error(`HTTP ${source.status}`);
    const form = new FormData();
    form.append('file', await source.blob(), (value as string).split('/').pop() || 'product-image.png');
    const uploaded = await fetch(`${url.value}/file/up?type=product-image`, {
      method: 'POST',
      headers: { 'x-token': localStg.get('token') || '' },
      body: form
    });
    const response = await uploaded.json();
    if (!uploaded.ok || !/^https:\/\/[^/]+\.tos-[^/]+\.volces\.com\//i.test(response?.data?.tos_path || '')) {
      throw new Error(response?.message || `HTTP ${uploaded.status}`);
    }
    emit('update:tosValue', response.data.tos_path);
  } catch (error) {
    window.$message?.error(`${$t('page.product.list.fileUploadFail')}: ${String(error)}`);
  } finally {
    migratingLegacyImage.value = false;
  }
}

watch([() => props.value, () => props.tosValue], ([value]) => void migrateLegacyProductImage(value), { immediate: true });

async function beforeUpload(data: { file: UploadFileInfo; fileList: UploadFileInfo[] }) {
  let isImg: boolean = false;
  if (props.fileType.length) {
    let fileExtension = '';
    if (data.file?.name.lastIndexOf('.') > -1) {
      fileExtension = data.file?.name.slice(data.file?.name.lastIndexOf('.') + 1);
    }
    isImg = props.fileType.some(type => {
      if (data.file.file?.type && data.file.file?.type.indexOf(type) > -1) return true;
      if (fileExtension && fileExtension.includes(type)) return true;
      return false;
    });
  } else if (data.file.file?.type && data.file.file?.type.indexOf('image') > -1) {
    isImg = true;
  }
  if (!isImg) {
    window.$message?.error(`${$t('common.pleaseUploadit')}${props.fileType.join('/')}${$t('common.formatFile')}`);
    return false;
  }
  return true;
}

function handleFinish({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) {
  const response = JSON.parse((event?.target as XMLHttpRequest).response);
  // window.$message?.success(response.message);
  emit('update:value', response.data.path);
  emit('update:tosValue', response.data.tos_path);
  emit('success', file);
}

function handleError({ event }: { event?: ProgressEvent }) {
  window.$message?.error((event?.target as XMLHttpRequest).response || $t('page.product.list.fileUploadFail'));
}
</script>

<template>
  <NUpload
    :action="`${url}/file/up?type=${encodeURIComponent(props.sourceType)}`"
    :headers="{
      'x-token': localStg.get('token') || ''
    }"
    :data="{ type: props.sourceType }"
    v-model:file-list="dataList"
    list-type="image-card"
    :accept="accept"
    :max="1"
    @before-upload="beforeUpload"
    @finish="handleFinish"
    @error="handleError"
  ></NUpload>
</template>
