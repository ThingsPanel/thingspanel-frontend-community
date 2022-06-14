<template>
<div class="rounded card p-4 el-table-transparent el-dark-input">
  <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
    <el-col :span="22">
      <TableTitle>业务管理</TableTitle>
    </el-col>
    <el-col :span="2" class="px-2">
      <el-button class="w-100" size="medium" type="indigo" @click="handleCreate()">新增业务</el-button>
    </el-col>
  </el-row>

  <!-- 表 start -->
  <el-form
      ref="businessForm"
      class="inline-edit input-center"
      :model="formData"
      :rules="rules"
      hide-required-asterisk>
  <el-table :data="tableData" v-loading="loading">
    <el-table-column label="序号" type="index" width="50" align="center">
    </el-table-column>
    <el-table-column align="center" label="名称" prop="name">
      <template v-slot="scope">
        <!-- 新建或者编辑 -->
        <el-form-item prop="name" v-if="scope.row.status">
          <el-input size="mini" v-model="formData.name" v-focus
                    @keydown.enter.native="handleSave(scope.row)"></el-input>
        </el-form-item>
        <span v-else class="cursor-pointer" @click="showAsset(scope.row)">{{scope.row.name}}</span>
      </template>
    </el-table-column>
    <el-table-column align="center" label="时间" prop="created_at"></el-table-column>
    <el-table-column align="center" label="操作" width="200">
      <template v-slot="scope">
        <div class="text-right">
          <template v-if="scope.row.status">
            <!-- status 状态为新建或者编辑 -->
            <el-button type="indigo" size="mini" @click="handleSave(scope.row)">保存</el-button>
            <el-button type="default" size="mini" @click="handleCancel(scope.row)">取消</el-button>
          </template>
          <template v-else>
            <el-button type="indigo" size="mini" class="mr-3" @click="handleEdit(scope.row)">编辑业务名</el-button>
            <el-popconfirm title="确定要删除此项吗？" @confirm="handleDelete(scope.row)">
              <el-button slot="reference" type="danger" size="mini">删除</el-button>
            </el-popconfirm>
          </template>
        </div>
      </template>
    </el-table-column>
  </el-table>
  </el-form>
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

import {defineComponent} from "@vue/composition-api";
import useBusinessIndex from "@/view/pages/business/useBusinessIndex";
import useRoute from "@/utils/useRoute";
import useBusinessCUD from "@/view/pages/business/useBusinessCUD";
import TableTitle from "@/components/common/TableTitle.vue"

export default defineComponent({
  name: "BusinessIndex",
  components: {
    TableTitle
  },
  setup(){
    let {router, route} = useRoute()

    // 获取传参的 page
    let page = route.params && route.params.page ? route.params.page : 1;

    // 业务的列表
    let {
      tableData,
      getBusinessIndex,
      loading,
      params,
      total,
    } = useBusinessIndex(page)

    // 业务的增删改
    let {
      businessForm,
      formData,
      rules,
      handleCreate,
      handleEdit,
      handleCancel,
      handleSave,
      handleDelete,
    } = useBusinessCUD(tableData)

    // 跳转到设备分组
    function showAsset(item){
      // console.log(item)
      router.push({name: 'assetlist', query:{id: item.id, name: item.name}, params: {page: params.page}})
    }

    return {
      tableData,
      getBusinessIndex,
      loading,
      params,
      total,
      businessForm,
      formData,
      rules,
      handleCreate,
      showAsset,
      handleEdit,
      handleCancel,
      handleSave,
      handleDelete,
    }
  }
})
</script>

<style lang="scss">
.inline-edit{
  input{
    text-align: center;
  }

  .el-form-item__error{
    width: 100%;
    text-align: center;
  }

  .el-form-item{
    margin: 22px 0;
  }
}
</style>