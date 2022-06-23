<template>
<div class="rounded card p-4 el-table-transparent el-dark-input">
  <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
    <el-col :span="12">
      <TableTitle>控制策略列表</TableTitle>
    </el-col>
    <el-col :span="12" class="text-right">
      <el-button size="medium" type="indigo" @click="handleCreate()">新策略</el-button>
      <el-button size="medium" type="indigo" @click="goBack()">返回</el-button>
    </el-col>
  </el-row>

  <!-- 表 start -->
  <el-table :data="tableData" v-loading="loading">
    <el-table-column label="序号" type="index"></el-table-column>
    <el-table-column label="规则名称" prop="name"></el-table-column>
    <el-table-column label="规则说明" prop="describe"></el-table-column>
    <el-table-column label="策略类型" prop="type"></el-table-column>
    <el-table-column label="策略优先级" prop="sort"></el-table-column>
    <el-table-column label="策略状态" prop="status">
      <template v-slot="scope">
        {{Number(scope.row.status) ? '开' : '关'}}
      </template>
    </el-table-column>
    <el-table-column label="策略操作" width="150" align="center">
      <template v-slot="scope">
        <div class="text-right">
          <el-button type="indigo" size="mini" class="mr-3" @click="handleEdit(scope.row)">编辑</el-button>

          <el-popconfirm title="确定删除此项？" @confirm="handleDelete(scope.row)">
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
        @current-change="getControlStrategyIndex"></el-pagination>
  </div>

  <ControlEditForm
      :control-dialog-visible.sync="showEditDialog"
      :business_id="business_id"
      :current_item="current_item"
      :key="current_item.id"
      :add_alarm="add_alarm"
      :update_alarm="update_alarm"
  ></ControlEditForm>
</div>
</template>

<script>
import {defineComponent} from "@vue/composition-api";
import TableTitle from "@/components/common/TableTitle";
import useRoute from "@/utils/useRoute";
import {ref} from "@vue/composition-api/dist/vue-composition-api";
import useControlStrategyIndex from "@/view/pages/automation/useControlStrategyIndex";
import ControlEditForm from "./ControlEditForm.vue"
import useTableDataCUD from "@/view/pages/automation/useTableDataCUD";
import {automation_delete} from "@/api/automation";

export default defineComponent({
  name: "ControlStrategy",
  components: {
    TableTitle,
    ControlEditForm,
  },
  setup(){
    let {route, router} = useRoute()
    let business_id = route.query.id
    let current_item = ref({})

    let {
      tableData,
      params,
      loading,
      total,
      getControlStrategyIndex,
    } = useControlStrategyIndex(business_id)

    // 后退
    function goBack(){
      router.go(-1)
    }

    // 编辑弹窗
    let showEditDialog = ref(false)

    function handleCreate(){
      handleEdit({})
    }

    function handleEdit(item){
      showEditDialog.value = true
      current_item.value = item
    }

    function handleDelete(item){
      automation_delete({id: item.id}).then(({data})=>{
        if(data.code === 200){
          remove_alarm(item)
        }
      })
    }

    // tableData 的增删改逻辑
    let {
      add_alarm,
      remove_alarm,
      update_alarm,
    } =useTableDataCUD(tableData, getControlStrategyIndex)

    return {
      showEditDialog,
      business_id,
      current_item,
      goBack,
      handleCreate,
      handleEdit,
      handleDelete,
      tableData,
      params,
      loading,
      total,
      getControlStrategyIndex,
      add_alarm,
      update_alarm,
    }
  }
})
</script>

<style scoped>

</style>