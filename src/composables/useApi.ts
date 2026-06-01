import { ref } from 'vue'

export interface UseApiState<T> {
  data: T | null
  error: unknown
  loading: boolean
}

export function useApi<T>(call: () => Promise<T>) {
  const data = ref<T | null>(null)
  const error = ref<unknown>(null)
  const loading = ref(false)

  const execute = async () => {
    loading.value = true
    error.value = null
    try {
      data.value = await call()
      return data.value
    } catch (err) {
      error.value = err
      throw err
    } finally {
      loading.value = false
    }
  }

  return { data, error, loading, execute }
}
