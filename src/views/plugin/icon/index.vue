<script lang="ts" setup>
import { ref } from 'vue'
import { $t } from '@/locales'
import CustomIconSelect from '@/components/custom/select-icon.vue'
import { icons } from './icons'

const selectValue = ref('')

const localIcons = ['custom-icon', 'activity', 'at-sign', 'cast', 'chrome', 'copy', 'wind']
</script>

<template>
  <div class="h-full">
    <NCard :title="$t('generate.icon-example')" :bordered="false" class="rounded-8px shadow-sm">
      <div class="grid grid-cols-10">
        <template v-for="item in icons" :key="item">
          <div class="mt-5px flex-x-center">
            <SvgIcon :icon="item" class="text-30px" />
          </div>
        </template>
      </div>
      <div class="mt-50px">
        <h1 class="mb-20px text-18px font-500">{{ $t('generate.icon-selector') }}</h1>
        <CustomIconSelect v-model:value="selectValue" :icons="icons" />
      </div>
      <WebSiteLink :label="'iconify' + '地址' + '：'" link="https://icones.js.org/" class="mt-10px" />
    </NCard>
    <NCard :title="$t('generate.custom-icon-example')" :bordered="false" class="mt-10px rounded-8px shadow-sm">
      <div class="pb-12px text-16px">
        src/assets/svg-icon中的SVG文件会根据文件名和本地图标前缀生成对应组件，
        前缀由.env文件里的 VITE_ICON_LOCAL_PREFIX 配置
      </div>
      <div class="grid grid-cols-10">
        <div class="mt-5px flex-x-center">
          <IconLocalActivity class="text-40px text-success" />
        </div>
        <div class="mt-5px flex-x-center">
          <IconLocalCast class="text-20px text-error" />
        </div>
      </div>
      <div class="py-12px text-16px">{{ $t('generate.svgIconCustomization') }}</div>
      <div class="grid grid-cols-10">
        <div v-for="(fileName, index) in localIcons" :key="index" class="mt-5px flex-x-center">
          <SvgIcon :local-icon="fileName" class="text-30px text-primary" />
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
