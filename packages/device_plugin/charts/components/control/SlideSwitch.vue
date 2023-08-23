<!-- 滑动开关（0, 1, 2 ... n） -->
<template>
  <div class="slide-container">
    <div class="center">
      <span style="font-size: 30px;color:#fff">{{ value }}</span>
      <el-slider style="width: 100%"
                 v-model="sliderValue" :max="sliderMax" :step="sliderStep"
                 @change="handleChange"
      ></el-slider>
    </div>
    
  </div>
</template>

<script>
export default {
  name: "SlideSwitch",
  props: {
    value: {
      type: [Number, String],
      default: 0
    },
    max: {
      type: [Number, String],
      default: 100
    },
    step: {
      type: [Number, String],
      default: 1
    }
  },
  data() {
    return {
      sliderValue: 0,
      sliderMax: 100,
      sliderStep: 1
    }
  },
  watch: {
    value: {
      handler(newValue) {
        this.sliderValue = Number(newValue);
      }
    }
  },
  mounted() {
    this.sliderValue = Number(this.value);
    this.sliderMax = Number(this.max);
    this.sliderStep = Number(this.step);
  },
  methods: {
    handleChange(v) {
      this.$emit("update:value", v)
      this.$emit("change", v)
    }
  }
}
</script>

<style scoped>

.slide-container {
  width: 100%;
  height: 100%;
  display: table;
  position: absolute;
  top: 0px;
  .center {
    display: table-cell;
    vertical-align: middle;
    text-align: center;
    padding: 20px!important;
   
    p {
      margin: 10px;
    }

  }
}
</style>