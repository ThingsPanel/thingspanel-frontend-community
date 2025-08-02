<template>
  <div class="widget-header" @dblclick.stop="activateEditMode">
    <n-input
      v-if="isEditing"
      ref="inputRef"
      v-model:value="editableTitle"
      size="small"
      autofocus
      @blur="saveTitle"
      @keydown.enter.prevent="saveTitle"
    />
    <span v-else class="widget-title" :title="title">{{ title }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { NInput } from 'naive-ui';

const props = defineProps<{
  title: string;
  readonly?: boolean;
}>();

const emit = defineEmits(['update:title']);

const isEditing = ref(false);
const editableTitle = ref(props.title);
const inputRef = ref<InstanceType<typeof NInput> | null>(null);

watch(() => props.title, (newTitle) => {
  editableTitle.value = newTitle;
});

const activateEditMode = () => {
  if (props.readonly) return;
  isEditing.value = true;
  nextTick(() => {
    inputRef.value?.focus();
  });
};

const saveTitle = () => {
  if (!isEditing.value) return;
  
  // Only emit if the title has actually changed
  if (editableTitle.value !== props.title) {
    emit('update:title', editableTitle.value);
  }
  isEditing.value = false;
};
</script>

<style scoped>
.widget-header {
  width: 100%;
  cursor: text;
}

.widget-title {
  display: block;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 4px 6px; /* Add some padding for better appearance */
  box-sizing: border-box;
}
</style>