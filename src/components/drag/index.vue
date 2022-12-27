<template>
  <div :id="'draggable' + index" class="draggable" :draggable="draggable" @click="handleClick">
    <slot></slot>
  </div>
</template>

<script>
export default {
  name: "index",
  props: {
    index: {
      type: [Number, String],
      default: 0
    },
    option: {
      type: [Object],
      default: () => { return {} }
    },
    type: {
      type: [String],
      default: "chart"
    },
    draggable: {
      type: [Boolean],
      default: true
    }
  },
  data() {
    return {
      point: { top: 0, left: 0 }
    }
  },
  mounted() {
    if (this.draggable) {
      const draggable = document.getElementById("draggable" + this.index);
      draggable.addEventListener("dragstart", this.handleDragStart);
      draggable.addEventListener("mousedown", this.handleMouseDown);
    }
  },
  methods: {
    handleClick() {
      // 如果创建方式是绘制
      if (!this.draggable) {
        this.$emit("click", this.option, "draggable" + this.index);
      }
    },
    /**
     * 拖拽开始时触发
     * @param e
     */
    handleDragStart(e) {
      // DataTransfer对象专门用来存储拖放时要携带的数据
      this.option.relativePoint = this.point;
      this.option.type = this.type;
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