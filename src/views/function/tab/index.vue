<script setup lang="ts">
import { ref } from 'vue'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'
import { useTabStore } from '@/store/modules/tab'

const tabStore = useTabStore()
const { routerPushByKey } = useRouterPush()

const tabLabel = ref('')

function changeTabLabel() {
  tabStore.setTabLabel(tabLabel.value)
}

function resetTabLabel() {
  tabStore.resetTabLabel()
}
</script>

<template>
  <NSpace vertical :size="16">
    <NCard
      :title="标签页操作"
      :bordered="false"
      size="small"
      segmented
      class="card-wrapper"
    >
      <NDivider title-placement="left">{{ "添加标签页" }}</NDivider>
      <NButton @click="routerPushByKey('about')">{{ "跳转到关于页面" }}</NButton>
      <NDivider title-placement="left">{{ "关闭标签页" }}</NDivider>
      <NSpace>
        <NButton @click="tabStore.removeActiveTab">
          {{ "关闭当前标签页" }}
        </NButton>
        <NButton @click="tabStore.removeTabByRouteName('about')">
          {{ "关闭"关于"标签页" }}
        </NButton>
      </NSpace>
      <NDivider title-placement="left">{{ "添加多标签页" }}</NDivider>
      <NSpace>
        <NButton @click="routerPushByKey('function_multi-tab')">
          {{ "跳转到多标签页页面" }}
        </NButton>
        <NButton @click="routerPushByKey('function_multi-tab', { query: { a: '1' } })">
          {{ "跳转到多标签页页面(带有查询参数)" }}
        </NButton>
      </NSpace>
    </NCard>
    <NCard
      :title="标签页标题"
      :bordered="false"
      size="small"
      segmented
      class="card-wrapper"
    >
      <NDivider title-placement="left">{{ "修改标题" }}</NDivider>
      <NInputGroup class="max-w-240px">
        <NInput v-model:value="tabLabel" />
        <NButton type="primary" @click="changeTabLabel">{{ "修改" }}</NButton>
      </NInputGroup>
      <NDivider title-placement="left">{{ "重置标题" }}</NDivider>
      <NButton type="error" ghost class="w-80px" @click="resetTabLabel">
        {{ "重置" }}
      </NButton>
    </NCard>
  </NSpace>
</template>

<style scoped></style>
