import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useContext } from '@sa/hooks'
import { useRouteStore } from '@/store/modules/route'

export function useMixMenu() {
  const route = useRoute()
  const routeStore = useRouteStore()

  const activeFirstLevelMenuKey = ref('')

  function setActiveFirstLevelMenuKey(key: string) {
    activeFirstLevelMenuKey.value = key
  }

  function getActiveFirstLevelMenuKey() {
    const { hideInMenu, activeMenu } = route.meta
    const name = route.name as string

    const routeName = (hideInMenu ? activeMenu : name) || name

    // 确保 routeName 存在且为字符串，否则使用默认值
    const safeRouteName = routeName || 'home'
    const [firstLevelRouteName] = safeRouteName.split('_')

    setActiveFirstLevelMenuKey(firstLevelRouteName)
  }

  const menus = computed(
    () => routeStore.menus.find(menu => menu.key === activeFirstLevelMenuKey.value)?.children || []
  )

  watch(
    () => route.name,
    () => {
      getActiveFirstLevelMenuKey()
    },
    { immediate: true }
  )

  return {
    activeFirstLevelMenuKey,
    setActiveFirstLevelMenuKey,
    getActiveFirstLevelMenuKey,
    menus
  }
}

export const { setupStore: setupMixMenuContext, useStore: useMixMenuContext } = useContext('mix-menu', useMixMenu)
