<!-- 开关(0, 1) -->
<template>
  <div class="switch-container">
    <div class="center">
      <el-switch v-model="switchValue" active-color="#13ce66" inactive-color="#ff4949" :width="60" :disabled="disabled"
        @change="switchChange"></el-switch>
      <span class="switch-state-box">{{ value ? "开启" : "关闭" }}</span>
    </div>

  </div>
</template>

<script>
export default {
  name: "CommonSwitch",
  props: {
    value: {
      type: [Boolean],
      default: false
    },
    disabled: {
      type: [Boolean],
      default: false
    }
  },
  data() {
    return {
      switchValue: false,
      dialogVisible: false,
    }
  },
  watch: {
    value: {
      handler(newValue) {
        this.switchValue = newValue;
      },
      immediate: true
    }
  },
  mounted() {
  },
  methods: {
    switchChange(value) {
      this.$emit("change", value)
    }
  }
}
</script>

<style scoped lang="scss">
.switch-container {
  height: 60px;
  line-height: 60px;
}

.switch-state-box {
  margin-left: 10px;
  color: #fff;
}

::v-deep .el-switch {
  .el-switch__core {
    border-color: #b9b9b9 !important;
    background-color: #b9b9b9 !important;
  }
}

::v-deep .is-checked {
  .el-switch__core {
    background-color: rgb(19, 206, 102) !important;
  }
}

.switch-container {
  width: 100%;
  height: 100%;
  display: table;
  position: absolute;
  top: 0px;

  .center {
    display: table-cell;
    vertical-align: middle;
    text-align: center;
    padding: 20px !important;

    p {
      margin: 10px;
    }

  }
}
</style>