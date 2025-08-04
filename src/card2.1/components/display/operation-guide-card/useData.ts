import { ref, onMounted } from 'vue'
import { createLogger } from '@/utils/logger'

const logger = createLogger('useOperationGuideData')

export function useData() {
  const isAdmin = ref(false)

  const checkUserRole = () => {
    try {
      const userInfoRaw = localStorage.getItem('userInfo')
      if (userInfoRaw) {
        const userInfo = JSON.parse(userInfoRaw)
        if (Array.isArray(userInfo?.roles) && userInfo.roles.includes('SYS_ADMIN')) {
          isAdmin.value = true
        } else {
          isAdmin.value = false
        }
      } else {
        isAdmin.value = false
      }
    } catch (error) {
      logger.error('Error reading or parsing userInfo from localStorage:', error)
      isAdmin.value = false
    }
  }

  onMounted(checkUserRole)

  return { isAdmin }
}
