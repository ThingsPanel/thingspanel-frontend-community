<script setup lang="tsx">
import { reactive, ref, watchEffect } from 'vue'
import type { UploadFileInfo } from 'naive-ui'
import { localStg } from '@/utils/storage'
import { addTemplat, getTemplat, putTemplat } from '@/service/api/system-data'
import { $t } from '@/locales'
import { getDemoServerUrl } from '@/utils/common/tool'

const emit = defineEmits(['update:stepCurrent', 'update:modalVisible', 'update:deviceTemplateId'])

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
})
const deviceTemplateId = ref(props.deviceTemplateId)
const formRef: any = ref(null)

interface AddFrom {
  name: string
  templateTage: string[]
  version: string
  author: string
  description: string
  path: string
  label: string
  id?: string
}

const addFrom: AddFrom = reactive({
  name: '',
  templateTage: [],
  version: '',
  author: '',
  description: '',
  path: '',
  label: ''
})

type Rule = {
  required: boolean
  trigger: string[]
  message: string
}

type Rules = {
  name: Rule
}

const fromRules: Rules = {
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: "请输入模板名称"
  }
}

// addTags
const tageFlag = ref<boolean>(false)
const addTageText = ref<string>('')
const addTags: () => void = () => {
  tageFlag.value = true
}
const tagBlur: () => void = () => {
  if (addTageText.value !== '') {
    addFrom.templateTage.push(addTageText.value)
    addTageText.value = ''
    tageFlag.value = false
  }
}
// eslint-disable-next-line no-unused-vars
const tagsClose: (index: number) => void = index => {
  addFrom.templateTage.splice(index, 1)
}

// upload
const demoUrl = getDemoServerUrl()
const url: any = ref(demoUrl)
const pngPath: any = ref('')
// eslint-disable-next-line
const customRequest = ({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) => {
  if (!event || !event.target) return

  const xhr = event.target as XMLHttpRequest
  const response = JSON.parse(xhr.response)

  addFrom.path = response.data.path
  const relativePath = response.data.path.replace(/^\.\//, '')
  pngPath.value = `${url.value.replace('api/v1', '') + relativePath}`
}

// 新增设备功能模板
const next: () => void = async () => {
  await formRef.value?.validate()
  if (addFrom.id) {
    addFrom.label = addFrom.templateTage.join(',')
    const response: any = await putTemplat(addFrom)
    emit('update:stepCurrent', 2)
    emit('update:deviceTemplateId', response.data.id)
  } else {
    addFrom.label = addFrom.templateTage.join(',')
    const response: any = await addTemplat(addFrom)
    emit('update:stepCurrent', 2)
    emit('update:deviceTemplateId', response.data.id)
  }
}

const cancellation: () => void = () => {
  emit('update:modalVisible', false)
}

watchEffect(async () => {
  deviceTemplateId.value = props.deviceTemplateId
  if (deviceTemplateId.value) {
    const { data, error } = await getTemplat(deviceTemplateId.value)
    if (!error) {
      if (data) {
        addFrom.name = data.name
        addFrom.id = data.id
        addFrom.path = data.path
        addFrom.description = data.description
        addFrom.version = data.version
        addFrom.author = data.author
        addFrom.templateTage = data.label && data.label.length > 0 ? data.label?.split(',') : []
        pngPath.value = data.path === '' ? '' : `${url.value.replace('api/v1', '') + data.path}`
      }
    }
  } else {
    addFrom.name = ''
    addFrom.name = ''
    addFrom.id = ''
    addFrom.path = ''
    addFrom.description = ''
    addFrom.version = ''
    addFrom.author = ''
    addFrom.templateTage = []
  }
})
</script>

<template>
  <div class="flex flex-col">
    <n-form
      ref="formRef"
      :model="addFrom"
      :rules="fromRules"
      label-placement="left"
      label-width="100"
      require-mark-placement="right-hanging"
      class="addFrom"
    >
      <n-form-item :label="模板名称" path="name">
        <n-input v-model:value.trim="addFrom.name" :placeholder="请输入模板名称" />
      </n-form-item>
      <n-form-item :label="模板标签" class="tag-item">
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
          {{ "添加标签" }}
          <template #icon>
            <SvgIcon local-icon="add" class="more" />
          </template>
        </n-tag>
        <n-input
          v-else
          v-model:value.trim="addTageText"
          class="tag-ipt"
          :placeholder="请输入标签名称"
          autofocus
          @blur="tagBlur"
        />
      </n-form-item>

      <n-form-item :label="选择封面">
        <n-upload
          :action="url + '/file/up'"
          :headers="{ 'x-token': localStg.get('token') || '' }"
          :data="{ type: 'image' }"
          class="upload"
          :show-file-list="false"
          accept="image/png, image/jpeg, image/jpg, image/gif"
          @finish="customRequest"
        >
          <n-upload-dragger class="upload-dragger">
            <div class="upload-content">
              <img v-if="pngPath && pngPath !== ''" :src="pngPath" class="slt" />
              <template v-else>
                <n-icon size="35" :depth="3">
                  <SvgIcon local-icon="picture" class="more" />
                </n-icon>
                <p class="upload-text">{{ "选择封面" }}</p>
              </template>
            </div>
          </n-upload-dragger>
        </n-upload>
      </n-form-item>

      <n-form-item :label="作者名称">
        <n-input v-model:value.trim="addFrom.author" :placeholder="请输入作者名称" />
      </n-form-item>
      <n-form-item :label="模板版本">
        <n-input v-model:value.trim="addFrom.version" :placeholder="请输入模板版本" />
      </n-form-item>
      <n-form-item :label="说明">
        <n-input
          v-model:value.trim="addFrom.description"
          type="textarea"
          :placeholder="请输入说明"
        />
      </n-form-item>
    </n-form>
  </div>
  <div class="box1 m-t2">
    <n-button type="primary" @click="next">{{ "下一步" }}</n-button>
    <n-button class="m-r3" @click="cancellation">{{ "取消" }}</n-button>
  </div>
</template>

<style lang="scss" scoped>
.upload {
  width: 200px;
  height: 150px;
  position: relative;

  .upload-dragger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 200px;
    height: 150px;
    cursor: pointer;
  }

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .upload-text {
    margin-top: 8px;
    font-size: 14px;
  }

  .slt {
    position: absolute;
    top: 0;
    left: 0;
    width: 200px;
    height: 150px;
    object-fit: cover;
  }
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
  width: 100%;
}

.box1 {
  display: flex;
  flex-direction: row-reverse;
}
</style>
