<!-- content.vue -->
<script lang="ts">
import { defineComponent } from 'vue';
import { useMessage } from 'naive-ui';

// content
export default defineComponent({
  setup() {
    window.NMessage = useMessage();
  }
});
</script>

<template>
  <div></div>
</template>
