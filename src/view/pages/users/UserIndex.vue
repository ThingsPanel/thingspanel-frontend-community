<template>
<div class="rounded card p-4 el-table-transparent">
  <!-- 头 start -->
  <el-row type="flex" class="pt-3 pb-4 px-3">
    <el-col :span="12">
      <TableTitle>用户管理</TableTitle>
    </el-col>
    <el-col :span="12" class="text-right">
      <el-button size="medium" type="indigo" @click="createUserDialogVisible = true">添加用户</el-button>
    </el-col>
  </el-row>
  <!-- 头 end -->

  <!-- 表 start -->
  <el-table :data="tableData" v-loading="loading">
    <el-table-column label="序号" type="index" width="50"></el-table-column>
    <el-table-column label="用户名" prop="email"></el-table-column>
    <el-table-column label="姓名" prop="name"></el-table-column>
    <el-table-column label="邮箱" prop="email"></el-table-column>
    <el-table-column label="手机号" prop="mobile"></el-table-column>
    <el-table-column label="角色" prop="is_admin">
      <template v-slot="scope">
        <el-tag size="mini">{{scope.row.is_admin?'管理员': '普通用户'}}</el-tag>
      </template>
    </el-table-column>
    <el-table-column label="操作" align="center" width="250">
      <template v-slot="scope">
        <div class="text-right">
          <el-button type="indigo" size="mini" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="indigo" class="mr-3" size="mini" @click="handleResetPassword(scope.row)">修改密码</el-button>
          <el-popconfirm title="确定要删除此项吗？" @confirm="handleDelete(scope.row)">
            <el-button slot="reference" type="danger" size="mini">删除</el-button>
          </el-popconfirm>
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

  <!-- 修改用户 -->
  <UpdateUserForm :update_user="update_user" :editUserItem="editUserItem" :updateUserDialogVisible.sync="updateUserDialogVisible"></UpdateUserForm>

  <!-- 重置密码 -->
  <ResetPasswordForm :editUserItem="editUserItem" :resetPasswordDialogVisible.sync="resetPasswordDialogVisible"></ResetPasswordForm>
</div>
</template>

<script>
import {defineComponent, ref} from "@vue/composition-api";
import useUserIndex from "@/view/pages/users/useUserIndex";
import CreateUserForm from "@/view/pages/users/CreateUserForm";
import ResetPasswordForm from "@/view/pages/users/ResetPasswordForm";
import UpdateUserForm from "@/view/pages/users/UpdateUserForm";
import TableTitle from "@/components/common/TableTitle.vue"
import {user_delete} from "@/api/user";

export default defineComponent({
  name: "userIndex",
  components: {
    CreateUserForm,
    ResetPasswordForm,
    UpdateUserForm,
    TableTitle,
  },
  setup(){

    // 获取用户列表
    let {
      tableData,
      getUserIndex,
      params,
      total,
      loading,
    } = useUserIndex()

    // 列表中添加一条用户数据
    function add_user(data){
      tableData.value.unshift(data)
    }

    function remove_user(item){
      let index = tableData.value.indexOf(item)
      tableData.value.splice(index, 1)
    }

    function update_user(item, data){
      let index = tableData.value.indexOf(item)
      tableData.value.splice(index, 1, data)
    }

    function handleDelete(item){
      // 发送请求
      user_delete({id: item.id}).then(({data})=>{
        if(data.code === 200){
          // 移除表单数据
          remove_user(item)
        }
      })
    }

    // 新建用户弹窗
    let createUserDialogVisible = ref(false)
    let resetPasswordDialogVisible = ref(false)
    let updateUserDialogVisible = ref(false)

    // 当前编辑的用户
    let editUserItem = ref({})

    // 修改用户密码
    function handleResetPassword(item){
      resetPasswordDialogVisible.value = true
      editUserItem.value = item
    }

    function handleEdit(item){
      updateUserDialogVisible.value = true
      editUserItem.value = item
    }

    return {
      tableData,
      params,
      total,
      loading,
      getUserIndex,
      add_user,
      update_user,
      createUserDialogVisible,
      resetPasswordDialogVisible,
      handleDelete,
      editUserItem,
      handleResetPassword,
      handleEdit,
      updateUserDialogVisible,
    }
  }
})
</script>

<style scoped>

</style>