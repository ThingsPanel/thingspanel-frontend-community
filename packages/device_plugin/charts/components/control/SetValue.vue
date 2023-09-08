<template>
  <div class="value-container">
    <div class="center">
      <el-input-number v-model="inputValue" controls-position="right" :min="0"></el-input-number>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </div>
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
      this.$emit("change", this.inputValue);
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
  margin-bottom: 16px;
}
.value-container {
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
    width: 100%;
    p {
      margin: 10px;
    }

  }
}
</style>