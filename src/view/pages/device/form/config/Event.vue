<template>
  <div>
    <div style="display: flex;float: right;margin-bottom: 10px">
      <el-button type="border" size="medium">刷新</el-button>
  </div>
    <el-table :data="tableData" v-loading="loading">
      <el-table-column label="事件标识符" prop="trigger_time" width="240"></el-table-column>
      <el-table-column label="事件名称" prop="process_description" width="auto"></el-table-column>

      <el-table-column label="事件上报时间" prop="process_result" width="100">
        <template v-slot="scope">
          {{ scope.row.process_result == '1' ? $t('AUTOMATION.SUCEESSFUL') : $t('AUTOMATION.FAILURE') }}
        </template>
      </el-table-column>
      <el-table-column label="事件描述" prop="process_description" width="auto"></el-table-column>

      <el-table-column label="事件内容" prop="process_description" width="auto"></el-table-column>

      
    </el-table>
    <!-- 表 end -->

    <div class="text-right py-3">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :current-page.sync="params.current_page"
        :page-size="params.per_page"
        @current-change="getList"
      ></el-pagination>
    </div>
  </div>
</template>

<script>
export default {
  components: {},
  props: {},
  data() {
    return {
      loading: false,
      tableData: [],
      total: 0,
      params: {
        current_page: 1,
        per_page: 10
      }
    }
  },
  methods: {
    getList() {

    }
  }
}
</script>
<style lang="scss" scoped>
</style>