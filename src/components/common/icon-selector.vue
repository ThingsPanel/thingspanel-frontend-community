<script setup>
import { defineEmits, defineProps, onMounted, ref } from 'vue';
import { NButton, NIcon } from 'naive-ui';
import { CaretDownOutline, CaretUpOutline } from '@vicons/ionicons5';
import { $t } from '@/locales';
import { icons } from './icons';

const emit = defineEmits(['iconSelected']);
const props = defineProps({
  // optional default icon name
  defaultIcon: {
    type: String,
    default: null
  }
});

const selectedIcon = ref(null);
const isExpanded = ref(false);

const iconOptions = Object.keys(icons).map(key => ({
  name: key,
  component: icons[key]
}));

const selectIcon = option => {
  selectedIcon.value = option.component;
  emit('iconSelected', option.name);
};

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

// Set the default icon if provided
onMounted(() => {
  if (props.defaultIcon && icons[props.defaultIcon]) {
    const defaultOption = iconOptions.find(option => option.name === props.defaultIcon);
    if (defaultOption) {
      selectIcon(defaultOption);
    }
  }
});
</script>

<template>
  <div>
    <div class="icon-display">
      <span>{{ $t('card.selectedIcon') }}：</span>
      <NIcon v-if="selectedIcon" size="30" :component="selectedIcon" />
      <span v-else>{{ $t('card.notSelected') }}</span>
      <NButton class="icon-picker-btn" @click="toggleExpand">
        {{ isExpanded ? $t('card.collapse') : $t('card.expand') }}
        <template #icon>
          <NIcon>
            <component :is="isExpanded ? CaretUpOutline : CaretDownOutline" />
          </NIcon>
        </template>
      </NButton>
    </div>
    <div v-if="isExpanded" class="icon-picker-dialog">
      <div class="icon-grid">
        <div v-for="(option, index) in iconOptions" :key="index" class="icon-cell" @click="selectIcon(option)">
          <NIcon size="30" :component="option.component" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-display {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.icon-display span {
  margin-right: 10px;
}

.icon-picker-dialog {
  margin-top: 10px;
}

.icon-picker-btn {
  margin-left: 10px;
}

.icon-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.icon-cell {
  width: calc(10% - 10px);
  margin: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.icon-cell:hover {
  background-color: #f0f0f0;
  border-radius: 4px;
}
</style>
