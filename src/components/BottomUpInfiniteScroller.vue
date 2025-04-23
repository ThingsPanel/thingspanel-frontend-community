<template>
  <div 
    ref="scrollerRef"
    class="infinite-scroller-outer" 
    @wheel="handleWheel" 
    :style="{ height: height }"
  >
    <!-- Simple content wrapper -->
    <div class="infinite-scroller-content"> 
      <!-- Directly iterate over the list prop -->
      <div v-for="(item, index) in list" :key="index" class="infinite-scroller-item">
        <slot :item="item" :index="index">
          <!-- Fallback content -->
          <span>{{ item }}</span>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'; // Keep only necessary imports

// --- Simplified Props --- 
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

// --- Simplified Refs --- 
const scrollerRef = ref<HTMLElement | null>(null);

// --- Handle Wheel Event to Prevent Scroll Chaining --- 
// (Keep the handleWheel function as it was correctly implemented)
const handleWheel = (event: WheelEvent) => {
  const element = scrollerRef.value;
  if (!element) return;
  const { scrollTop, scrollHeight, clientHeight } = element;
  const deltaY = event.deltaY;
  // Prevent scroll up when at top
  if (scrollTop === 0 && deltaY < 0) {
    event.preventDefault();
    return;
  }
  // Prevent scroll down when at bottom (with tolerance)
  if (scrollHeight - scrollTop <= clientHeight + 1 && deltaY > 0) { 
    event.preventDefault();
    return;
  }
};

// --- Removed Lifecycle Hooks & Watchers --- 

</script>

<style scoped>
.infinite-scroller-outer {
  overflow-y: auto; /* Always show scrollbar on overflow */
  overflow-x: hidden; /* Hide horizontal scrollbar */
  position: relative;
  /* Scrollbar styling */
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: rgba(150, 150, 150, 0.5) transparent; /* Firefox */
}

.infinite-scroller-outer::-webkit-scrollbar {
  width: 6px;
}

.infinite-scroller-outer::-webkit-scrollbar-track {
  background: transparent;
}

.infinite-scroller-outer::-webkit-scrollbar-thumb {
  background-color: rgba(150, 150, 150, 0.5);
  border-radius: 3px;
  border: none; 
}

/* Optional: Add padding or margin to items if needed */
/* .infinite-scroller-item {
  padding-bottom: 4px;
} */
</style> 