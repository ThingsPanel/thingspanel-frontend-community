<template>
<div class="rounded card p-4">
  <!-- 头 start -->
  <el-row type="flex" class="pt-3 pb-4 px-3">
    <el-col :span="12">
      <TableTitle>{{ $t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.USERS') }}</TableTitle>
    </el-col>
    <el-col :span="12" class="text-right">
<!--      -->
      <el-button size="medium" type="indigo" @click="createUserDialogVisible = true">{{ $t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.AddUSER') }}</el-button>
    </el-col>
  </el-row>
  <!-- 头 end -->

  <!-- 表 start -->
  <el-table :data="tableData" v-loading="loading">
    <el-table-column :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.NO')" type="index" width="50">
      <template v-slot="scope">
        <span>{{ (params.page - 1) * 10 + scope.$index + 1 }}</span>
      </template>
    </el-table-column>
    <el-table-column :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.USERNAME')" prop="email"></el-table-column>
    <el-table-column :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.NAME')" prop="name"></el-table-column>
    <el-table-column :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.EMAIL')" prop="email"></el-table-column>
    <el-table-column :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.TELEPHONE')" prop="mobile"></el-table-column>
    <el-table-column :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.ROLE')" align="left">
      <template v-slot="scope">
        <div style="display: flex;float:left;" v-for="role in rolesData" :key="role.id">
          <span style="display: flex;float:left;" v-for="item in scope.row.roles" :key="item">
            <el-tag style="margin-right: 5px;margin-bottom: 5px" size="small" v-if="role.id == item" >{{ role.role_name }}</el-tag>
          </span>
        </div>
      </template>
    </el-table-column>
    <el-table-column :label="$t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.OPERATION')" align="center" width="300">
      <template v-slot="scope">
        <div class="text-right">
          <el-button type="indigo" size="mini" @click="handleEdit(scope.row)">{{ $t('SYSTEM_MANAGEMENT.EDIT') }}</el-button>
          <el-button type="indigo" class="mr-3" size="mini"
                     :disabled="!hasAuth('sys:user:editpassword')"
                     @click="handleResetPassword(scope.row)">{{ $t('SYSTEM_MANAGEMENT.USER_MANAGEMENT.CHANGEPASSWORD') }}</el-button>
          <el-popconfirm :confirm-button-text="$t('COMMON.CONFIRM')" :cancel-button-text="$t('COMMON.CANCEL')" :title="$t('SYSTEM_MANAGEMENT.TITLE4')" @confirm="handleDelete(scope.row)">
            <el-button slot="reference" type="danger" size="mini" :disabled="!hasAuth('sys:user:del')">{{ $t('SYSTEM_MANAGEMENT.DELETE') }}</el-button>
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
  <CreateUserForm :rolesData="rolesData" :add_user="add_user" :createUserDialogVisible.sync="createUserDialogVisible"></CreateUserForm>

  <!-- 修改用户 -->
  <UpdateUserForm :rolesData="rolesData" :update_user="update_user" :editUserItem="editUserItem" :updateUserDialogVisible.sync="updateUserDialogVisible"></UpdateUserForm>

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
      rolesData,
      getUserIndex,
      params,
      total,
      loading,
    } = useUserIndex()

    // 列表中添加一条用户数据
    function add_user(){
      getUserIndex();
    }

    function remove_user(item){
      getUserIndex();
    }

    function update_user(){
      getUserIndex();
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
      rolesData,
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
/deep/ .el-tag {
  border: 1px solid;
  background-color: transparent;
}
</style>