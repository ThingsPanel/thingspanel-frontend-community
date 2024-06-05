<script setup lang="tsx">
import { reactive, ref, watchEffect } from 'vue';
import type { UploadFileInfo } from 'naive-ui';
import { localStg } from '@/utils/storage';
import { addTemplat, getTemplat, putTemplat } from '@/service/api/system-data';
import { $t } from '@/locales';
import { getDemoServerUrl } from '@/utils/common/tool';

const emit = defineEmits(['update:stepCurrent', 'update:modalVisible', 'update:deviceTemplateId']);

const props = defineProps({
  stepCurrent: {
    type: Number,
    required: true
  },
  modalVisible: {
    type: Boolean,
    required: true
  },
  deviceTemplateId: {
    type: String,
    required: true
  }
});
const deviceTemplateId = ref(props.deviceTemplateId);
const formRef: any = ref(null);

interface AddFrom {
  name: string;
  templateTage: string[];
  version: string;
  author: string;
  description: string;
  path: string;
  label: string;
  id?: string;
}

const addFrom: AddFrom = reactive({
  name: '',
  templateTage: [],
  version: '',
  author: '',
  description: '',
  path: '',
  label: ''
});

type Rule = {
  required: boolean;
  trigger: string[];
  message: string;
};

type Rules = {
  name: Rule;
};

const fromRules: Rules = {
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('device_template.enterTemplateName')
  }
};

// addTags
const tageFlag = ref<boolean>(false);
const addTageText = ref<string>('');
const addTags: () => void = () => {
  tageFlag.value = true;
};
const tagBlur: () => void = () => {
  if (addTageText.value !== '') {
    addFrom.templateTage.push(addTageText.value);
    addTageText.value = '';
    tageFlag.value = false;
  }
};
const tagsClose: (index: number) => void = index => {
  addFrom.templateTage.splice(index, 1);
};

// upload
const demoUrl = getDemoServerUrl();
const url: any = ref(demoUrl);
const pngPath: any = ref('');

const customRequest = ({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) => {
  if (!event || !event.target) return;

  const xhr = event.target as XMLHttpRequest;
  const response = JSON.parse(xhr.response);

  console.log(response.data.path, 'response');
  addFrom.path = response.data.path;
  console.log(addFrom.path, 'addFrom.path');
  const relativePath = response.data.path.replace(/^\.\//, '');
  pngPath.value = `${url.value.replace('api/v1', '') + relativePath}`;
  console.log(pngPath.value, file);
};

// 新增设备功能模板
const next: () => void = async () => {
  await formRef.value?.validate();
  if (addFrom.id) {
    addFrom.label = addFrom.templateTage.join(',');
    const response: any = await putTemplat(addFrom);
    emit('update:stepCurrent', 2);
    emit('update:deviceTemplateId', response.data.id);
  } else {
    addFrom.label = addFrom.templateTage.join(',');
    const response: any = await addTemplat(addFrom);
    emit('update:stepCurrent', 2);
    emit('update:deviceTemplateId', response.data.id);
  }
};

const cancellation: () => void = () => {
  emit('update:modalVisible', false);
};

watchEffect(async () => {
  deviceTemplateId.value = props.deviceTemplateId;
  console.log(deviceTemplateId.value, 'deviceTemplateId.value');
  if (deviceTemplateId.value) {
    const { data, error } = await getTemplat(deviceTemplateId.value);
    if (!error) {
      if (data) {
        addFrom.name = data.name;
        addFrom.id = data.id;
        addFrom.path = data.path;
        addFrom.description = data.description;
        addFrom.version = data.version;
        addFrom.author = data.author;
        addFrom.templateTage = data.label && data.label.length > 0 ? data.label?.split(',') : [];
        pngPath.value = data.path === '' ? '' : `${url.value.replace('api/v1', '') + data.path}`;
      }
    }
  } else {
    addFrom.name = '';
    addFrom.name = '';
    addFrom.id = '';
    addFrom.path = '';
    addFrom.description = '';
    addFrom.version = '';
    addFrom.author = '';
    addFrom.templateTage = [];
  }
});
</script>

<template>
  <div class="flex flex-justify-between">
    <n-form
      ref="formRef"
      :model="addFrom"
      :rules="fromRules"
      label-placement="left"
      label-width="100"
      require-mark-placement="right-hanging"
      class="addFrom"
    >
      <n-form-item :label="$t('device_template.templateName')" path="name">
        <n-input v-model:value.trim="addFrom.name" :placeholder="$t('device_template.enterTemplateName')" />
      </n-form-item>
      <n-form-item :label="$t('device_template.templateTage')" class="tag-item">
        <n-tag
          v-for="(item, index) in addFrom.templateTage"
          :key="index"
          size="small"
          class="tag"
          closable
          @close="tagsClose(index)"
        >
          {{ item }}
        </n-tag>
        <n-tag v-if="!tageFlag" size="small" class="tag addTage" @click="addTags">
          {{ $t('device_template.addTage') }}
          <template #icon>
            <SvgIcon local-icon="add" class="more" />
          </template>
        </n-tag>
        <n-input
          v-else
          v-model:value.trim="addTageText"
          class="tag-ipt"
          :placeholder="$t('generate.enter-tag-name')"
          autofocus
          @blur="tagBlur"
        />
      </n-form-item>
      <n-form-item :label="$t('device_template.authorName')">
        <n-input v-model:value.trim="addFrom.author" :placeholder="$t('device_template.enterAuthorName')" />
      </n-form-item>
      <n-form-item :label="$t('device_template.templateVersion')">
        <n-input v-model:value.trim="addFrom.version" :placeholder="$t('device_template.entertemplateVersion')" />
      </n-form-item>
      <n-form-item :label="$t('device_template.illustrate')">
        <n-input
          v-model:value.trim="addFrom.description"
          type="textarea"
          :placeholder="$t('device_template.enterIllustrate')"
        />
      </n-form-item>
    </n-form>
    <n-upload
      :action="url + '/file/up'"
      :headers="{ 'x-token': localStg.get('token') || '' }"
      :data="{ type: 'image' }"
      class="upload"
      :show-file-list="false"
      accept="image/png, image/jpeg, image/jpg, image/gif"
      @finish="customRequest"
    >
      <n-upload-dragger>
        <img v-if="pngPath && pngPath !== ''" :src="pngPath" class="slt" />
        <n-icon v-else size="35" :depth="3">
          <SvgIcon local-icon="picture" class="more" />
        </n-icon>
      </n-upload-dragger>
      <n-button-group>
        <n-upload-trigger #="{ handleClick }" abstract>
          <n-button class="upload-btn m-t4" @click.stop="handleClick">
            {{ $t('device_template.selectCover') }}
          </n-button>
        </n-upload-trigger>
      </n-button-group>
    </n-upload>
  </div>
  <div class="box1 m-t2">
    <n-button type="primary" @click="next">{{ $t('device_template.nextStep') }}</n-button>
    <n-button class="m-r3" @click="cancellation">{{ $t('device_template.cancellation') }}</n-button>
  </div>
</template>

<style lang="scss" scoped>
.upload {
  width: 200px;
  height: 150px;
  pointer-events: none;
  margin-right: 100px;
  position: relative;

  .n-upload-dragger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 200px;
    height: 150px;
  }

  .slt {
    position: absolute;
    top: 0;
    left: 0;
    width: 200px;
    height: 150px;
  }
}

:deep(.n-button-group) {
  display: grid;
  justify-items: end;
}

.tag {
  min-width: max-content;
  padding-left: 0.5rem;
  max-width: 1rem;
  height: 2.3rem;
  border-radius: 0.6rem;
  margin-right: 0.4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 5px;
}

.tag-ipt {
  width: 10rem;
  height: 2.3rem;
}

.tag-item {
  :deep(.n-form-item-blank) {
    align-items: stretch;
    flex-wrap: wrap;
  }
}

.addTage {
  cursor: pointer;
  padding-right: 1rem;
}

.addFrom {
  min-width: 700px;
}

.upload-btn {
  pointer-events: auto;
}

.box1 {
  display: flex;
  flex-direction: row-reverse;
}
</style>
