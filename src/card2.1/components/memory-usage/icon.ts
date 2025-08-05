import { h } from 'vue'
import { Icon } from '@iconify/vue'

export const MemoryUsageIcon = () =>
  h(Icon, {
    icon: 'ant-design:alert-outlined',
    class: 'text-blue-600 dark:text-blue-400'
  })
