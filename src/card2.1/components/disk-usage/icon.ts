import { h } from 'vue'
import { Icon } from '@iconify/vue'

export const DiskUsageIcon = () =>
  h(Icon, {
    icon: 'ant-design:hdd-outlined',
    class: 'text-orange-600 dark:text-orange-400'
  })
