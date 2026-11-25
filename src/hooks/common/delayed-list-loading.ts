import { type Ref, ref, watch } from 'vue'

/** Show loading feedback only if a list request is still pending after a short delay. */
export function useDelayedListLoading(loading: Readonly<Ref<boolean>>) {
  const visible = ref(false)
  watch(
    loading,
    (pending, _, onCleanup) => {
      visible.value = false
      if (!pending) return
      const timer = setTimeout(() => {
        visible.value = true
      }, 180)
      onCleanup(() => clearTimeout(timer))
    },
    { flush: 'sync', immediate: true }
  )
  return visible
}
