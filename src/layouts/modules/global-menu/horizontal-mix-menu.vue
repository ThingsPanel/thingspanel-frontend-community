<script setup lang="ts">
import { ref } from 'vue'
import { useRouterPush } from '@/hooks/common/router'
import { useMixMenuContext } from '../../hooks/use-mix-menu'
import FirstLevelMenu from './first-level-menu.vue'

defineOptions({
  name: 'HorizontalMixMenu'
})

const mixMenuContext = useMixMenuContext()
const activeFirstLevelMenuKey = mixMenuContext?.activeFirstLevelMenuKey || ref('')
const setActiveFirstLevelMenuKey = mixMenuContext?.setActiveFirstLevelMenuKey || (() => {})
const { routerPushByKey } = useRouterPush()

function handleSelectMixMenu(menu: App.Global.Menu) {
  setActiveFirstLevelMenuKey(menu.key)

  if (!menu.children?.length) {
    routerPushByKey(menu.routeKey)
  }
}
</script>

<template>
  <FirstLevelMenu :active-menu-key="activeFirstLevelMenuKey" @select="handleSelectMixMenu">
    <slot></slot>
  </FirstLevelMenu>
</template>

<style scoped></style>
