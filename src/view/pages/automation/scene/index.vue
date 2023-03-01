<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-02 08:39:13
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-01 15:47:15
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
        <el-button type="border"  @click="handleShowAdd">新增场景</el-button>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-table :data="tableData" v-loading="loading">
      <el-table-column label="序号" type="index" width="100" align="center"></el-table-column>
      <el-table-column :label="'场景名称'" prop="scenario_name" ></el-table-column>
      <el-table-column :label="'场景描述'" prop="scenario_description" ></el-table-column>
      <el-table-column :label="'创建时间'" prop="created_at">
        <template v-slot="scope">
          {{ scope.row.created_at ? formatDate(scope.row.created_at) : "" }}
        </template>
      </el-table-column>
      <el-table-column align="left" :label="$t('AUTOMATION.OPERATION')"  width="280">
        <template v-slot="scope">
          <div style="text-align: right">
            <el-button type="border" size="mini"  @click="handleShowEdit(scope.row)">编辑</el-button>
            <el-button type="info" size="mini"  @click="handleShowLog(scope.row)">日志</el-button>
            <!-- <el-button type="danger" size="mini"  @click="handleDelete(scope.row)">删除</el-button> -->

            <!-- 删除 -->
            <el-popconfirm title="删除" @confirm="handleDelete(scope.row)">
              <el-button style="margin-left:10px;" slot="reference" type="danger" size="mini" >删除</el-button>
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
          @current-change="getSceneList"></el-pagination>
    </div>

    <EditForm :visible.sync="editDialogVisible" :id="formId" @submit="getSceneList"/>

    <Logger :visible.sync="logDialogVisible" :data="currentItem"/>
  </div>
</template>

<script>
import TableTitle from "@/components/common/TableTitle";
import EditForm from "./EditForm";
import Logger from "./Logger";
import Auto  from "@/api/automation_1.0"
import "@/core/mixins/common"
import { message_success } from '@/utils/helpers';

export default {
  name: "index",
  components: { TableTitle, EditForm, Logger },
  data() {
    return {
      tableData: [],
      loading: false,
      total: 0,
      params: {
        current_page: 1,
        per_page: 10
      },
      editDialogVisible: false,
      logDialogVisible: false,
      formId: "",
      currentItem: {}
    }
  },
  created() {
    this.getSceneList();
  },
  methods: {
    getSceneList() {
      Auto.Scene.list(this.params)
        .then(({data}) => {
          if (data.code === 200) {
            this.tableData = data.data?.data || [];
            this.total = data.data?.total || 0;
          }
        })
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
      this.formId = item.id;
      this.currentItem = JSON.parse(JSON.stringify(item));
      this.logDialogVisible = true;
    },
    handleDelete(item) {
      Auto.Scene.delete({ id: item.id })
        .then(res => {
          console.log(res)
          if (res.data.code === 200) {
            this.getSceneList();
            message_success("删除成功!");
          }
        })
    }
  }
}
</script>

<style scoped>

</style>