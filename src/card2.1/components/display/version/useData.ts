import { ref, onMounted, reactive } from 'vue'
import { getSysVersion } from '@/service/api/system-data'
import axios from 'axios'

export function useData() {
  const data = reactive({
    version: '',
    latestVersion: '',
    isLatest: false,
    loading: true,
    error: null as Error | null
  })

  const fetchLatestVersion = async () => {
    try {
      const res = await axios.get('https://api.github.com/repos/ThingsPanel/thingspanel-backend-community/tags')
      if (res?.data?.[0]?.name) {
        data.latestVersion = res.data[0].name
      } else {
        data.latestVersion = '--'
      }
    } catch (error) {
      console.warn('获取最新版本信息失败:', error)
      data.latestVersion = '--'
      // 不向上抛出错误，因为这是一个非关键功能
    }
  }

  const fetchCurrentVersion = async () => {
    try {
      const res = await getSysVersion()
      if (res?.data?.version) {
        data.version = res.data.version
      } else {
        data.version = '--'
      }
    } catch (e: any) {
      console.error('获取当前系统版本失败:', e)
      data.version = '--'
      data.error = e
    }
  }

  const compareVersions = () => {
    if (data.latestVersion && data.version && data.latestVersion !== '--' && data.version !== '--') {
      data.isLatest = data.latestVersion === data.version
    } else {
      data.isLatest = false
    }
  }

  onMounted(async () => {
    data.loading = true
    await Promise.all([fetchLatestVersion(), fetchCurrentVersion()])
    compareVersions()
    data.loading = false
  })

  return {
    data
  }
}
