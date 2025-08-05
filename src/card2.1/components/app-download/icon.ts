import { h } from 'vue'
import { Icon } from '@iconify/vue'

export const AppDownloadIcon = () =>
  h(Icon, {
    icon: 'mdi:download',
    class: 'text-blue-600 dark:text-blue-400'
  })
