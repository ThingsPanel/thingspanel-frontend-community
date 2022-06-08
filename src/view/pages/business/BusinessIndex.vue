<template>
<div class="rounded card p-4 el-table-transparent">
  <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3">
    <el-col :span="22">
      <h2 class="h2 text-white m-0 pt-2">业务管理</h2>
    </el-col>
    <el-col :span="2" class="px-2">
      <el-button class="w-100" size="medium" type="indigo">新增业务</el-button>
    </el-col>
  </el-row>

  <!-- 筛选start -->
<!--  <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input">-->
<!--    <el-col :span="4">-->
<!--      <el-input size="medium"></el-input>-->
<!--    </el-col>-->
<!--    <el-col :span="4">-->
<!--      <el-input size="medium"></el-input>-->
<!--    </el-col>-->
<!--    <el-col :span="4">-->
<!--      <el-input size="medium"></el-input>-->
<!--    </el-col>-->
<!--    <el-col :span="4">-->
<!--      <el-input size="medium"></el-input>-->
<!--    </el-col>-->
<!--    <el-col :span="4"></el-col>-->
<!--    <el-col :span="2">-->
<!--      <el-button class="w-100" type="indigo" size="medium">查询</el-button>-->
<!--    </el-col>-->
<!--    <el-col :span="2">-->
<!--      <el-button class="w-100" type="default" size="medium">重置</el-button>-->
<!--    </el-col>-->
<!--  </el-row>-->
  <!-- 筛选end -->

  <!-- 表 start -->
  <el-table :data="tableData" v-loading="loading">
    <el-table-column label="序号" type="index" width="50" align="center">
    </el-table-column>
    <el-table-column align="center" label="名称" prop="name"></el-table-column>
    <el-table-column align="center" label="时间" prop="created_at"></el-table-column>
    <el-table-column align="center" label="操作" width="150">
      <template v-slot="scope">
        <div class="text-right">
          <el-button type="indigo" size="mini" class="mr-3">编辑</el-button>
          <el-popconfirm title="确定要删除此项吗？">
            <el-button slot="reference" type="danger" size="mini">删除</el-button>
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
        @current-change="getBusinessIndex"></el-pagination>
  </div>

</div>
</template>

<script>

import {defineComponent, ref} from "@vue/composition-api";
import useBusinessIndex from "@/view/pages/business/useBusinessIndex";

export default defineComponent({
  name: "BusinessIndex",
  setup(){
    let {
      tableData,
      getBusinessIndex,
      loading,
      params,
      total,
    } = useBusinessIndex()

    return {
      tableData,
      getBusinessIndex,
      loading,
      params,
      total,
    }
  }
})
</script>

<style scoped>

</style>