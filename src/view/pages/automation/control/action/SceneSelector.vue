<template>
  <div style="display: flex">
    激活
    <el-select style="width: 100px;margin-right:10px" v-model="value" @change="handleChange">
      <el-option :label="'场景1'" :value="'scene1'"></el-option>
    </el-select>
  </div>
</template>

<script>
export default {
  name: "SceneSelector",
  data() {
    return {
      value: ""
    }
  },
  methods: {
    handleChange(v) {
      this.$emit("change", v);
    }
  }
}
</script>

<style scoped>

</style>