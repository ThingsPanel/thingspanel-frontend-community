<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-15 08:53:42
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-21 20:11:19
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\product\firmware\task\index.vue
 * @Description: 
-->
<template>
    <div>
        <el-tabs v-model="activeName">
            <el-tab-pane label="任务列表" name="task">
                <task-list :data="{otaId, productId}"></task-list>
            </el-tab-pane>
            <el-tab-pane label="升级包信息" name="information">
                <package-information  :id="otaId"></package-information>
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
            activeName: "task",
            otaId: "",
            productId: ""
        }
    },
    mounted() {
        this.otaId = this.$route.query.otaId;
        this.productId = this.$route.query.productId;
    },
    methods: {
        
    }
}
</script>
<style scoped>

::v-deep .el-tabs__nav-wrap::after {
    height: 1px;
    background-color: #6595f3!important;
}
</style>