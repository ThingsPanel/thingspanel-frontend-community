<template>
  <!-- Replace root div with NScrollbar -->
  <n-scrollbar 
    ref="scrollbarInstRef" 
    :scrollbar-ref="scrollbarRootRef"
    :style="{ height: height }"
    @wheel.capture="handleWheel"
    class="bottom-up-scroller" 
    content-style="padding: 0;" 
  >
    <!-- Use n-el instead of div for the content wrapper -->
    <n-el tag="div" class="infinite-scroller-content" ref="scrollbarContentRef">
      <!-- Use n-el for each item wrapper -->
      <n-el tag="div" v-for="(item, index) in list" :key="index" class="infinite-scroller-item">
        <slot :item="item" :index="index">
          <span>{{ item }}</span>
        </slot>
      </n-el>
    </n-el>
  </n-scrollbar>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// Import NEl along with NScrollbar
import { NScrollbar, ScrollbarInst, NEl } from 'naive-ui'; 

// --- Props remain the same ---
const props = defineProps({
  list: {
    type: Array as () => any[],
    required: true
  },
  height: {
    type: String,
    default: '200px'
  }
});

// --- Update Ref for NScrollbar instance ---
const scrollbarInstRef = ref<ScrollbarInst | null>(null);
// Template ref for the scrollable DOM element
const scrollbarRootRef = ref<HTMLElement | null>(null); 
// Ref for the content inside (might be needed to get correct scrollHeight)
const scrollbarContentRef = ref<HTMLElement | null>(null);

// --- Handle Wheel Event to Prevent Scroll Chaining --- 
const handleWheel = (event: WheelEvent) => {
  // Use the template ref to get the scrollable DOM element
  const scrollContainer = scrollbarRootRef.value;
  const contentElement = scrollbarContentRef.value; // Get content element
  
  if (!scrollContainer || !contentElement) return;

  // Get scroll properties from the container
  const { scrollTop, clientHeight } = scrollContainer;
  // Get scrollHeight from the content element
  const scrollHeight = contentElement.scrollHeight; 
  
  const deltaY = event.deltaY;

  // Prevent scroll up when at top
  if (scrollTop <= 0 && deltaY < 0) { 
    event.preventDefault();
    return;
  }
  // Prevent scroll down when at bottom (with tolerance)
  // Compare container's scrollTop + clientHeight with content's scrollHeight
  if (Math.ceil(scrollTop + clientHeight) >= scrollHeight - 1 && deltaY > 0) { 
    event.preventDefault();
    return;
  }
};

// --- Removed Lifecycle Hooks & Watchers --- 

</script>

<style scoped>
/* Remove custom scrollbar styles as NScrollbar handles it */
.bottom-up-scroller {
  /* Add any specific styles for the NScrollbar component itself if needed */
   position: relative; /* Ensure position is relative if needed */
}

/* Optional: Add padding or margin to items if needed */

</style> 