<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-15 08:53:42
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-15 09:32:05
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\firmware\task\index.vue
 * @Description: 
-->
<template>
    <div>
        <el-tabs v-model="activeName">
            <el-tab-pane label="任务列表" name="task">
                <task-list></task-list>
            </el-tab-pane>
            <el-tab-pane label="升级包信息" name="information">
                <package-information></package-information>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script>
import TaskList from "./TaskList.vue"
import PackageInformation from "./PackageInformation.vue";
export default {
    name: "OTATask",
    components: { TaskList, PackageInformation },
    data() {
        return {
            activeName: "task"
        }
    }
}
</script>
<style scoped>

::v-deep .el-tabs__nav-wrap::after {
    height: 1px;
    background-color: #6595f3!important;
}
</style>