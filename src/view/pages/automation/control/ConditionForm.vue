<template>
  <div>
<!--    <el-form label-position="right" label-width="85px">-->

      <!-- ========================================================================================================== -->
      <!-- 条件 -->
      <!-- ========================================================================================================== -->
      <el-form-item label="如果：">
        <div style="display: flex;margin-bottom: 10px" v-for="(condition, index) in formData.conditions" :key="index">

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
          <ProjectSelector v-if="condition.type=='device'"/>

          <!-- 选择时间条件后显示时间条件类型 -->
          <TimeTypeSelector v-else-if="condition.type=='time'"/>

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
import ProjectSelector from "./selector/device/ProjectSelector";
import TimeTypeSelector from "./selector/time/TimeTypeSelector";
export default {
  name: "ConditionForm",
  components: { ProjectSelector, TimeTypeSelector },
  data() {
    return {
      formData: {
        conditions: [
          {
            type: "device"
          }
        ],
        action: [
          {

          }
        ]
      }
    }
  },
  methods: {
    handleAddCondition() {
      this.formData.conditions.push({ type: "device", relation: "and" });
    },
    handleDeleteCondition(condition) {
      let index = this.formData.conditions.findIndex(item => item == condition);
      this.formData.conditions.splice(index, 1);
    }
  }
}
</script>

<style scoped>

</style>