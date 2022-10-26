<!-- 控制策略 -->
<template>
<div class="rounded card p-4 el-table-transparent el-dark-input">
  <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
    <el-col :span="12">
      <TableTitle>{{  $t('AUTOMATION.CONTROL_STRATEGY.CONTROL_STRATEGY_LIST') }}</TableTitle>
    </el-col>
    <el-col :span="12" class="text-right">
<!--      新增-->
      <el-button size="medium" type="indigo" @click="handleCreate()">{{  $t('AUTOMATION.CONTROL_STRATEGY.NEW_STRATEGY') }}</el-button>
<!--      返回-->
      <el-button size="medium" type="indigo" @click="goBack()">{{  $t('COMMON.RETURN') }}</el-button>
    </el-col>
  </el-row>

  <!-- 表 start -->
  <el-table :data="tableData" v-loading="loading">
    <el-table-column :label="$t('COMMON.NO')" type="index"></el-table-column>
    <el-table-column :label="$t('COMMON.RULE_NAME')" prop="name"></el-table-column>
    <el-table-column :label="$t('COMMON.RULE_DESCRIBE')" prop="describe"></el-table-column>
    <el-table-column :label="$t('COMMON.STRATRGYLISTTYPE')" prop="type">
      <template v-slot="scope">
        {{scope.row.type == "1" ? $t('AUTOMATION.DEVICE_CONDITION_TYPE') : $t('AUTOMATION.TIME_CONDITION_TYPE') }}
      </template>
    </el-table-column>
    <el-table-column :label="$t('COMMON.POLICYPRIORITY')" prop="sort"></el-table-column>
<!--    策略状态-->
    <el-table-column :label="$t('COMMON.POLICYSTATUS')" prop="status">
      <template v-slot="scope">
        {{Number(scope.row.status) ? $t('COMMON.ON') : $t('COMMON.OFF') }}
      </template>
    </el-table-column>
    <!-- 策略操作-->
    <el-table-column :label="$t('COMMON.STRATEGY_HANDLE')" width="150" align="center">
      <template v-slot="scope">
        <div class="text-right">
          <!-- 编辑 -->
          <el-button type="indigo" size="mini" class="mr-3" @click="handleEdit(scope.row)">{{ $t('COMMON.EDIT') }}</el-button>
          <!-- 删除 -->
          <el-popconfirm :title="$t('COMMON.TITLE4')" @confirm="handleDelete(scope.row)">
            <el-button slot="reference" type="danger" size="mini">{{ $t('COMMON.DELETE') }}</el-button>
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

<!-- 控制策略 -->
<script>
import {defineComponent} from "@vue/composition-api";
import TableTitle from "@/components/common/TableTitle";
import useRoute from "@/utils/useRoute";
import {ref} from "@vue/composition-api/dist/vue-composition-api";
import useControlStrategyIndex from "./useControlStrategyIndex";
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