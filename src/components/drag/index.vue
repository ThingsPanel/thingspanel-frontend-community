<template>
  <div :id="'draggable' + index" class="draggable" draggable="true">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: "index",
  props: {
    index: {
      type: [Number],
      default: 0
    },
    option: {
      type: [Object],
      default: () => { return {} }
    }
  },
  data() {
    return {
      point: { top: 0, left: 0 }
    }
  },
  mounted() {
    const draggable = document.getElementById("draggable" + this.index);
    draggable.addEventListener("dragstart", this.handleDragStart);
    draggable.addEventListener("mousedown", this.handleMouseDown);
  },
  methods: {
    /**
     * 拖拽开始时触发
     * @param e
     */
    handleDragStart(e) {
      // DataTransfer对象专门用来存储拖放时要携带的数据
      this.option.relativePoint = this.point;
      e.dataTransfer.setData("option", JSON.stringify(this.option));
    },
    handleMouseDown(e) {
      this.point.left = e.offsetX;
      this.point.top = e.offsetY;
    }

  }
}
</script>

<style scoped>
.draggable {
  width: 100%;
  height: 100%;
}
</style>