<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, reactive, ref } from 'vue'
import { NButton, useDialog, useMessage } from 'naive-ui'
import { useRoute } from 'vue-router'
import ClipboardJS from 'clipboard'
import { useTabStore } from '@/store/modules/tab'
import { useRouterPush } from '@/hooks/common/router'
import { deviceConfigDel, deviceConfigEdit } from '@/service/api/device'
import { $t } from '@/locales'
import type { UploadFileInfo } from 'naive-ui'
import { localStg } from '@/utils/storage'
import { getDemoServerUrl } from '@/utils/common/tool'

interface Props {
  configInfo?: object | any
}
const emit = defineEmits(['change'])
const props = withDefaults(defineProps<Props>(), {
  configInfo: null
})
const dialog = useDialog()
const message = useMessage()
const route = useRoute()
const tabStore = useTabStore()
const { routerPush } = useRouterPush()
const deleteConfig = () => {
  dialog.warning({
    title: "提示",
    content: "删除设备配置",
    positiveText: "确定",
    negativeText: "取消",
    onPositiveClick: async () => {
      const res: any = await deviceConfigDel({ id: props.configInfo.id })

      if (!res || !res.error) {
        message.success("操作成功")
        await tabStore.removeTab(route.path)
        await routerPush({ path: '/device/config' })
      }
    }
  })
}
const showModal = ref(false)
const modalIndex = ref(1)
console.log(props.configInfo)
const auto_register = ref(props.configInfo?.auto_register === 1 || false)
const onlinejson = reactive({
  online_timeout: 0,
  heartbeat: 0
})

// 图片上传相关
const demoUrl = getDemoServerUrl()
const url: any = ref(demoUrl)
const imagePath: any = ref('')
// eslint-disable-next-line no-unused-vars
const customRequest = ({ file, event }: { file: UploadFileInfo; event?: ProgressEvent }) => {
  if (!event || !event.target) return

  const xhr = event.target as XMLHttpRequest
  const response = JSON.parse(xhr.response)

  // 保存图片路径
  const relativePath = response.data.path.replace(/^\.\//, '')
  imagePath.value = `${url.value.replace('api/v1', '') + relativePath}`

  // 直接保存图片路径到服务器
  saveImagePath(relativePath)
}

// 保存图片路径到服务器
const saveImagePath = async (relativePath: string) => {
  const { error }: any = await deviceConfigEdit({
    id: props.configInfo.id,
    image_url: relativePath
  })

  if (!error) {
    message.success("操作成功")
    emit('change')
  }
}

const onDialogVisble = () => {
  showModal.value = !showModal.value
}
const onOpenDialogModal = (val: number) => {
  modalIndex.value = val
  onDialogVisble()
  if (modalIndex.value !== 1) {
    const { online_timeout, heartbeat }: any = JSON.parse(props.configInfo?.other_config || {})
    onlinejson.online_timeout = online_timeout || 0
    onlinejson.heartbeat = heartbeat || 0
  }
}
const copyOneTypeOneSecretDevicePassword = () => {
  const textToCopy = props.configInfo?.template_secret || ''
  console.log('要复制的内容 (clipboard.js - refined):', textToCopy)

  if (!textToCopy) {
    message.error("没有内容可复制")
    return
  }

  // 1. 创建一个 textarea 作为临时元素
  const textarea = document.createElement('textarea')
  textarea.value = textToCopy
  // 设置样式使其不可见且不影响布局
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.left = '-9999px'
  // 确保元素是可编辑的（尽管readonly也可以，但默认状态通常更好）
  // textarea.setAttribute('readonly', '');
  document.body.appendChild(textarea)

  // 2. 使用 clipboard.js 实例，但目标是这个 textarea
  // 我们这里不直接将 clipboard 绑定到 textarea，而是利用其API来触发复制
  // clipboard.js 通常需要一个触发元素，我们仍然用一个假的按钮
  const triggerElement = document.createElement('button')
  document.body.appendChild(triggerElement) // 必须在DOM中才能绑定

  const clipboard = new ClipboardJS(triggerElement, {
    target: () => textarea, // 明确指定从 textarea 复制
    // text: () => textToCopy, // 如果用 target, text 选项会被忽略
    container: document.body
  })

  // eslint-disable-next-line no-unused-vars
  let success = false

  clipboard.on('success', e => {
    success = true
    console.log('Clipboard.js success event. Copied text:', e.text)
    message.success("操作成功")
    e.clearSelection()
    cleanup()
  })

  clipboard.on('error', e => {
    console.error('Clipboard.js error event:', e)
    message.error("复制失败")
    cleanup()
  })

  const cleanup = () => {
    clipboard.destroy()
    document.body.removeChild(textarea)
    document.body.removeChild(triggerElement)
  }

  // 3. 显式选择 textarea 中的文本
  textarea.select()
  textarea.setSelectionRange(0, textToCopy.length) // 兼容移动设备
  textarea.focus() // 尝试给予焦点

  // 4. 触发复制
  triggerElement.click()

  // 5. 为防止某些情况下事件未立即触发或清理过早，可以加一个小的延时
  //    但这通常不应该是首选，如果 clipboard.js 工作正常，其事件应能处理。
  //    如果以上仍然失败，可以考虑一个非常短的延时来执行 cleanup。
  // setTimeout(() => {
  //   if (!success) { // 如果没有成功事件触发（理论上不应该）
  //     cleanup();
  //   }
  // }, 100); // 100ms 应该足够
}
const onSubmit = async () => {
  onDialogVisble()
  if (modalIndex.value !== 1) {
    const { error }: any = await deviceConfigEdit({
      id: props.configInfo.id,
      other_config: JSON.stringify({
        online_timeout: onlinejson.online_timeout,
        heartbeat: onlinejson.heartbeat
      })
    })
    !error && emit('change')
  } else {
    const { error }: any = await deviceConfigEdit({
      id: props.configInfo.id,
      auto_register: auto_register.value ? 1 : 0
    })
    message.success("操作成功")
    !error && emit('change')
  }
}
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
onMounted(() => {
  console.log(props.configInfo.auto_register, 'auto_register')
  auto_register.value = props.configInfo?.auto_register === 1 || false
  // 初始化图片路径
  imagePath.value = props.configInfo?.image_url ? `${url.value.replace('api/v1', '') + props.configInfo.image_url}` : ''
})
</script>

<template>
  <div class="flex-col gap-30px p-10px">
    <div class=">
      <div class="m-b-10px">{{ "自动创建设备" }}</div>
      <div class="m-b-10px">{{ "通过一型一密动态获取证书创建设备" }}</div>
      <NButton class=" type="primary" @click="onOpenDialogModal(1)">{{ "配置" }}</NButton>
    </div>
    <div class=">
      <div class="m-b-10px">{{ "设备在线配置" }}</div>
      <NButton class=" type="primary" @click="onOpenDialogModal(2)">{{ "配置" }}</NButton>
    </div>
    <div class=">
      <div class="m-b-10px">{{ "设备配置图片" }}</div>

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
            <img v-if="imagePath && imagePath !== ''" :src="imagePath" class="slt" />
            <template v-else>
              <n-icon size="35" :depth="3">
                <SvgIcon local-icon="picture" class="more" />
              </n-icon>
              <p class="upload-text">{{ "设备配置图片" }}</p>
            </template>
          </div>
        </n-upload-dragger>
      </n-upload>
    </div>
    <div>
      <div class="m-b-10px color-error-500">{{ "删除设备模板" }}</div>
      <NButton type="error" @click="deleteConfig">{{ "删除" }}</NButton>
    </div>

    <n-modal
      v-model:show="showModal"
      preset="dialog"
      :class="getPlatform ? '90%' : 'w-400px'"
      :title="modalIndex === 1 ? "配置自动创建设备" : "设备在线配置"
      :show-icon="false"
    >
      <template v-if="modalIndex === 1">
        <dl class="flex-col gap-20px">
          <dd>{{ "允许设备自动创建" }}</dd>
          <dd>
            <n-switch v-model:value="auto_register" />
          </dd>
          <dd>{{ "复制一型一密设备的密码" }}</dd>
          <dd>
            <NButton type="primary" @click="copyOneTypeOneSecretDevicePassword">{{ "复制" }}</NButton>
          </dd>
        </dl>
      </template>
      <template v-else>
        <dl class="m-b-20px flex-col">
          <dt class="m-b-5px font-900">{{ "超时时间（分钟）" }}</dt>
          <dd class="m-b-10px">
            {{ ">0代表启用超时功能，用来判断设备是否异常在线。当设备在该时间内未上报遥测数据，平台会认为该设备已离线" }}
          </dd>
          <dd class="m-b-20px max-w-220px">
            <n-input-number v-model:value="onlinejson.online_timeout" placeholder="></n-input-number>
          </dd>
          <dt class="m-b-5px font-900">{{ "心跳判断（秒）" }}</dt>
          <dd class="m-b-10px">{{ ">0代表启用心跳判断，系统仅按照遥测数据的上报作为设备的心跳判断在线离线状态" }}</dd>
          <dd class="max-w-220px">
            <n-input-number v-model:value="onlinejson.heartbeat" type="text" placeholder="></n-input-number>
          </dd>
        </dl>
      </template>

      <NFlex justify="end">
        <NButton @click="onDialogVisble">{{ "取消" }}</NButton>
        <NButton type="primary" @click="onSubmit">{{ "保存" }}</NButton>
      </NFlex>
    </n-modal>
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
</style>
