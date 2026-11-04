<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
defineProps({ title: String, choice: Boolean })
const emit = defineEmits(['close'])
const dialog = ref(null)
let previous
let blocked = []
function keyboard(event) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
  }
  if (event.key !== 'Tab') return
  const elements = [
    ...dialog.value.querySelectorAll(
      'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]'
    )
  ].filter(el => el.getClientRects().length)
  const first = elements[0],
    last = elements.at(-1)
  if (document.activeElement === dialog.value) {
    event.preventDefault()
    ;(event.shiftKey ? last : first)?.focus()
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
onMounted(async () => {
  previous = document.activeElement
  await nextTick()
  const overlay = dialog.value?.closest('.mp-overlay')
  blocked = [...document.querySelectorAll('#mp-device,.mp-overlay')]
    .filter(el => el !== overlay)
    .map(el => ({ el, inert: el.inert }))
  blocked.forEach(({ el }) => {
    el.inert = true
  })
  dialog.value?.focus()
})
onBeforeUnmount(() => {
  blocked.forEach(({ el, inert }) => {
    el.inert = inert
  })
  if (previous?.isConnected) previous.focus()
})
</script>
<template>
  <Teleport to="body">
    <div class="mp-overlay" :class="{ 'mp-choice-overlay': choice }" @click.self="emit('close')">
      <section
        ref="dialog"
        class="mp-sheet"
        :class="{ 'mp-choice': choice }"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        tabindex="-1"
        @keydown="keyboard"
      >
        <slot name="heading">
          <header class="mp-sheet-heading">
            <h2>{{ title }}</h2>
            <button @click="emit('close')">关闭</button>
          </header>
        </slot>
        <div :class="choice ? 'mp-choice-list' : 'mp-sheet-body'"><slot /></div>
      </section>
    </div>
  </Teleport>
</template>
