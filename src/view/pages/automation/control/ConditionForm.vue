<template>
  <div>
<!--    <el-form label-position="right" label-width="85px">-->
      <el-form-item label="如果：">
        <div style="display: flex;margin-bottom: 10px" v-for="(condition, index) in conditions" :key="index">

          <el-select v-if="condition.relation" style="position: absolute; width: 60px;margin-right:10px" v-model="condition.relation">
            <!-- 且 -->
            <el-option label="且" :value="'and'"></el-option>
            <!-- 或 -->
            <el-option label="或" :value="'or'"></el-option>
          </el-select>

            <el-select style="width: 100px;margin-left: 70px;margin-right:10px" v-model="condition.type">
              <!-- 设备条件-->
              <el-option label="设备条件" :value="'device'"></el-option>
              <!-- 时间条件-->
              <el-option label="时间条件" :value="'time'"></el-option>
            </el-select>

          <!-- 选择设备条件后显示项目列表 -->
          <template v-if="condition.type=='device'">
            <DeviceTypeSelector v-if="condition.type=='device'" :data="condition.data" @change="v=>handleDeviceChange(condition, v)"/>
          </template>

          <!-- 选择时间条件后显示时间条件类型 -->
          <TimeTypeSelector v-else-if="condition.type=='time'" :data.sync="condition.data" @change="v=>handleTimeChange(condition, v)"/>

          <!-- 新增一行 -->
          <el-button type="indigo" size="small" style="margin-left: auto"
                     v-if="index == 0"
                     @click="handleAddCondition">新增一行</el-button>

          <!-- 删除 -->
          <el-button type="danger" size="small" style="margin-left: auto"
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
        console.log("====condition", newValue);
        if (newValue) {
          this.conditions = JSON.parse(JSON.stringify(newValue));
          console.log("====condition.conditions", this.conditions);

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
      this.conditions.push({ type: "device", relation: "and" });
    },
    /**
     * @description: 删除一行
     * @return {*}
     */
    handleDeleteCondition(condition) {
      let index = this.conditions.findIndex(item => item == condition);
      this.conditions.splice(index, 1);
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
    handleTimeChange(v) {
      console.log("====condition.handleTimeChange", JSON.stringify(this.conditions));
      this.$emit("change", this.conditions)

    }
  }
}
</script>

<style scoped>

</style>