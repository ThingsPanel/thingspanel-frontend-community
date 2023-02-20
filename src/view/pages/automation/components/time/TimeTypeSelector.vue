<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-02 08:39:13
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-17 19:48:03
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\time\TimeTypeSelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div style="display: flex">
    <el-select style="width: 100px;margin-right:10px" v-model="formData.type" @change="handleTimeTypeChange">
      <el-option label="单次" value="once"></el-option>
      <el-option label="重复" value="repeat"></el-option>
      <el-option label="范围" value="range"></el-option>
    </el-select>

    <OnceTimeSelector v-if="formData.type=='once'" :value="formData.once.value" @change="handleOnceTimeChange"/>

    <RepeatTimeSelector v-else-if="formData.type=='repeat'" :data="formData.repeat" @change="handleRepeatTimeChange"/>

    <DateRangeSelector v-else-if="formData.type=='range'" :data="formData.repeat" @change="handleDateRangeChange"/> 
  </div>
</template>

<script>
import OnceTimeSelector from "./OnceTimeSelector";
import RepeatTimeSelector from "./RepeatTimeSelector";
import DateRangeSelector from "./DateRangeSelector";
export default {
  name: "TimeTypeSelector",
  components: { OnceTimeSelector, RepeatTimeSelector, DateRangeSelector },
  props: {
    data: {
      type: [Object],
      default: () => {
        return
      }
    }
  },
  data() {
    return {
      value: "",
      formData: {
        type: "once",
        once: {},
        repeat: {},
        range: {}
      },
      params: {
        type: "",
        once: {},
        repeat: {},
        range: ""
      }
    }
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue) {
          console.log("TimeTypeSelector.data", newValue);
          this.formData = JSON.parse(JSON.stringify(newValue));
        }
      },
      immediate: true
    }
  },
  methods: {
    handleTimeTypeChange(v) {
      this.initParams();
      this.params.type = v;
      this.updateData();
    },
    /**
     * @description: 
     * @param {*} v
     * @return {*}
     */       
    handleOnceTimeChange(v) {
      this.initParams();
      this.params.type = "once";
      this.params.once = { value: v };
      this.updateData();
    },
    /**
     * @description: 改变重复时间
     * @param {*} v
     * @return {*}
     */
    handleRepeatTimeChange(v) {
      this.initParams();
      this.params.type = "repeat";
      this.params.repeat = v;
      this.updateData();
    },
    /**
     * @description: 改变时间范围
     * @param {*} v
     * @return {*}
     */
    handleDateRangeChange(v) {
      this.initParams();
      this.params.type = "range";
      this.params.range = v;
      this.updateData();
    },
    /**
     * @description: 初始化params
     * @return {*}
     */
    initParams() {
      this.params = {
        type: "",
        once: {},
        repeat: {}
      };
    },
    /**
     * @description: 向父组件传值
     * @return {*}
     */    
    updateData() {
      console.log("TimeTypeSelector", this.params)
      this.$emit("change", this.params);
    }
    
  }
}
</script>

<style scoped>

</style>