<template>
  <div class="example-container">
    <h1>EditorLayout 组件示例</h1>

    <!-- 基础示例 -->
    <NCard title="基础示例" class="mb-4">
      <div class="example-wrapper">
        <EditorLayout
          ref="basicEditorRef"
          left-title="组件库"
          right-title="属性面板"
          :left-drawer-width="300"
          :right-drawer-width="350"
          :default-left-visible="true"
          @left-drawer-change="onLeftDrawerChange"
          @right-drawer-change="onRightDrawerChange"
        >
          <template #left>
            <div class="panel-content">
              <h3>组件库</h3>
              <NSpace vertical>
                <NButton block>基础组件</NButton>
                <NButton block>图表组件</NButton>
                <NButton block>表单组件</NButton>
                <NButton block>媒体组件</NButton>
              </NSpace>
            </div>
          </template>

          <template #main>
            <div class="canvas-area">
              <div class="canvas-placeholder">
                <NIcon size="48" :color="themeStore.darkMode ? '#ffffff40' : '#00000040'">
                  <svg viewBox="0 0 24 24">
                    <path
                      d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 19V5h14v14H5z"
                      fill="currentColor"
                    />
                    <path d="M13.96 12.17l-2.83-2.83-3.5 4.67h10.48l-2.82-3.76z" fill="currentColor" />
                  </svg>
                </NIcon>
                <p>画布区域</p>
                <p class="text-sm opacity-60">在这里设计你的页面</p>
              </div>
            </div>
          </template>

          <template #right>
            <div class="panel-content">
              <h3>属性配置</h3>
              <NForm :model="formData" label-placement="top">
                <NFormItem label="组件名称">
                  <NInput v-model:value="formData.name" placeholder="输入组件名称" />
                </NFormItem>
                <NFormItem label="宽度">
                  <NInputNumber v-model:value="formData.width" :min="0" class="w-full" />
                </NFormItem>
                <NFormItem label="高度">
                  <NInputNumber v-model:value="formData.height" :min="0" class="w-full" />
                </NFormItem>
                <NFormItem label="背景色">
                  <NColorPicker v-model:value="formData.backgroundColor" />
                </NFormItem>
                <NFormItem label="可见性">
                  <NSwitch v-model:value="formData.visible">
                    <template #checked>显示</template>
                    <template #unchecked>隐藏</template>
                  </NSwitch>
                </NFormItem>
              </NForm>
            </div>
          </template>
        </EditorLayout>
      </div>
    </NCard>

    <!-- 控制面板 -->
    <NCard title="控制面板" class="mb-4">
      <NSpace>
        <NButton type="primary" @click="basicEditorRef?.toggleLeftDrawer()">切换左侧面板</NButton>
        <NButton type="primary" @click="basicEditorRef?.toggleRightDrawer()">切换右侧面板</NButton>
        <NButton @click="basicEditorRef?.openLeftDrawer()">打开左侧</NButton>
        <NButton @click="basicEditorRef?.closeLeftDrawer()">关闭左侧</NButton>
        <NButton @click="basicEditorRef?.openRightDrawer()">打开右侧</NButton>
        <NButton @click="basicEditorRef?.closeRightDrawer()">关闭右侧</NButton>
      </NSpace>
    </NCard>

    <!-- 无工具栏示例 -->
    <NCard title="自定义工具栏示例" class="mb-4">
      <div class="example-wrapper">
        <EditorLayout
          ref="customEditorRef"
          left-title="资源库"
          right-title="设置"
          :show-toolbar="false"
          :show-mask="true"
          :left-drawer-width="280"
          :right-drawer-width="300"
        >
          <template #left>
            <div class="panel-content">
              <h3>资源库</h3>
              <NTabs type="line" animated>
                <NTabPane name="images" tab="图片">
                  <NGrid cols="2" :x-gap="8" :y-gap="8">
                    <NGi v-for="i in 6" :key="i">
                      <div class="resource-item">
                        <div class="resource-placeholder">图片{{ i }}</div>
                      </div>
                    </NGi>
                  </NGrid>
                </NTabPane>
                <NTabPane name="icons" tab="图标">
                  <NGrid cols="3" :x-gap="8" :y-gap="8">
                    <NGi v-for="i in 9" :key="i">
                      <div class="icon-item">
                        <NIcon size="24">
                          <svg viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" fill="currentColor" />
                          </svg>
                        </NIcon>
                      </div>
                    </NGi>
                  </NGrid>
                </NTabPane>
              </NTabs>
            </div>
          </template>

          <template #main>
            <div class="custom-canvas">
              <!-- 自定义工具栏 -->
              <div class="custom-toolbar">
                <NButtonGroup>
                  <NButton
                    :type="customEditorRef?.leftDrawerVisible ? 'primary' : 'default'"
                    @click="customEditorRef?.toggleLeftDrawer()"
                  >
                    <template #icon>
                      <NIcon>
                        <svg viewBox="0 0 24 24">
                          <path d="M3 18h6v-2H3v2zM3 6v2h6V6H3zm0 7h6v-2H3v2z" fill="currentColor" />
                        </svg>
                      </NIcon>
                    </template>
                    资源
                  </NButton>
                  <NButton
                    :type="customEditorRef?.rightDrawerVisible ? 'primary' : 'default'"
                    @click="customEditorRef?.toggleRightDrawer()"
                  >
                    <template #icon>
                      <NIcon>
                        <svg viewBox="0 0 24 24">
                          <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            fill="currentColor"
                          />
                        </svg>
                      </NIcon>
                    </template>
                    设置
                  </NButton>
                </NButtonGroup>

                <NSpace>
                  <NButton>保存</NButton>
                  <NButton>预览</NButton>
                  <NButton>发布</NButton>
                </NSpace>
              </div>

              <!-- 画布内容 -->
              <div class="canvas-content">
                <div class="canvas-placeholder">
                  <NIcon size="64" :color="themeStore.darkMode ? '#ffffff30' : '#00000030'">
                    <svg viewBox="0 0 24 24">
                      <path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        fill="currentColor"
                      />
                    </svg>
                  </NIcon>
                  <h3>自定义画布区域</h3>
                  <p>使用自定义工具栏控制面板显示</p>
                </div>
              </div>
            </div>
          </template>

          <template #right>
            <div class="panel-content">
              <h3>页面设置</h3>
              <NForm :model="pageSettings" label-placement="top">
                <NFormItem label="页面标题">
                  <NInput v-model:value="pageSettings.title" />
                </NFormItem>
                <NFormItem label="页面描述">
                  <NInput v-model:value="pageSettings.description" type="textarea" :rows="3" />
                </NFormItem>
                <NFormItem label="页面主题">
                  <NSelect v-model:value="pageSettings.theme" :options="themeOptions" />
                </NFormItem>
                <NFormItem label="启用动画">
                  <NSwitch v-model:value="pageSettings.animations" />
                </NFormItem>
                <NFormItem label="响应式布局">
                  <NSwitch v-model:value="pageSettings.responsive" />
                </NFormItem>
              </NForm>
            </div>
          </template>
        </EditorLayout>
      </div>
    </NCard>

    <!-- 状态显示 -->
    <NCard title="当前状态">
      <NDescriptions bordered :column="2">
        <NDescriptionsItem label="左侧抽屉状态">
          <NTag :type="leftDrawerStatus ? 'success' : 'default'">
            {{ leftDrawerStatus ? '已打开' : '已关闭' }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="右侧抽屉状态">
          <NTag :type="rightDrawerStatus ? 'success' : 'default'">
            {{ rightDrawerStatus ? '已打开' : '已关闭' }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="当前主题">
          <NTag :type="themeStore.darkMode ? 'warning' : 'info'">
            {{ themeStore.darkMode ? '深色模式' : '浅色模式' }}
          </NTag>
        </NDescriptionsItem>
        <NDescriptionsItem label="主题色">
          <div class="flex items-center space-x-2">
            <div class="w-4 h-4 rounded" :style="{ backgroundColor: themeStore.themeColors.primary }"></div>
            <span>{{ themeStore.themeColors.primary }}</span>
          </div>
        </NDescriptionsItem>
      </NDescriptions>
    </NCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import {
  NCard,
  NSpace,
  NButton,
  NButtonGroup,
  NIcon,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NColorPicker,
  NSwitch,
  NTabs,
  NTabPane,
  NGrid,
  NGi,
  NSelect,
  NDescriptions,
  NDescriptionsItem,
  NTag
} from 'naive-ui'
import { useThemeStore } from '@/store/modules/theme'
import EditorLayout from './EditorLayout.vue'

// 主题 store
const themeStore = useThemeStore()

// 组件引用
const basicEditorRef = ref<InstanceType<typeof EditorLayout>>()
const customEditorRef = ref<InstanceType<typeof EditorLayout>>()

// 状态
const leftDrawerStatus = ref(true)
const rightDrawerStatus = ref(false)

// 表单数据
const formData = reactive({
  name: '示例组件',
  width: 200,
  height: 100,
  backgroundColor: '#ffffff',
  visible: true
})

// 页面设置
const pageSettings = reactive({
  title: '我的页面',
  description: '这是一个使用可视化编辑器创建的页面',
  theme: 'default',
  animations: true,
  responsive: true
})

// 主题选项
const themeOptions = [
  { label: '默认主题', value: 'default' },
  { label: '科技蓝', value: 'tech-blue' },
  { label: '商务风', value: 'business' },
  { label: '简约白', value: 'minimal' }
]

// 事件处理
function onLeftDrawerChange(visible: boolean) {
  leftDrawerStatus.value = visible
  console.log('左侧抽屉状态变化:', visible)
}

function onRightDrawerChange(visible: boolean) {
  rightDrawerStatus.value = visible
  console.log('右侧抽屉状态变化:', visible)
}
</script>

<style scoped>
.example-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.example-wrapper {
  height: 600px;
  border: 1px solid var(--n-border-color);
  border-radius: var(--n-border-radius);
  overflow: hidden;
}

.panel-content {
  padding: 16px;
  height: 100%;
}

.panel-content h3 {
  margin: 0 0 16px 0;
  color: var(--n-text-color);
  font-size: 16px;
  font-weight: 600;
}

.canvas-area {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(45deg, var(--n-body-color) 25%, transparent 25%),
    linear-gradient(-45deg, var(--n-body-color) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--n-body-color) 75%),
    linear-gradient(-45deg, transparent 75%, var(--n-body-color) 75%);
  background-size: 20px 20px;
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0px;
}

.canvas-placeholder {
  text-align: center;
  color: var(--n-text-color);
  opacity: 0.6;
}

.canvas-placeholder p {
  margin: 8px 0 0 0;
}

.resource-item {
  aspect-ratio: 1;
  border: 1px solid var(--n-border-color);
  border-radius: var(--n-border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--n-card-color);
  cursor: pointer;
  transition: all 0.2s var(--n-bezier);
}

.resource-item:hover {
  border-color: var(--n-primary-color);
  transform: translateY(-2px);
}

.resource-placeholder {
  font-size: 12px;
  color: var(--n-text-color);
  opacity: 0.7;
}

.icon-item {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--n-border-color);
  border-radius: var(--n-border-radius);
  cursor: pointer;
  transition: all 0.2s var(--n-bezier);
  color: var(--n-text-color);
}

.icon-item:hover {
  border-color: var(--n-primary-color);
  color: var(--n-primary-color);
  transform: scale(1.1);
}

.custom-canvas {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.custom-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: var(--n-card-color);
  border-bottom: 1px solid var(--n-border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.canvas-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 25% 25%, var(--n-primary-color-suppl) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, var(--n-info-color-suppl) 0%, transparent 50%);
}

.canvas-content .canvas-placeholder {
  text-align: center;
  color: var(--n-text-color);
}

.canvas-content h3 {
  margin: 16px 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.canvas-content p {
  margin: 0;
  opacity: 0.7;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .example-container {
    padding: 16px;
  }

  .example-wrapper {
    height: 500px;
  }

  .custom-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>
