import { h } from 'vue'
import { Icon } from '@iconify/vue'

export const TenantChartIcon = () =>
  h(Icon, {
    icon: 'mdi:chart-bar',
    class: 'text-blue-600 dark:text-blue-400'
  })
