<template>
  <div>
<!--    <el-form label-position="right" label-width="85px">-->
      <el-form-item label="如果：">
        <div style="display: flex;margin-bottom: 10px" v-for="(condition, index) in conditions" :key="index">

          <el-select ref="relationRef" v-if="condition.relation" style="position: absolute; width: 60px;margin-right:10px" v-model="condition.relation">
            <!-- 且 -->
            <el-option label="且" :value="'and'"></el-option>
            <!-- 或 -->
            <el-option label="或" :value="'or'"></el-option>
          </el-select>

            <el-select ref="typeRef" style="width: 100px;margin-left: 70px;margin-right:10px" v-model="condition.type">
              <!-- 设备条件-->
              <el-option label="设备条件" :value="'device'"></el-option>
              <!-- 时间条件-->
              <el-option label="时间条件" :value="'time'"></el-option>
            </el-select>

          <!-- 选择设备条件后显示项目列表 -->
          <template v-if="condition.type=='device'">
            <DeviceTypeSelector ref="deviceTypeSelectorRef" v-if="condition.type=='device'" :data="condition.data" @change="v=>handleDeviceChange(condition, v)"/>
          </template>

          <!-- 选择时间条件后显示时间条件类型 -->
          <TimeTypeSelector ref="timeTypeSelectorRef" v-else-if="condition.type=='time'" :data="condition.data" @change="v=>handleTimeChange(condition, v)"/>

            
          <!-- 新增一行 -->
          <el-button type="indigo" size="small" style="margin-left: auto;height:40px"
                     v-if="index == 0"
                     @click="handleAddCondition">新增一行</el-button>

          <!-- 删除 -->
          <el-button type="danger" size="small" style="margin-left: auto;height:40px"
                    v-if="index > 0"
                    @click="handleDeleteCondition(condition)">删除</el-button>
          

        </div>
      </el-form-item>

<!--    </el-form>-->
  </div>
</template>

<script>
import TimeTypeSelector from "../components/time/TimeTypeSelector";
import DeviceTypeSelector from "../components/device/DeviceTypeSelector.vue";
import { message_error } from '@/utils/helpers';
export default {
  name: "ConditionForm",
  components: { DeviceTypeSelector, TimeTypeSelector },
  props: {
    data: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      conditions: [],
    }
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue) {
          this.conditions = JSON.parse(JSON.stringify(newValue));
        }
      },
      immediate: true
    }
  },
  methods: {
    /**
     * @description: 新增一行
     * @return {*}
     */
    handleAddCondition() {
      this.conditions.push({ type: "device", relation: "and", data: {} });
    },
    /**
     * @description: 删除一行
     * @return {*}
     */
    handleDeleteCondition(condition) {
      let index = this.conditions.findIndex(item => item == condition);
      this.conditions.splice(index, 1);
      this.$emit("change", this.conditions);
    },
    /**
     * @description: 设备条件
     * @param {*} v
     * @return {*}
     */
    handleDeviceChange(condition, v) {
      condition.data = v;
      this.$emit("change", this.conditions)
    },
    /**
     * @description: 时间条件
     * @param {*} v
     * @return {*}
     */
    handleTimeChange(condition, v) {
      condition.data = JSON.parse(JSON.stringify(v));
      console.log("====condition.handleTimeChange", condition, v, JSON.stringify(this.conditions));
      this.$emit("change", this.conditions)

    },
    validate() {
      for (let index = 0; index < this.conditions.length; index++) {
        const item = this.conditions[index];
        if (index > 0 && (!item.relation || item.relation === "")) {
          this.$refs.relationRef[index].focus();
          message_error("请选择且或关系！")
          return false;
        }
        if (!item.type || item.type === "") {
          this.$refs.typeRef[index].focus();
          message_error("请选择条件类型！")
          return false;
        }
      };
      if (this.$refs.deviceTypeSelectorRef) {
        for (let index = 0; index < this.$refs.deviceTypeSelectorRef.length; index++) {
          const ref = this.$refs.deviceTypeSelectorRef[index];
          if (!ref.validate()) {
            return false;
          }
        }
      }
      
      if (this.$refs.timeTypeSelectorRef) {
        for (let index = 0; index < this.$refs.timeTypeSelectorRef.length; index++) {
          const ref = this.$refs.timeTypeSelectorRef[index];
          if (!ref.validate()) {
            return false;
          }
        }
      }
     
      return true;
    }
  }
}
</script>

<style scoped>

</style>