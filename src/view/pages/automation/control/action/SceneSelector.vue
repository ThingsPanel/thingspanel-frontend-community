<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-06 09:04:58
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-02 14:38:44
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\control\action\SceneSelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div style="display: flex;">
    激活<span style="color:red;margin-left:6px">*</span>
    <el-select ref="sceneIdRef" style="width: 300px;margin-left: 10px;margin-right:10px" v-model="sceneId" @change="handleChange">
      <el-option v-for="(option, index) in options" :key="index" :label="option.scenario_name" :value="option.id"></el-option>
    </el-select>
  </div>
</template>

<script>
import Auto  from "@/api/automation_1.0"
import { message_error } from '../../../../../utils/helpers';

export default {
  name: "SceneSelector",
  props: {
    value: {
      type: [String],
      default: ""
    }
  },
  data() {
    return {
      sceneId: "",
      options: []
    }
  },
  created() {
    this.getSceneList();
  },
  methods: {
    getSceneList() {
      Auto.Scene.list({ current_page: 1, per_page: 9999 })
        .then(({data}) => {
          if (data.code === 200) {
            this.options = data.data?.data || [];
            this.sceneId = this.value;
          }
        })
    },
    handleChange(v) {
      this.$emit("change", v);
    },
    validate() {
      if (!this.sceneId || this.sceneId === "") {
        this.$refs.sceneIdRef.focus();
        message_error("请选择场景！");
        return false;
      }
      return true;
    }
  }
}
</script>

<style scoped>

</style>