<template>
<div class="rounded card p-4 el-table-transparent el-dark-input">
  <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
    <el-col :span="12">
      <TableTitle>{{ $t('COMMON.BUSINESSMANAGEMENT') }}</TableTitle>
    </el-col>
    <el-col :span="12" class="px-2 text-right">
      <el-button size="medium" type="indigo"
                 v-if="hasAuth('business:add')" @click="handleCreate()">{{ $t('COMMON.NEWBUSINESS') }}</el-button>
    </el-col>
  </el-row>

  <!-- 表 start -->
  <el-form class="inline-edit">
  <el-table :data="tableData" v-loading="loading">
    <el-table-column :label="$t('COMMON.NO')" type="index"></el-table-column>

    <el-table-column :label="$t('COMMON.BUSINESSNAME1')" prop="name">
      <template v-slot="scope">
        <!-- 新建或者编辑 -->
        <el-form-item v-if="scope.row.status" :error="scope.row.errors.name">
          <el-input size="medium" v-model="scope.row.formData.name" v-focus
                    @keydown.enter.native.prevent="handleSave(scope.row)"></el-input>
        </el-form-item>
        <span v-else class="cursor-pointer" @click="showDevice(scope.row)">{{scope.row.name}}</span>
      </template>
    </el-table-column>

    <el-table-column :label="$t('COMMON.TIMES')" prop="created_at">
      <template v-slot="scope">
        {{scope.row.created_at ? dateFormat(scope.row.created_at) : ""}}
      </template>
    </el-table-column>

    <el-table-column align="center" :label="$t('COMMON.OPERATION')" width="360">
      <template v-slot="scope">
        <div class="text-right">
          <template v-if="scope.row.status">
            <!-- status 状态为新建或者编辑 -->
            <el-button type="indigo" size="mini" @click="handleSave(scope.row)">{{ $t('COMMON.SAVE') }}</el-button>
            <el-button type="default" size="mini" @click="handleCancel(scope.row)">{{ $t('COMMON.CANCEL') }}</el-button>
          </template>
          <template v-else>
            <el-button type="indigo" size="mini" v-if="hasAuth('business:device')" @click="showDevice(scope.row)">{{ $t('COMMON.DEVICE') }}</el-button>
            <el-button type="indigo" size="mini" class="mr-3"
                       v-if="hasAuth('business:edit')" @click="handleEdit(scope.row)">{{ $t('COMMON.EDITASSETSNAME') }}</el-button>
            <el-popconfirm :title="$t('COMMON.TEXT44')" @confirm="handleDelete(scope.row)">
              <el-button slot="reference" type="danger" size="mini" v-if="hasAuth('business:del')">{{ $t('COMMON.DELETE') }}</el-button>
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
import {dateFormat} from "@/utils/tool";

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
      handleCreate,
      handleEdit,
      handleCancel,
      handleSave,
      handleDelete,
    } = useBusinessCUD(tableData)

    // 跳转到设备
    function showDevice(item){
      console.log(item)
      router.push({name: "device", query: {business_id: item.id}, params:{page: params.page}})
    }

    return {
      tableData,
      getBusinessIndex,
      loading,
      params,
      total,
      handleCreate,
      showDevice,
      handleEdit,
      handleCancel,
      handleSave,
      handleDelete,
      dateFormat,
    }
  }
})
</script>

<style scoped>
/*.inline-edit /deep/ input{*/
/*    text-align: center!important;*/
/*}*/

/*.inline-edit /deep/ .el-form-item__error{*/
/*    width: 100%;*/
/*    text-align: center;*/
/*  }*/

/*.inline-edit /deep/ .el-form-item{*/
/*    margin: 0;*/
/*}*/

</style>