<template>
  <div>
    <el-row style="margin: 20px 0 10px 0">
      <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">名称:</el-col>
      <el-col :span="18"><el-input size="mini" v-model="_name"></el-input></el-col>
    </el-row>

    <el-row>
      <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">层级:</el-col>
      <el-col :span="18"><el-input-number size="mini" v-model="zIndex"></el-input-number></el-col>
    </el-row>

    <el-row>
      <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">宽度:</el-col>
      <el-col :span="18"><el-input-number size="mini" v-model="intWidth"></el-input-number></el-col>
    </el-row>
    <el-row>
      <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">高度:</el-col>
      <el-col :span="18"><el-input-number size="mini" v-model="intHeight"></el-input-number></el-col>
    </el-row>
  </div>

</template>

<script>
export default {
  name: "BaseConfig",
  props: {
    form: {
      type: [Object],
      default: () => { return {}; }
    },
    name: {
      type: [String],
      default: ""
    },
    z: {
      type: [Number],
      default: 0
    },
    w: {
      type: [Number],
      default: 0
    },
    h: {
      type: [Number],
      default: 0
    }
  },
  computed: {
    _name: {
      get(){ return this.name; },
      set(val) { this.$emit("update:name", val); }
    },
    zIndex: {
      get(){ return this.z; },
      set(val) { this.$emit("update:z", val); }
    },
    intWidth: {
      get(){ return this.w; },
      set(val) { this.$emit("update:w", val); }
    },
    intHeight: {
      get(){ return this.h; },
      set(val) { this.$emit("update:h", val); }
    }
  }
}
</script>

<style scoped>
.el-row {
  margin-bottom: 10px
}
.el-input-number {
  width: 100%;
}
::v-deep input.el-input__inner{
  text-align: center!important;
}
</style>