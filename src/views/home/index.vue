<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch, computed } from 'vue'
import { debounce } from 'lodash'
import { router } from '@/router'
import { useWebsocketUtil } from '@/utils/websocketUtil'
import { fetchHomeData } from '@/service/api'
import { getThingsVisHomeDashboard, type ThingsVisHomeDashboard } from '@/service/api/thingsvis'
import type { ICardRender, ICardView } from '@/components/panel/card'
import { localStg } from '@/utils/storage'
import { $t } from '@/locales'
import ThingsVisViewer from '@/components/thingsvis/ThingsVisViewer.vue'

const layoutFetched = ref(false)
const layout = ref<ICardView[]>([])
const theme = ref('')
const isError = ref<boolean>(false)
const active = ref<boolean>(true)
const token = localStg.get('token')
const cr = ref<ICardRender>()
const { updateComponentsData, closeAllSockets } = useWebsocketUtil(cr, token as string)

// ThingsVis 首页相关
const thingsVisHome = ref<ThingsVisHomeDashboard | null>(null)
const useThingsVis = ref(false)

// 将 ThingsVis 仪表盘数据转换为 Viewer 需要的 config 格式
const thingsVisConfig = computed(() => {
  if (!thingsVisHome.value) return null
  return {
    canvas: {
      ...thingsVisHome.value.canvasConfig,
      fullWidthPreview: true // 首页嵌入时自适应容器宽度
    },
    nodes: thingsVisHome.value.nodes,
    dataSources: thingsVisHome.value.dataSources
  }
})

const getLayout = async () => {
  // 先检查 ThingsVis 是否有设为首页的仪表盘
  try {
    console.log('[Home] 尝试获取 ThingsVis 首页...')
    const thingsVisResult = await getThingsVisHomeDashboard()
    console.log('[Home] ThingsVis 响应:', thingsVisResult)
    if (!thingsVisResult.error && thingsVisResult.data?.data) {
      console.log('[Home] 使用 ThingsVis 首页:', thingsVisResult.data.data)
      thingsVisHome.value = thingsVisResult.data.data
      useThingsVis.value = true
      layoutFetched.value = true
      return
    }
    console.log('[Home] ThingsVis 没有设置首页，使用原看板')
  } catch (e) {
    // ThingsVis 服务不可用，继续使用原来的看板
    console.log('[Home] ThingsVis 服务错误，使用原看板:', e)
  }

  // 使用原来的看板首页
  const { data, error } = await fetchHomeData({})

  isError.value = (error || !(data && data.config)) as boolean

  if (!isError.value && data) {
    const configJson = JSON.parse(data.config)
    if (Array.isArray(configJson)) {
      updateConfigData(configJson)
      layout.value = [...configJson, ...layout.value]
      layoutFetched.value = true
    } else if (typeof configJson === 'object') {
      if (configJson.layout) {
        updateConfigData(configJson.layout)
        layout.value = configJson.layout
        layoutFetched.value = true
      }
      if (configJson.theme) {
        theme.value = configJson.theme
      }
    }
  }
}

onMounted(getLayout)

onUnmounted(() => {
  closeAllSockets()
})

const throttledWatcher = debounce(() => {
  updateComponentsData(layout)
}, 300)

watch(
  () => layout,
  _newLayout => {
    throttledWatcher()
  },
  { deep: true }
)

/**
 * Todo: Once all config data in server are updated to use unique number as "i" attribute, we can remove this function.
 * Convert a string to a unique number.
 *
 * @param str
 * @returns
 */
function stringToUniqueNumber(str) {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = hash * 31 + str.charCodeAt(i)
  }
  return hash
}

/**
 * Todo: Once all config data in server are updated to use unique number as "i" attribute, we can remove this function.
 * The attribute "i" of each config data may be a string instead of a number, so we need to convert it to a unique
 * number to avoid Vue's warning.
 *
 * @param configJson
 */
function updateConfigData(configJson: ICardView[]) {
  for (const item of configJson) {
    if (typeof item.i === 'string') {
      item.i = stringToUniqueNumber(item.i)
    }
  }
}

const breakpointChanged = (_newBreakpoint: any, newLayout: any) => {
  setTimeout(() => {
    layout.value = newLayout
  }, 300)
}
</script>

<template>
  <div v-if="isError && !useThingsVis" class="h-full w-full flex-center">
    <n-result status="418" :title="$t('custom.home.title')" :description="$t('custom.home.description')">
      <template #footer>
        <n-button
          type="primary"
          :disabled="active"
          @click="
            () => {
              router.go(0)
            }
          "
        >
          <n-countdown
            v-if="active"
            :duration="60000"
            :render="props => props.seconds + 's'"
            :active="active"
            @finish="active = false"
          />
          {{ active ? '' : $t('custom.home.refresh') }}
        </n-button>
      </template>
    </n-result>
  </div>

  <!-- ThingsVis 首页 -->
  <ThingsVisViewer
    v-else-if="useThingsVis && thingsVisHome"
    :config="thingsVisConfig"
    class="h-full w-full"
  />

  <!--
 <div v-else>


  </div> 
-->
  <CardRender
    v-else-if="layoutFetched"
    ref="cr"
    class="home-panel"
    :layout="layout"
    :is-preview="true"
    :col-num="12"
    :default-card-col="4"
    :row-height="85"
    :theme="theme"
    @update:layout="
      data => {
        nextTick(() => {
          layout = data
        })
      }
    "
    @breakpoint-changed="breakpointChanged"
  />
</template>

<style scoped>
.home-panel {
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.5) transparent;
}
</style>
