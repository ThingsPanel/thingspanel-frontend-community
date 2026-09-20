import { ref } from 'vue'

import { localizeError } from '@/service/thingmodel/client'

export function useFormSubmit<T>(submitFn: () => Promise<T>, opts: { successMsg?: string } = {}) {
  const submitting = ref(false)

  const submit = async () => {
    submitting.value = true
    try {
      const result = await submitFn()
      window.$message?.success(opts.successMsg ?? 'Saved successfully')
      return result
    } catch (error) {
      window.$message?.error(localizeError(error))
      throw error
    } finally {
      submitting.value = false
    }
  }

  return { submitting, submit }
}
