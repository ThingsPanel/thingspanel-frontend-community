import { h } from 'vue'
import { Icon } from '@iconify/vue'

export const OnLineIcon = () =>
  h(Icon, {
    icon: 'fa-wifi',
    class: 'text-purple-600 dark:text-purple-400'
  })
