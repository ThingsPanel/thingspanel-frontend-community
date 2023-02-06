<template>
  <div class="rounded card p-4 el-table-transparent el-dark-input">
    <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{  $t('AUTOMATION.CONTROL_STRATEGY.CONTROL_STRATEGY_LIST') }}</TableTitle>
      </el-col>
      <el-col :span="12" class="text-right">
        <!--      新增-->
        <el-button size="medium" type="border" @click="handleCreate()">{{  $t('AUTOMATION.CONTROL_STRATEGY.NEW_STRATEGY') }}</el-button>
        <!--      返回-->
        <el-button size="medium" type="indigo" @click="goBack()">{{  $t('AUTOMATION.RETURN') }}</el-button>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-table :data="tableData" v-loading="loading">
      <el-table-column :label="$t('AUTOMATION.RULE_NAME')" prop="name"></el-table-column>
      <el-table-column :label="$t('AUTOMATION.RULE_DESCRIBE')" prop="describe"></el-table-column>

      <el-table-column :label="$t('AUTOMATION.CREATETIME')" prop="time"></el-table-column>

      <!-- 策略操作-->
      <el-table-column :label="$t('AUTOMATION.OPERATION')" width="150" align="center">
        <template v-slot="scope">
          <div class="text-right">
            <el-button type="yellow" size="mini" class="mr-3">{{ $t('AUTOMATION.START') }}</el-button>

            <!-- 编辑 -->
            <el-button type="yellow" size="mini" class="mr-3" @click="handleEdit(scope.row)">{{ $t('AUTOMATION.EDIT') }}</el-button>

            <el-button type="yellow" size="mini" class="mr-3">{{ $t('AUTOMATION.LOG') }}</el-button>

            <!-- 删除 -->
            <el-popconfirm :title="$t('AUTOMATION.TITLE4')" @confirm="handleDelete(scope.row)">
              <el-button slot="reference" type="danger" size="mini">{{ $t('AUTOMATION.DELETE') }}</el-button>
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

    <EditForm :visible.sync="showEditDialog"/>
  </div>
</template>

<script>
import TableTitle from "@/components/common/TableTitle";
import EditForm from "./EditForm";
export default {
  name: "ControlStrategy",
  components: {
    TableTitle,
    EditForm
  },
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      params: {},
      showEditDialog: false
    }
  },
  methods: {
    handleCreate() {
      this.showEditDialog = true;
    },
    goBack() {

    },
    handleEdit() {

    },
    handleDelete() {

    },
    getControlStrategyIndex() {

    }
  }

}
</script>

<style scoped>

</style>