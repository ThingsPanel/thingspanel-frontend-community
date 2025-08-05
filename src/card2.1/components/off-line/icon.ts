import { h } from 'vue'
import { Icon } from '@iconify/vue'

export const OffLineIcon = () =>
  h(Icon, {
    icon: 'fa-ban',
    class: 'text-blue-600 dark:text-blue-400'
  })
