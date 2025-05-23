<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  statusActive?: boolean; // For the small status dot, optional
  subtitle?: string;
  indicator?: 'normal' | 'warning' | 'error' | 'info' | string; // For the top-right indicator icon's color/state
  footerTimestamp?: string;

  // New props for image URLs (can be SVG, PNG, etc.)
  subtitleIconUrl?: string;
  indicatorIconUrl?: string;
  footerIconUrl?: string;
}

const props = defineProps<Props>();

// --- Default SVG Icons (simple placeholders) ---
const defaultSubtitleIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
const defaultIndicatorIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
const defaultFooterIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
// ----------------------------------------------

const statusDotClass = computed(() => {
  if (props.statusActive === undefined) return ''; // No dot if prop not provided
  return props.statusActive ? 'status-active' : 'status-inactive';
});

const indicatorClass = computed(() => {
  if (!props.indicator) return ''; // No specific indicator class if prop not provided
  // Mapping general states to color classes. Customize as needed.
  switch (props.indicator) {
    case 'normal':
      return 'indicator-normal';
    case 'warning':
      return 'indicator-warning';
    case 'error':
      return 'indicator-error';
    case 'info':
      return 'indicator-info';
    default:
      // If indicator is a custom string, it could be a class name itself or unstyled
      return typeof props.indicator === 'string' ? `indicator-${props.indicator.toLowerCase()}` : ''; 
  }
});

</script>

<template>
  <div class="item-card">
    <div class="card-header-main">
      <div class="card-title-area">
        <div class="card-primary-info-row">
          <div class="card-title-text">{{ title }}</div>
          <div v-if="statusActive !== undefined" class="status-dot" :class="statusDotClass"></div>
        </div>
        <div v-if="subtitle || $slots['subtitle-icon'] || props.subtitleIconUrl !== undefined" class="card-secondary-info-row">
          <span class="subtitle-icon-container icon-container">
            <slot name="subtitle-icon">
              <img v-if="props.subtitleIconUrl" :src="props.subtitleIconUrl" alt="subtitle icon" class="image-icon" />
              <span v-else v-html="defaultSubtitleIconSvg" class="default-svg-icon"></span>
            </slot>
          </span>
          <span v-if="subtitle" class="subtitle-text">{{ subtitle }}</span>
        </div>
      </div>
      <div v-if="indicator || $slots['indicator-icon'] || props.indicatorIconUrl !== undefined" class="indicator-icon-container icon-container" :class="indicatorClass">
        <slot name="indicator-icon">
          <img v-if="props.indicatorIconUrl" :src="props.indicatorIconUrl" alt="indicator icon" class="image-icon" />
          <span v-else v-html="defaultIndicatorIconSvg" class="default-svg-icon"></span>
        </slot>
      </div>
    </div>
    
    <div v-if="footerTimestamp || $slots['footer-icon'] || props.footerIconUrl !== undefined" class="card-footer-main">
      <div class="footer-icon-container icon-container">
        <slot name="footer-icon">
          <img v-if="props.footerIconUrl" :src="props.footerIconUrl" alt="footer icon" class="image-icon" />
          <span v-else v-html="defaultFooterIconSvg" class="default-svg-icon"></span>
        </slot>
      </div>
      <div v-if="footerTimestamp" class="footer-timestamp-text">{{ footerTimestamp }}</div>
    </div>
  </div>
</template>

<style scoped>
.item-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  width: 100%;
  min-height: 180px; /* Use min-height for flexibility */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
  display: flex;
  flex-direction: column;
  position: relative;
}

.card-header-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start; 
  margin-bottom: 16px;
}

.card-title-area {
  flex: 1; 
}

.card-primary-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px; /* Only if subtitle exists or row is always present */
}

.card-title-text {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0; 
}

.status-active {
  background-color: #52c41a; /* Green for active */
}

.status-inactive {
  background-color: #d9d9d9; /* Grey for inactive */
}

.card-secondary-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #888;
}

.icon-container {
  display: inline-flex; 
  align-items: center;
  justify-content: center;
}

.subtitle-icon-container {
  font-size: 14px; 
  /* max-width to prevent overly large SVGs if not sized intrinsically */
  max-width: 16px; 
  max-height: 16px;
}

.subtitle-text {
  /* Styles for subtitle text if any */
}

/* Styling for the indicator icon container and its states */
.indicator-icon-container {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  font-size: 16px; 
  flex-shrink: 0; 
}

.image-icon, .default-svg-icon :deep(svg) {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.default-svg-icon :deep(svg) {
  display: block; /* Helps with consistent rendering of inline SVGs */
}

.indicator-normal {
  color: #52c41a; /* Green */
}
.indicator-normal :deep(svg path), .indicator-normal :deep(svg circle), .indicator-normal :deep(svg line) {
  stroke: #52c41a; /* If default SVG uses currentColor */
}

.indicator-warning {
  color: #faad14; /* Orange/Yellow for warning */
}
.indicator-warning :deep(svg path), .indicator-warning :deep(svg circle), .indicator-warning :deep(svg line) {
  stroke: #faad14;
}

.indicator-error {
  color: #ff4d4f; /* Red for error */
}
.indicator-error :deep(svg path), .indicator-error :deep(svg circle), .indicator-error :deep(svg line) {
  stroke: #ff4d4f;
}

.indicator-info {
  color: #1890ff; /* Blue for info */
}
.indicator-info :deep(svg path), .indicator-info :deep(svg circle), .indicator-info :deep(svg line) {
  stroke: #1890ff;
}

.card-footer-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto; 
  padding-top: 16px; /* Add some space if footer is present */
  border-top: 1px solid #f0f0f0; /* Optional: a light separator for the footer */
}

.card-footer-main:empty {
    display: none; /* Hide footer if completely empty */
}

.footer-icon-container {
  width: 44px; /* Or make it more flexible */
  height: 35.5px; 
  font-size: 18px; 
  color: #666; 
}

.footer-timestamp-text {
  font-size: 14px;
  color: #888;
}

/* Fallback icon styles (if using Font Awesome for fallbacks in slots) */
:deep(.subtitle-icon-container .fa-question-circle),
:deep(.indicator-icon-container .fa-bell),
:deep(.footer-icon-container .fa-info-circle) {
  /* Default styling for any fallback icons */
}

/* Example :deep styling for icons passed via slots, if parent applies these classes */
:deep(.subtitle-icon-container .direct-icon-style) {
  color: #52c41a;
}
:deep(.subtitle-icon-container .sub-icon-style) {
  color: #fa8c16;
}
:deep(.subtitle-icon-container .default-icon-color) { 
  color: #1890ff; 
}

</style>
