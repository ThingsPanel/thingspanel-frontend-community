<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-06 09:39:11
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-06 17:17:57
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\control\ControlStrategy.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-06 09:39:11
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-06 11:23:10
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\control\ControlStrategy.vue
 * @Description: 
-->
<template>
  <div class="rounded card p-4 el-table-transparent el-dark-input">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{  $t('AUTOMATION.CONTROL_STRATEGY.CONTROL_STRATEGY_LIST') }}</TableTitle>
      </el-col>
      <el-col :span="12" class="text-right">
        <!--      新增-->
        <el-button size="medium" type="border" @click="handleCreate">{{  $t('AUTOMATION.CONTROL_STRATEGY.NEW_STRATEGY') }}</el-button>
        <!--      返回-->
        <el-button size="medium" type="indigo" @click="goBack">{{  $t('AUTOMATION.RETURN') }}</el-button>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-table :data="tableData" v-loading="loading">
      <el-table-column :label="$t('AUTOMATION.RULE_NAME')" prop="name"></el-table-column>
      <el-table-column :label="$t('AUTOMATION.RULE_DESCRIBE')" prop="describe"></el-table-column>

      <el-table-column :label="$t('AUTOMATION.CREATETIME')" prop="time"></el-table-column>

      <!-- 策略操作-->
      <el-table-column :label="$t('AUTOMATION.OPERATION')" width="auto" align="center">
        <template v-slot="scope">
          <div class="text-right">
            <el-button type="yellow" size="mini">{{ $t('AUTOMATION.START') }}</el-button>

            <!-- 编辑 -->
            <el-button type="yellow" size="mini" @click="handleEdit(scope.row)">{{ $t('AUTOMATION.EDIT') }}</el-button>

            <el-button type="yellow" size="mini">{{ $t('AUTOMATION.LOG') }}</el-button>

            <!-- 删除 -->
            <el-popconfirm :title="$t('AUTOMATION.TITLE4')" @confirm="handleDelete(scope.row)">
              <el-button style="margin-left:10px" slot="reference" type="danger" size="mini">{{ $t('AUTOMATION.DELETE') }}</el-button>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <!-- 表 end -->

    <div class="text-right py-3">
      <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :current-page.sync="params.page"
          :page-size="params.limit"
          @current-change="getControlStrategyIndex"></el-pagination>
    </div>

    <EditForm :visible.sync="showEditDialog" :data="editFormData" @change="handleEditFormChange"/>
  </div>
</template>

<script>
import TableTitle from "@/components/common/TableTitle";
import EditForm from "./EditForm";
import data from "./data.js"
export default {
  name: "ControlStrategy",
  components: {
    TableTitle,
    EditForm
  },
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      params: {},
      showEditDialog: false,
      editFormData: {}
    }
  },
  created() {
    this.getControlStrategyIndex();
  },
  methods: {
    goBack() {
      this.$router.back()
    },
    /**
     * @description: 新建策略
     * @return {*}
     */    
    handleCreate() {
      this.editFormData = {};
      this.showEditDialog = true;
    },
    /**
     * @description: 编辑一条策略
     * @return {*}
     */    
    handleEdit(v) {
      this.editFormData = JSON.parse(JSON.stringify(v));
      console.log("handleEdit", v)
      this.showEditDialog = true;
    },
    /**
     * @description: 编辑表单的数据被改变
     * @param {*} v
     * @return {*}
     */    
    handleEditFormChange(v) {
      console.log("====handleEditFormChange", v)
    },
    /**
     * @description: 删除一条策略
     * @return {*}
     */        
    handleDelete() {

    },
    /**
     * @description:获取策略列表
     * @return {*}
     */  
    getControlStrategyIndex() {
      this.tableData = data;
    }
  }

}
</script>

<style scoped>

</style>