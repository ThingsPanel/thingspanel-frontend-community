// src/components/panelv2/composables/useKeyboard.ts

import { onMounted, onUnmounted } from 'vue'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  action: () => void
  description?: string
}

export function useKeyboard() {
  const shortcuts = new Map<string, KeyboardShortcut>()

  // 注册快捷键
  const registerShortcut = (shortcut: KeyboardShortcut) => {
    const keyId = generateKeyId(shortcut)
    shortcuts.set(keyId, shortcut)
  }

  // 批量注册快捷键
  const registerShortcuts = (shortcutList: KeyboardShortcut[]) => {
    shortcutList.forEach(registerShortcut)
  }

  // 注销快捷键
  const unregisterShortcut = (key: string, ctrl = false, shift = false, alt = false) => {
    const keyId = generateKeyId({ key, ctrl, shift, alt, action: () => {} })
    shortcuts.delete(keyId)
  }

  // 生成快捷键ID
  const generateKeyId = (shortcut: Pick<KeyboardShortcut, 'key' | 'ctrl' | 'shift' | 'alt'>) => {
    const modifiers = []
    if (shortcut.ctrl) modifiers.push('ctrl')
    if (shortcut.shift) modifiers.push('shift')
    if (shortcut.alt) modifiers.push('alt')
    return `${modifiers.join('+')}-${shortcut.key.toLowerCase()}`
  }

  // 键盘事件处理
  const handleKeydown = (event: KeyboardEvent) => {
    const keyId = generateKeyId({
      key: event.key,
      ctrl: event.ctrlKey || event.metaKey, // Mac 上的 Cmd 键
      shift: event.shiftKey,
      alt: event.altKey
    })

    const shortcut = shortcuts.get(keyId)
    if (shortcut) {
      event.preventDefault()
      shortcut.action()
    }
  }

  // 格式化快捷键显示
  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const parts = []
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

    if (shortcut.ctrl) {
      parts.push(isMac ? '⌘' : 'Ctrl')
    }
    if (shortcut.shift) {
      parts.push(isMac ? '⇧' : 'Shift')
    }
    if (shortcut.alt) {
      parts.push(isMac ? '⌥' : 'Alt')
    }

    parts.push(shortcut.key.toUpperCase())
    return parts.join(isMac ? '' : '+')
  }

  // 获取所有已注册的快捷键
  const getAllShortcuts = () => {
    return Array.from(shortcuts.values())
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    registerShortcut,
    registerShortcuts,
    unregisterShortcut,
    formatShortcut,
    getAllShortcuts
  }
}
