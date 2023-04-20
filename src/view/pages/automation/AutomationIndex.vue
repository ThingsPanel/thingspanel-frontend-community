<template>
  <div class="rounded card p-4">
    <el-row typ="flex" :gutter="20" class="pt-3 pb-3 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t('AUTOMATION.TITLE')}}</TableTitle>
      </el-col>
    </el-row>

    <!-- 表 start -->
    <el-table :data="tableData" v-loading="loading">
      <el-table-column :label="$t('AUTOMATION.NO')" type="index" width="260"></el-table-column>
      <el-table-column :label="$t('AUTOMATION.NAMES')" prop="name" ></el-table-column>
      <el-table-column :label="$t('AUTOMATION.TIMES')" prop="created_at">
        <template v-slot="scope">
          {{scope.row.created_at ? dateFormat(scope.row.created_at) : ""}}
        </template>
      </el-table-column>
      <el-table-column align="left" :label="$t('AUTOMATION.OPERATION')"  width="280">
        <template v-slot="scope">
          <div style="text-align: left">
           <!-- <el-button type="indigo" size="mini" v-if="hasAuth('strategy:scene:list')" @click="showSceneList(scope.row)">场景管理</el-button> -->
            <el-button type="indigo" size="mini" @click="showSceneList(scope.row)">
              {{  $t("AUTOMATION.SCENE_MANAGEMENT") }}
            </el-button>
            <el-button type="indigo" size="mini" @click="showAlarmList(scope.row)">
              {{ $t('AUTOMATION.ALARM_STRATEGY_BTN') }}
            </el-button>
            <el-button type="indigo" size="mini" @click="showControlList(scope.row)">
              {{ $t('AUTOMATION.CONTROL_STRATEGY_BTN') }}
            </el-button>
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

    /**
     * 场景列表
     * @param item
     */
    function showSceneList(item) {
      router.push({path: "/strategy/scenelist", query: {id: item.id }})
    }

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
      showSceneList,
      showAlarmList,
      showControlList,
    }
  }
})
</script>

<style scoped>

</style>