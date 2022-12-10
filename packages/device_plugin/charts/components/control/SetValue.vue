<template>
  <div class="value-container">
    <el-input-number v-model="inputValue" controls-position="right"
                     :min="0"
    ></el-input-number>
    <el-button type="primary" @click="handleSubmit">确定</el-button>

    <el-dialog>

    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "SetValue",
  props: {
    value: {
      type: [String, Number],
      default: 0
    },
    mode: {
      type: [String],
      default: ""
    }
  },
  data() {
    return {
      inputValue: 0
    }
  },
  watch: {
    value: {
      handler(newValue) {
        this.newValue = parseInt(newValue);
      },
      immediate: true
    }
  },
  methods: {
    handleSubmit() {
      this.$emit("submit", this.inputValue);
    }
  }
}
</script>

<style scoped>
.value-container {
  position: relative;
  width: 100%;
}
.el-input-number {
  margin-right: 10px;
}
</style>