<template>
<div class="rounded card p-4">
  <el-row typ="flex" :gutter="20" class="pt-3 pb-3 px-3">
    <el-col :span="12">
      <TableTitle>{{ $t('COMMON.AUTOMATION')}}</TableTitle>
    </el-col>
  </el-row>

  <!-- 表 start -->
  <el-table :data="tableData" v-loading="loading">
    <el-table-column :label="$t('COMMON.NO')" type="index" width="100"></el-table-column>
    <el-table-column :label="$t('COMMON.NAMES')" prop="name"></el-table-column>
    <el-table-column :label="$t('COMMON.TIMES')" prop="created_at">
      <template v-slot="scope">
        {{scope.row.created_at ? dateFormat(scope.row.created_at) : ""}}
      </template>
    </el-table-column>
    <el-table-column align="center" :label="$t('COMMON.OPERATION')" center min-width="200" width="300">
      <template v-slot="scope">
        <div style="text-align: center">
          <el-button type="indigo" size="mini" @click="showAlarmList(scope.row)">{{ $t('COMMON.ALARM_STRATEGY') }}</el-button>
          <el-button type="indigo" size="mini" @click="showControlList(scope.row)">{{ $t('COMMON.CONTROL_STRATEGY') }}</el-button>
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
        @current-change="getAutomationIndex"></el-pagination>
  </div>
</div>
</template>

<script>
import {defineComponent} from "@vue/composition-api";
import TableTitle from "@/components/common/TableTitle.vue"
import useAutomationIndex from "@/view/pages/automation/useAutomationIndex";
import {dateFormat} from "@/utils/tool";
import useRoute from "@/utils/useRoute";

export default defineComponent({
  name: "AutomationIndex",
  components: {
    TableTitle
  },
  setup(){
    let {
      tableData,
      loading,
      total,
      params,
      getAutomationIndex,
    } = useAutomationIndex()

    let {router} = useRoute()

    // 告警信息列表
    function showAlarmList(item){
      router.push({path: "/strategy/alarmlist", query: {id: item.id}})
    }

    // 控制告警列表
    function showControlList(item){
      router.push({path: "/strategy/strlist", query: {id: item.id}})
    }

    return {
      dateFormat,
      tableData,
      loading,
      total,
      params,
      getAutomationIndex,
      showAlarmList,
      showControlList,
    }
  }
})
</script>

<style scoped>

</style>