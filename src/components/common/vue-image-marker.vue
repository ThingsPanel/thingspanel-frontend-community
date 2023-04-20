<template>
  <div class="image-marker">
    <img
      :src="src"
      :style="posStyle"
      class="image"
      @load="onImageLoad"
    >
    <div
      :style="posStyle"
      class="mark-container"
    >
      <slot/>
    </div>
  </div>
</template>

<script>
import _debounce from 'lodash.debounce'

const LAYOUT_REFRESH_DELAY = 100

export default {
  name:'vueImageMarker',
  props: {
    src: { type: String, required: true },
    padding: { type: Number, default: 0 },
  },
  data () {
    return {
      containerWidth: 1,
      containerHeight: 1,
      imageWidth: 1,
      imageHeight: 1,
      top: 0,
      left: 0,
      width: 1,
      height: 1,
    }
  },
  computed: {
    posStyle () {
      return {
        left: this.left + 'px',
        top: this.top + 'px',
        width: this.width + 'px',
        height: this.height + 'px',
      }
    },
  },
  watch: {
    padding: 'refreshPos',
  },
  mounted () {
    this.refreshPos()
    window.addEventListener('resize', this.refreshPos)
  },
  destroyed () {
    window.removeEventListener('resize', this.refreshPos)
  },
  methods: {
    onImageLoad (ev) {
      this.imageWidth = ev.currentTarget.naturalWidth
      this.imageHeight = ev.currentTarget.naturalHeight
      this.refreshPos()
    },
    // recalc left, top, width, height
    // Need a delay to wait the dom refreshing
    refreshPos: _debounce(function () {
      this.containerWidth = this.$el.clientWidth
      this.containerHeight = this.$el.clientHeight
      let clientWidth = this.containerWidth - this.padding * 2
      let clientHeight = this.containerHeight - this.padding * 2
      let clientRatio = clientWidth / clientHeight
      let imageRatio = this.imageWidth / this.imageHeight
      if (imageRatio > clientRatio) {
        // top & bottom padding
        this.width = clientWidth
        this.left = this.padding
        this.height = this.width / imageRatio
        this.top = this.padding + (clientHeight - this.height) / 2
      } else {
        // left & right padding
        this.height = clientHeight
        this.top = this.padding
        this.width = this.height * imageRatio
        this.left = this.padding + (clientWidth - this.width) / 2
      }
    }, LAYOUT_REFRESH_DELAY),
  },
}
</script>

<style lang="css" scoped>
.image-marker {
  position: relative;
  min-width: 200px;
  min-height: 200px;
}
.image {
  position: absolute;
}
.mark-container {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
