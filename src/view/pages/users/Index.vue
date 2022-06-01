<template>
<div class="rounded card p-4 el-table-transparent">
  <!-- 头 start -->
  <el-row type="flex" class="pt-3 pb-4">
    <el-col :span="2">
      <h2 class="h2 text-white m-0 pt-2 pl-2">用户管理</h2>
    </el-col>
    <el-col :offset="20" :span="2" class="px-2">
      <el-button class="w-100" size="medium" type="primary" @click="createUserDialogVisible = true">添加用户</el-button>
    </el-col>
  </el-row>
  <!-- 头 end -->

  <!-- 表 start -->
  <el-table :data="tableData">
    <el-table-column label="用户名" prop="email"></el-table-column>
    <el-table-column label="姓名" prop="name"></el-table-column>
    <el-table-column label="邮箱" prop="email"></el-table-column>
    <el-table-column label="手机号" prop="mobile"></el-table-column>
    <el-table-column label="角色" prop="is_admin" align="center">
      <template v-slot="scope">
        <el-tag size="mini">{{scope.row.is_admin?'管理员': '普通用户'}}</el-tag>
      </template>
    </el-table-column>
    <el-table-column label="操作" align="center" width="250">
      <template v-slot="scope">
        <div class="text-right">
          <el-button type="primary" size="mini">编辑</el-button>
          <el-button type="primary" size="mini">修改密码</el-button>
          <el-button type="danger" size="mini">删除</el-button>
        </div>
      </template>
    </el-table-column>
  </el-table>
  <!-- 表 end -->

  <!-- 分页 start -->
  <div class="text-right py-3">
    <el-pagination
      background
      layout="prev, pager, next"
      :total="total"
      :current-page.sync="params.page"
      :page-size="params.limit"
      @current-change="getUserIndex"></el-pagination>
  </div>
  <!-- 分页 end -->

  <!-- 创建用户表单 -->
  <CreateUserForm :add_user="add_user" :createUserDialogVisible.sync="createUserDialogVisible"></CreateUserForm>
</div>
</template>

<script>
import {defineComponent, ref} from "@vue/composition-api";
import useUserIndex from "@/view/pages/users/useUserIndex";
import CreateUserForm from "@/view/pages/users/CreateUserForm";

export default defineComponent({
  name: "userIndex",
  components: {
    CreateUserForm
  },
  setup(){

    // 获取用户列表
    let {tableData,
      getUserIndex,
      params,
      total} = useUserIndex()

    // 列表中添加一条用户数据
    function add_user(data){
      tableData.value.push(data)
    }

    let createUserDialogVisible = ref(false)

    return {
      tableData,
      params,
      total,
      getUserIndex,
      add_user,
      createUserDialogVisible,
    }
  }
})
</script>

<style scoped>

</style>