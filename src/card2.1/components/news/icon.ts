import { h } from 'vue'
import { Icon } from '@iconify/vue'

export const NewsIcon = () =>
  h(Icon, {
    icon: 'fa-envelope',
    class: 'text-orange-600 dark:text-orange-400'
  })
