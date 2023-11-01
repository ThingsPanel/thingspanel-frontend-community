<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-06 09:04:58
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-10 15:57:30
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\control\action\SceneSelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="scene-device-box" >
    <div style="display: flex;margin-bottom: 8px" v-for="(item, index) in sceneList" :key="index">
      <!-- {{ $t('AUTOMATION.ACTIVATE') }}<span style="color:red;margin-left:6px">*</span> -->
      <el-select :no-data-text="$t('COMMON.SELECT_NO_DATA')" ref="sceneIdRef" style="width: 300px;margin-left: 10px;margin-right:10px" 
        v-model="item.id" @change="handleChange">
        <el-option v-for="(option, index) in options" :key="index" :label="option.automation_name" :value="option.id"></el-option>
      </el-select>
      <el-select style="width: 100px;margin-right:10px" v-model="item.switch" @change="handleChange">
        <el-option value="0" label="停用"></el-option>
        <el-option value="1" label="启用"></el-option>
      </el-select>
      <el-button v-if="index === 0" type="border" size="mini" @click="handleAddScene">新增一行</el-button>
      <el-button v-if="index > 0" style="height:40px" type="danger" size="small" 
        @click="handleDeleteScene(index)">{{ $t('AUTOMATION.DELETE') }}</el-button>  
    </div>
  </div>
  
</template>

<script>
import Auto  from "@/api/automation_1.0"
import { message_error } from '@/utils/helpers';

export default {
  name: "SceneSelector",
  props: {
    data: {
      type: [Array],
      default: () => ([{ id: "", switch: "0" }])
    }
  },
  data() {
    return {
      sceneId: "",
      options: [],
      sceneList: []
    }
  },
  async created() {
    this.getSceneList();
    await this.$nextTick();
    this.sceneList = JSON.parse(JSON.stringify(this.data));
    this.handleChange();
  },
  methods: {
    getSceneList() {
      Auto.Control.list({ current_page: 1, per_page: 9999 })
        .then(({data}) => {
          if (data.code === 200) {
            this.options = data.data?.data || [];
            this.sceneId = this.value;
          }
        })
    },
    handleChange() {
      const data = this.sceneList.map(item => ({ id: item.id, switch: item.switch }))
      this.$emit("change", data);
    },
    handleAddScene() {
      this.sceneList.push({ id: "", switch: "0" })
    },
    handleDeleteScene(index) {
      this.sceneList.splice(index, 1);
      const data = this.sceneList.map(item => ({ id: item.id }))
      this.$emit("change", data);
    },
    validate() {
      try {
        for (let i = 0; i < this.sceneList.length; i++) {
          const ele = this.sceneList[i];
          if (!ele.id) {
            throw new Error("场景不能为空");
          }
        }
        return true;
      } catch(err) {
        message_error(err.message);
        return false;
      }
     
    }
  }
}
</script>

<style scoped>
.scene-device-box {
  padding: 10px;
  border: 1px solid #4d96e0;
  border-radius: 6px;
}
</style>