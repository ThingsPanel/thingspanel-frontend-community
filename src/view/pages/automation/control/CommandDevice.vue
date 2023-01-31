<!-- 操作设备 -->
<template>
  <div>
    <div style="display: flex;margin-bottom: 10px" v-for="(command, index) in commands" :key="index">


      <!-- 选择设备条件后显示项目列表 -->
<!--      <ProjectSelector v-if="command.type=='device'"/>-->

<!--      &lt;!&ndash; 选择时间条件后显示时间条件类型 &ndash;&gt;-->
<!--      <TimeTypeSelector v-else-if="command.type=='time'"/>-->

      <!-- 新增一行 -->
      <el-button type="indigo" size="small" style="margin-left: auto"
                 v-if="index == 0"
                 @click="handleAddCommand">新增一行</el-button>

      <!-- 删除 -->
      <el-button type="danger" size="small" style="margin-left: auto"
                 v-if="index > 0"
                 @click="handleDeleteCommand(command)">删除</el-button>

    </div>
  </div>

</template>

<script>
export default {
  name: "CommandDevice",
  data() {
    return {
      commands: [
        {

        }
      ]

    }
  },
  methods: {
    handleAddCommand() {

    },
    handleDeleteCommand(command) {

    }

  }
}
</script>

<style scoped>

</style>