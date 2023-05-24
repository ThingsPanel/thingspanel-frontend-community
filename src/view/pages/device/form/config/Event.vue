<template>
  <div>
    <div style="display: flex;float: right;margin-bottom: 10px">
      <el-button type="border" size="medium" @click="getList">刷新</el-button>
    </div>
    <el-table :data="tableData" v-loading="loading">
      <el-table-column label="事件标识符" prop="event_identify" width="240"></el-table-column>
      <el-table-column label="事件名称" prop="event_name" width="auto"></el-table-column>

      <el-table-column label="事件上报时间" prop="report_time" width="100">
      </el-table-column>
      <el-table-column label="事件描述" prop="desc" width="auto"></el-table-column>

      <el-table-column label="事件内容" prop="data" width="auto"></el-table-column>


    </el-table>
    <!-- 表 end -->

    <div class="text-right py-3">
      <el-pagination background layout="prev, pager, next" :total="total" :current-page.sync="params.current_page"
        :page-size="params.per_page" @current-change="getList"></el-pagination>
    </div>
  </div>
</template>

<script>
import { getDeviceEventHistoryList } from '@/api/device';
export default {
  components: {},
  props: {
    device: {
      type: [Object],
      default: () => ({})
    }
  },
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
  mounted() {
    this.getList();
  },
  methods: {
    getList() {
      getDeviceEventHistoryList({ device_id: this.device.device, ...this.params })
        .then(({ data }) => {
          if (data.code === 200) {
            this.tableData = data.data.data;
            this.total = data.data.total;
          }
        })
        .catch(err => {
          console.log(err);
        })
    }
  }
}
</script>
<style lang="scss" scoped></style>