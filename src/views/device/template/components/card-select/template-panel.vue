<script lang="tsx" setup>
import type { Ref } from 'vue'
import { inject, nextTick, onMounted, provide, reactive, ref, watch } from 'vue'
import type { ICardData, ICardRender, ICardView } from '@/components/panel/card'
import { getTemplat } from '@/service/api'
import { $t } from '@/locales'
import AddTemplateCard from './ui/add-template-card.vue'

const props = defineProps<{ templateId: string; isApp: boolean }>()

const device_template_id = ref<any>(props.templateId as any)

provide('device_template_id', device_template_id)
const webChartConfig = inject<Ref<ICardView[]>>('web_chart_config')
const layout = ref<ICardView[]>([])
const fetchBroad = async () => {
  const { data, error } = await getTemplat(props.templateId)
  if (!error && data) {
    if (props.isApp && data.app_chart_config) {
      const configJson = JSON.parse(data.app_chart_config)
      layout.value = [...configJson]
    } else if (data.web_chart_config) {
      const configJson = JSON.parse(data.web_chart_config)
      layout.value = [...configJson]
    }
  }
}

const state = reactive({
  openAddPanel: false,
  cardData: null as null | ICardData
})

const editView = ref<ICardView | null>()
const cr = ref<ICardRender>()

const insertCard = (card: ICardData) => {
  if (editView.value && 'data' in editView.value) {
    editView.value.data = card

    const lastUniqueById = layout.value
      .reduceRight((acc: ICardView[], cur: ICardView) => {
        if (
          !acc.some(item => {
            if (!item.data) return false
            return item?.data?.cardId === cur?.data?.cardId
          })
        ) {
          acc.push(cur as ICardView) // 如果acc中没有当前cur的cardId，则添加cur到acc中
        }
        return acc
      }, [])
      .reverse()
    layout.value = lastUniqueById
  } else {
    cr.value?.addCard(card)
  }
  editView.value = null
  state.openAddPanel = false
}

const add = () => {
  editView.value = null
  state.cardData = null
  state.openAddPanel = true
}
const edit = (view: ICardView) => {
  editView.value = view
  state.cardData = view.data || null
  state.openAddPanel = true
}

const updateLayoutData = (data: ICardView[]) => {
  nextTick(() => {
    layout.value = data
  })
}

watch(
  () => layout.value,
  () => {
    if (webChartConfig?.value) {
      webChartConfig.value = layout.value as any
    }
  }
)

onMounted(fetchBroad)
</script>

<template>
  <div class="w-full px-5 py-5">
    <NSpace align="center">
      <NButton @click="add">
        <SvgIcon icon="material-symbols:add" class="mr-0.5 text-lg" />
        {{ $t('generate.add-chart') }}
      </NButton>
    </NSpace>
    <div class="mb-2 mt-2 h-2px bg-[#f6f9f8]" />
    <div v-if="!layout.length" class="mt-20 text-center text-gray-500 dark:text-gray-400">
      <NEmpty :description="$t('common.componentsAddedYet')"></NEmpty>
    </div>
    <div :class="props.isApp ? 'screena overflow-auto h-[600px]' : 'window-screen'">
      <div :class="props.isApp ? 'm-auto w-480px smartphone overflow-auto' : 'w-full relative'">
        <CardRender
          ref="cr"
          :layout="layout"
          :is-preview="false"
          :col-num="props.isApp ? 4 : 12"
          :default-card-col="4"
          :breakpoints="{ lg: 780, md: 500, sm: 0 }"
          :cols="{ lg: 12, md: 6, sm: 4 }"
          :row-height="85"
          @update:layout="updateLayoutData"
          @edit="edit"
        />
      </div>
    </div>
    <AddTemplateCard v-model:open="state.openAddPanel" :data="state.cardData" @save="insertCard" />
  </div>
</template>

<style lang="scss" scoped>
.panel {
  @apply border border-transparent;
}
.smartphone {
  width: 480px; /* 设置手机外框的宽度 */
  height: 960px; /* 设置手机外框的高度 */
  border: 16px solid black; /* 设置边框模拟手机边框 */
  border-radius: 32px; /* 设置边框圆角模拟手机的圆角 */
  display: flex; /* 使用flex布局 */
  justify-content: center; /* 水平居中 */
  align-items: start; /* 垂直居中 */
  background: #f3f3f3; /* 设置背景颜色 */
  box-shadow: 0 0 10px #999; /* 添加阴影效果 */
}

.screen {
  width: 90%; /* 设置屏幕宽度为手机宽度的90% */
  height: 90%; /* 设置屏幕高度为手机高度的90% */
  background: white; /* 设置屏幕背景颜色为白色 */
  border-radius: 24px; /* 设置屏幕边框圆角 */
  display: flex; /* 使用flex布局 */
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  color: black; /* 设置文本颜色 */
  font-family: Arial, sans-serif; /* 设置字体 */
}

/* 定制滚动条的整体样式 */
.screena::-webkit-scrollbar {
  width: 4px; /* 滚动条宽度 */
}

/* 定制滚动条滑块（thumb）的样式 */
.screena::-webkit-scrollbar-thumb {
  background: #888; /* 滚动条滑块颜色 */
  border-radius: 4px; /* 滚动条滑块圆角 */
}

/* 定制滚动条轨道（track）的样式 */
.screena::-webkit-scrollbar-track {
  background: #f0f0f0; /* 滚动条轨道颜色 */
  border-radius: 4px; /* 滚动条轨道圆角 */
}
</style>
