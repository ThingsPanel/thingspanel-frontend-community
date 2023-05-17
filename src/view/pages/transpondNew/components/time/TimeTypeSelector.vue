<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-02 08:39:13
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-10 12:42:56
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\components\time\TimeTypeSelector.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div style="display: flex">
    <el-select ref="typeRef" style="width: 100px;margin-right:10px" v-model="formData.type" @change="handleTimeTypeChange">
      <el-option :label="$t('AUTOMATION.ONCE')" value="once"></el-option>
      <el-option :label="$t('AUTOMATION.REPEAT')" value="repeat"></el-option>
      <el-option :label="$t('AUTOMATION.RANGE')" value="range"></el-option>
    </el-select>

    <OnceTimeSelector ref="onceRef" v-if="formData.type=='once'" :data="formData.once" @change="handleOnceTimeChange"/>

    <RepeatTimeSelector ref="repeatRef" v-else-if="formData.type=='repeat'" :data="formData.repeat" @change="handleRepeatTimeChange"/>

    <DateRangeSelector ref="rangeRef" v-else-if="formData.type=='range'" :value.sync="formData.range" @change="handleDateRangeChange"/> 
  </div>
</template>

<script>
import OnceTimeSelector from "./OnceTimeSelector";
import RepeatTimeSelector from "./RepeatTimeSelector";
import DateRangeSelector from "./DateRangeSelector";
import { message_error } from '@/utils/helpers';
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
    },
    validate() {
      if (!this.formData.type || this.formData.type === "") {
        this.$refs.typeRef.focus();
        // 请选择时间条件类型！
        message_error(this.$t('AUTOMATION.ERROR.TIME_TYPE'));
        return false;
      }
      return (this.$refs.onceRef && this.$refs.onceRef.validate()) ||
             (this.$refs.rangeRef && this.$refs.rangeRef.validate()) ||
             (this.$refs.repeatRef && this.$refs.repeatRef.validate());
    }
    
  }
}
</script>

<style scoped>

</style>