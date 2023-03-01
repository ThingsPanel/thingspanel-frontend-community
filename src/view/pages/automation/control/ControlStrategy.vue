<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-06 09:39:11
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-01 15:36:39
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\control\ControlStrategy.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <div class="rounded card p-4 el-table-transparent el-dark-input">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>场景联动列表</TableTitle>
      </el-col>
      <el-col :span="12" class="text-right">
        <!--      新增-->
        <el-button size="medium" type="border" @click="handleCreate">新增规则</el-button>
        <!--      返回-->
        <el-button size="medium" type="indigo" @click="goBack">{{  $t('AUTOMATION.RETURN') }}</el-button>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-table :data="tableData" v-loading="loading">
    <el-table-column label="序号" type="index" width="100" align="center"></el-table-column>

      <el-table-column :label="$t('AUTOMATION.RULE_NAME')" prop="automation_name"></el-table-column>
      <el-table-column :label="$t('AUTOMATION.RULE_DESCRIBE')" prop="automation_described"></el-table-column>

      <el-table-column :label="$t('AUTOMATION.CREATETIME')" prop="created_at">
        <template v-slot="scope">
          {{ scope.row.created_at ? formatDate(scope.row.created_at) : "" }}
        </template>
      </el-table-column>

      <!-- 策略操作-->
      <el-table-column :label="$t('AUTOMATION.OPERATION')" width="280" align="center">
        <template v-slot="scope">
          <div class="text-right">
            <el-button type="success" size="mini" v-if="scope.row.enabled === '0'" @click="handleSetStatus(scope.row)">{{ $t('AUTOMATION.START') }}</el-button>
            
            <el-button type="warning" size="mini" v-if="scope.row.enabled === '1'" @click="handleSetStatus(scope.row)">停用</el-button>

            <!-- 编辑 -->
            <el-button type="primary" size="mini" @click="handleEdit(scope.row)">{{ $t('AUTOMATION.EDIT') }}</el-button>
            
            <!-- 日志 -->
            <el-button type="info" size="mini" @click="handleLog(scope.row)">{{ $t('AUTOMATION.LOG') }}</el-button>

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
          :current-page.sync="params.current_page"
          :page-size="params.per_page"
          @current-change="getControlStrategyIndex"></el-pagination>
    </div>

    <Logger :visible.sync="showLogger" :id="automationId"/>

    <EditForm :visible.sync="showEditDialog" :data="editFormData" @submit="getControlStrategyIndex"/>
  </div>
</template>

<script>
import TableTitle from "@/components/common/TableTitle";
import EditForm from "./EditForm";
import Logger from "./Logger"
import "@/core/mixins/common"

import Auto from "@/api/automation_1.0"
import { message_success } from '@/utils/helpers';
export default {
  name: "ControlStrategy",
  components: {
    TableTitle,
    EditForm,
    Logger
  },
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      params: {
        current_page: 1,
        per_page: 10
      },
      showEditDialog: false,
      editFormData: {},
      showLogger: false,
      automationId: ""
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
      this.showEditDialog = true;
    },
    /**
     * @description: 删除一条策略
     * @param {*} v
     * @return {*}
     */        
    handleDelete(v) {
      Auto.Control.delete({id: v.id})
        .then(({data: result}) => {
          if (result.code === 200) {
            this.getControlStrategyIndex();
            message_success("删除成功!");
          }
        })
    },
    /**
     * @description: 修改状态
     * @param {*} v
     * @return {*}
     */    
    handleSetStatus(v) {
      const enabled = v.enabled === "0" ? "1" : "0";
      Auto.Control.enabled({id: v.id, enabled })
        .then(({data: result}) => {
          if (result.code === 200) {
            this.getControlStrategyIndex();
            message_success(enabled === "0" ? "已禁用" : "已启用！");
          }
        })
    },
    /**
     * @description: 日志
     * @param {*} v
     * @return {*}
     */    
    handleLog(v) {
      this.automationId = v.id;
      this.showLogger = true;
    },
    /**
     * @description:获取策略列表
     * @return {*}
     */  
    getControlStrategyIndex() {
      Auto.Control.list(this.params)
        .then(({data}) => {
          if (data.code === 200) {
            this.tableData = data.data?.data || [];
            this.total = data.data?.total || 0;
          }
        })
    }
  }

}
</script>

<style scoped>

</style>