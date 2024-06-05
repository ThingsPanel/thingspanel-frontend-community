<script lang="ts" setup>
import printJS from 'print-js';
import { $t } from '@/locales';

function printTable() {
  printJS({
    printable: [
      { name: 'soybean', wechat: 'honghuangdc', remark: '欢迎来技术交流' },
      { name: 'soybean', wechat: 'honghuangdc', remark: '欢迎来技术交流' }
    ],
    properties: ['name', 'wechat', 'remark'],
    type: 'json'
  });
}

function printImage() {
  printJS({
    printable: [
      'https://i.loli.net/2021/11/24/1J6REWXiHomU2kM.jpg',
      'https://i.loli.net/2021/11/24/1J6REWXiHomU2kM.jpg'
    ],
    type: 'image',
    header: 'Multiple Images',
    imageStyle: 'width:100%;'
  });
}
</script>

<template>
  <div class="h-full">
    <NCard :title="$t('generate.print')" :bordered="false" class="rounded-8px shadow-sm">
      <NButton type="primary" class="mr-10px" @click="printTable">{{ $t('generate.print-table') }}</NButton>
      <NButton type="primary" @click="printImage">{{ $t('generate.printImage') }}</NButton>
      <template #footer>
        <GithubLink label="printJS：" link="https://github.com/crabbly/Print.js" class="mt-10px" />
      </template>
    </NCard>
  </div>
</template>

<style scoped></style>
