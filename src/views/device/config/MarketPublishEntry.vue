<script setup lang="ts">
/**
 * MarketPublishEntry - 市场发布入口按钮
 *
 * 提供统一的发布入口，支持:
 * - 单个设备模板发布
 * - 单个看板发布
 * - 多个资源组合发布
 */
import { ref, computed } from 'vue'
import { NButton, NIcon, NPopover } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import PublishWizard from './PublishWizard.vue'
import MarketLoginModal from './modules/market-login-modal.vue'
import { useMarketAuth } from './composables/use-market-auth'

export interface PublishEntryParams {
  /** 设备模板 ID 列表 */
  deviceTemplateIds?: string[]
  /** 看板 ID 列表 */
  dashboardIds?: string[]
}

const props = withDefaults(
  defineProps<{
    /** 按钮类型 */
    type?: 'primary' | 'default' | 'info' | 'success' | 'warning' | 'error'
    /** 按钮大小 */
    size?: 'small' | 'medium' | 'large'
    /** 按钮文字 */
    text?: string
    /** 图标 */
    icon?: string
    /** 是否显示为文字按钮 */
    textOnly?: boolean
    /** 是否禁用 */
    disabled?: boolean
    /** 提示信息 */
    tooltip?: string
  }>(),
  {
    type: 'primary',
    size: 'small',
    textOnly: false,
    disabled: false
  }
)

const emit = defineEmits<{
  /** 发布成功 */
  published: []
  /** 发布失败 */
  'publish-error': [error: string]
}>()

const { t } = useI18n()
const { isLoggedIn } = useMarketAuth()

const showWizard = ref(false)
const loginModalRef = ref<InstanceType<typeof MarketLoginModal> | null>(null)
const pendingParams = ref<PublishEntryParams | undefined>()

// 计算按钮文本
const buttonText = computed(() => {
  if (props.text) return props.text
  return t('market.publish.publishToMarket')
})

/**
 * 打开发布向导
 */
function openPublish(params?: PublishEntryParams) {
  pendingParams.value = params
  if (!isLoggedIn()) {
    loginModalRef.value?.open()
    return
  }
  showWizard.value = true
  // 如果有预选资源，延迟打开向导（等待 wizard 挂载）
  if (params?.deviceTemplateIds?.length || params?.dashboardIds?.length) {
    setTimeout(() => {
      wizardRef.value?.open(params)
      pendingParams.value = undefined
    }, 50)
  }
}

/**
 * 处理登录成功
 */
function handleLoginSuccess() {
  showWizard.value = true
  setTimeout(() => {
    wizardRef.value?.open(pendingParams.value)
    pendingParams.value = undefined
  }, 50)
}

/**
 * 处理发布成功
 */
function handlePublished() {
  emit('published')
}

/**
 * 处理发布失败
 */
function handlePublishError(error: string) {
  emit('publish-error', error)
}

const wizardRef = ref<InstanceType<typeof PublishWizard> | null>(null)

// 暴露方法给父组件
defineExpose({
  openPublish
})
</script>

<template>
  <div class="market-publish-entry">
    <!-- 文字按钮 -->
    <template v-if="textOnly">
      <NButton :type="type" :size="size" :disabled="disabled" text @click="openPublish()">
        <template v-if="icon" #icon>
          <NIcon :icon />
        </template>
        {{ buttonText }}
      </NButton>
    </template>

    <!-- 普通按钮 -->
    <template v-else>
      <NPopover v-if="tooltip" trigger="hover">
        <template #trigger>
          <NButton :type="type" :size="size" :disabled="disabled" @click="openPublish()">
            <template v-if="icon" #icon>
              <NIcon :icon />
            </template>
            {{ buttonText }}
          </NButton>
        </template>
        {{ tooltip }}
      </NPopover>
      <NButton v-else :type="type" :size="size" :disabled="disabled" @click="openPublish()">
        <template v-if="icon" #icon>
          <NIcon :icon />
        </template>
        {{ buttonText }}
      </NButton>
    </template>

    <!-- 市场登录弹窗 -->
    <MarketLoginModal ref="loginModalRef" @login-success="handleLoginSuccess" />

    <!-- 发布向导 -->
    <PublishWizard ref="wizardRef" v-model="showWizard" @published="handlePublished" />
  </div>
</template>

<style scoped>
.market-publish-entry {
  display: inline-flex;
}
</style>
