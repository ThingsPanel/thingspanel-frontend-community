<script setup lang="ts">
import { computed, ref } from 'vue';
// eslint-disable-next-line import/order
import type { UploadFileInfo } from 'naive-ui';
import { generateUUID, getDemoServerUrl, getFileName } from '@/utils/common/tool';
import { localStg } from '@/utils/storage';
import { STATIC_BASE_URL } from '@/constants/common';
import { $t } from '~/src/locales';

const url = ref(new URL(getDemoServerUrl()));
defineOptions({ name: 'UploadFile' });

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
  text?: string;
  /** 上传的文件类型 */
  fileType: string[];
  value: string | null | undefined;
  sourceType?: string;
}

const props = withDefaults(defineProps<Props>(), {
  accept: 'file',
  text: $t('page.product.update-package.package'),
  sourceType: SourceType.image,
  fileType: () => ['exe', 'apk', 'zip', 'ipa']
});
const dataList = computed((): UploadFileInfo[] => {
  if (!props.value) {
    return [];
  }
  return (
    props.value?.split(',').map((item: string) => ({
      id: generateUUID(),
      name: getFileName(item),
      status: 'finished',
      url: item.replace('.', STATIC_BASE_URL)
    })) || []
  );
});

interface Emits {
  (e: 'update:value', val: string): void;
  (e: 'success', file: UploadFileInfo): void;
}

const emit = defineEmits<Emits>();

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
    window.$message?.error(`${$t('common.pleaseUploadit')}${props.fileType.join('/')}图片${$t('common.formatFile')}`);
    return false;
  }
  return true;
}

function handleFinish({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) {
  const response = JSON.parse((event?.target as XMLHttpRequest).response);
  window.$message?.success(response.message);
  emit('update:value', response.data.path);
  emit('success', file);
}

function handleError({ event }: { event?: ProgressEvent }) {
  window.$message?.error((event?.target as XMLHttpRequest).response || $t('page.product.list.fileUploadFail'));
}
</script>

<template>
  <NUpload
    :action="url + '/file/up'"
    :headers="{
      'x-token': localStg.get('token') || ''
    }"
    :data="{ type: props.sourceType }"
    :default-file-list="dataList"
    :accept="accept"
    :max="1"
    @before-upload="beforeUpload"
    @finish="handleFinish"
    @error="handleError"
  >
    <NButton>{{ props.text }}</NButton>
  </NUpload>
</template>
