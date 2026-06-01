<script setup lang="ts">
import { createReusableTemplate } from '@vueuse/core'
import type { RouteKey } from '@elegant-router/types'
import { useThemeStore } from '@/store/modules/theme'
import { useRouteStore } from '@/store/modules/route'
import { useRouterPush } from '@/hooks/common/router'

defineOptions({
  name: 'GlobalBreadcrumb'
})

const themeStore = useThemeStore()
const routeStore = useRouteStore()
const { routerPushByKey } = useRouterPush()

interface BreadcrumbContentProps {
  breadcrumb: App.Global.Menu
}

const [DefineBreadcrumbContent, BreadcrumbContent] = createReusableTemplate<BreadcrumbContentProps>()

function handleClickMenu(key: RouteKey) {
  routerPushByKey(key)
}

function canClickBreadcrumb(index: number) {
  return index < routeStore.breadcrumbs.length - 1
}
</script>

<template>
  <NBreadcrumb v-if="themeStore.header.breadcrumb.visible">
    <!-- define component: BreadcrumbContent -->
    <DefineBreadcrumbContent v-slot="{ breadcrumb }">
      <div class="i-flex-y-center align-middle">
        <component :is="breadcrumb.icon" v-if="themeStore.header.breadcrumb.showIcon" class="mr-4px text-icon" />
        {{ breadcrumb.label }}
      </div>
    </DefineBreadcrumbContent>
    <!-- define component: BreadcrumbContent -->

    <NBreadcrumbItem v-for="(item, index) in routeStore.breadcrumbs" :key="item.key">
      <NDropdown v-if="item.options?.length" :options="item.options" @select="handleClickMenu">
        <BreadcrumbContent :breadcrumb="item" />
      </NDropdown>
      <div
        v-else
        :class="canClickBreadcrumb(index) ? 'cursor-pointer transition-opacity hover:opacity-80' : ''"
        @click="canClickBreadcrumb(index) && handleClickMenu(item.routeKey)"
      >
        <BreadcrumbContent :breadcrumb="item" />
      </div>
    </NBreadcrumbItem>
  </NBreadcrumb>
</template>

<style scoped></style>
