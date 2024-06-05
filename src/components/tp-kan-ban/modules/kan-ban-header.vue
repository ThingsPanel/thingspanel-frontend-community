<script setup lang="ts">
import { router } from '@/router';
import { $t } from '@/locales';

defineOptions({ name: 'KanBanHeader' });
const active = defineModel<boolean>('active', { required: true, default: false });
const responsive = defineModel<boolean>('responsive', { required: true, default: false });

defineProps<{ saveKanBan: () => Promise<void>; isFullscreen: boolean; toggle: () => Promise<void>; tittle: string }>();
</script>

<template>
  <div class="grid grid-cols-3 h-60px pl-20px">
    <div class="flex flex-1 items-center justify-start">
      <n-space>
        <NButton @click="router.go(-1)">
          <SvgIcon icon="ep:back" class="mr-0.5 text-lg" />
          {{ $t('page.login.common.back') }}
        </NButton>
        <NButton @mouseover="active = true">+{{ $t('kanban.add-cards') }}</NButton>
      </n-space>
    </div>
    <div class="flex flex-1 items-center justify-center">
      <n-space>
        <n-h3>{{ tittle }}</n-h3>
      </n-space>
    </div>
    <div class="flex items-center justify-end">
      <n-space align="center">
        <n-checkbox v-model:checked="responsive">响应式</n-checkbox>
        <NButton @click="saveKanBan">{{ $t('common.save') }}</NButton>
        <FullScreen
          :full="isFullscreen"
          @click="
            () => {
              toggle();
            }
          "
        />
      </n-space>
    </div>
  </div>
</template>

<style scoped></style>
