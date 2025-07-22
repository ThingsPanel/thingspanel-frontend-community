import { createDiscreteApi } from 'naive-ui'

/**
 * Creates a discrete API instance for Naive UI components.
 * This is used to display messages and other UI elements from outside of a component's setup function.
 */
export const { message, notification, dialog, loadingBar } = createDiscreteApi([
  'message',
  'dialog',
  'notification',
  'loadingBar'
])
