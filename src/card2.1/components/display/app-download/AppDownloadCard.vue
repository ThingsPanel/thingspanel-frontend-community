<template>
  <div class="app-download-card">
    <div class="card-title">{{ title }}</div>
    <div class="content-wrapper">
      <img :src="qrCodeUrl" alt="QR Code" class="qr-code" />
      <div class="store-links">
        <a :href="appStoreUrl" target="_blank" rel="noopener noreferrer">
          <img :src="appStoreIcon" alt="App Store" class="store-icon" />
        </a>
        <a :href="googlePlayUrl" target="_blank" rel="noopener noreferrer">
          <img :src="googlePlayIcon" alt="Google Play" class="store-icon" />
        </a>
      </div>
    </div>
    <div class="scan-text">{{ scanText }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  qrCode: string
  appStoreLink: string
  googlePlayLink: string
  scanText: string
}>()

// For simplicity, we assume icons are bundled with the component
import appStoreIcon from './placeholder-app-store.png'
import googlePlayIcon from './placeholder-google-play.png'
import qrCodeDefault from './download_app.png'

const qrCodeUrl = computed(() => props.qrCode || qrCodeDefault)
const appStoreUrl = computed(() => props.appStoreLink || '#')
const googlePlayUrl = computed(() => props.googlePlayLink || '#')
</script>

<style scoped>
.app-download-card {
  padding: 16px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  box-sizing: border-box;
  background-color: var(--n-card-color);
  border: 1px solid var(--n-border-color);
  color: var(--n-text-color-1);
}
.card-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
}
.content-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}
.qr-code {
  width: 96px;
  height: 96px;
  object-fit: contain;
}
.store-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.store-icon {
  height: 40px;
  cursor: pointer;
  object-fit: contain;
  transition: transform 0.2s ease;
}
.store-icon:hover {
  transform: scale(1.05);
}
.scan-text {
  font-size: 14px;
  color: var(--n-text-color-2);
}
</style>
