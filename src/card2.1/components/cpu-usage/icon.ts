import { h } from 'vue'
import { Icon } from '@iconify/vue'

export const CpuUsageIcon = () =>
  h(Icon, {
    icon: 'fa-microchip',
    class: 'text-green-600 dark:text-green-400'
  })
