<script>
import { ref } from 'vue';
import { icons } from './icons';

export default {
  emits: ['iconSelected'],

  setup(_props, { emit }) {
    const selectedIcon = ref(null);
    // icons is a map of { key: component }
    const iconOptions = Object.keys(icons).map(key => ({
      name: key,
      component: icons[key]
    }));

    const selectIcon = option => {
      selectedIcon.value = option.component;
      emit('iconSelected', option.name);
    };

    return {
      selectedIcon, // 实际上这个在当前组件内部未使用，但保留以防扩展
      iconOptions,
      selectIcon
    };
  }
};
</script>

<template>
  <div>
    <span style="vertical-align: middle; line-height: 30px">选中图标：</span>
    <NIcon size="30" :component="selectedIcon" style="vertical-align: middle" />
    <div class="icon-picker-dialog">
      <div class="icon-grid">
        <div v-for="(option, index) in iconOptions" :key="index" class="icon-cell" @click="selectIcon(option)">
          <NIcon size="30" :component="option.component" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.icon-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.icon-cell {
  width: calc(10% - 10px); /* 调整宽度以适应10列，减去间隔 */
  margin: 5px; /* 控制间距 */
}
</style>
