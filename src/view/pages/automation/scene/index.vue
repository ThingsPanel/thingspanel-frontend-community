<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-02 08:39:13
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-07 09:08:46
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\scene\index.vue
 * @Description: 场景列表
-->
<template>
  <div class="rounded card p-4">
    <el-row typ="flex" :gutter="20" class="pt-3 pb-3 px-3">
      <el-col :span="12">
        <TableTitle>场景管理</TableTitle>
      </el-col>
      <el-col :span="12" class="text-right">
        <el-button type="border" size="mini"  @click="handleShowAdd">新增场景</el-button>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-table :data="tableData" v-loading="loading">
      <el-table-column :label="'场景名称'" prop="name" ></el-table-column>
      <el-table-column :label="'场景描述'" prop="describe" ></el-table-column>
      <el-table-column :label="'创建时间'" prop="created_at">
        <template v-slot="scope">
          {{ scope.row.created_at ? dateFormat(scope.row.created_at) : "" }}
        </template>
      </el-table-column>
      <el-table-column align="left" :label="$t('AUTOMATION.OPERATION')"  width="280">
        <template v-slot="scope">
          <div style="text-align: right">
            <el-button type="border" size="mini"  @click="handleShowEdit(scope.row)">编辑</el-button>
            <el-button type="border" size="mini"  @click="handleShowLog(scope.row)">日志</el-button>
            <el-button type="danger" size="mini"  @click="handleDelete(scope.row)">删除</el-button>

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
          @current-change="getSceneList"></el-pagination>
    </div>

    <EditForm :visible.sync="editDialogVisible" :id="formId"/>
  </div>
</template>

<script>
import TableTitle from "@/components/common/TableTitle";
import EditForm from "./EditForm";
import data from "./data"
export default {
  name: "index",
  components: { TableTitle, EditForm },
  data() {
    return {
      tableData: [],
      loading: false,
      total: 0,
      params: {},
      editDialogVisible: false,
      formId: ""
    }
  },
  created() {
    this.getSceneList();
  },
  methods: {
    getSceneList() {
      this.tableData = data;
    },
    handleShowAdd() {
      this.formId = "";
      this.editDialogVisible = true;
    },
    handleShowEdit(item) {
      this.formId = item.id;
      this.editDialogVisible = true;
    },
    handleShowLog(item) {

    },
    handleDelete(item) {

    }
  }
}
</script>

<style scoped>

</style>