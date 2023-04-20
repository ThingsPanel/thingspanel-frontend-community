<template>
  <div style="display: flex">
    <el-input v-model="startValue" @change="handleChange"></el-input>
    <span style="width: 50px; text-align: center;">-</span>
    <el-input v-model="endValue" @change="handleChange"></el-input>
  </div>
</template>

<script>
export default {
  name: "RangeInput",
  props: {
    data: {
      type: [String],
      default: "0-999"
    }
  },
  data() {
    return {
      startValue: 0,
      endValue: 999,
      value: ""
    }
  },
  watch: {
    data: {
      handler(newValue) {
        this.startValue = newValue.split("-")[0]
        this.endValue = newValue.split("-")[1]
      },
      immediate: true
    },
  },
  methods: {
    handleChange() {
      let value = this.startValue + " - " + this.endValue;
      this.$emit("update:data", value);
    }
  }
}
</script>

<style scoped>

</style>