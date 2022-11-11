<template>
<div class="rounded card p-4  el-table-transparent">
  <el-row type="flex" :gutter="20" class="pt-3 pb-3 px-3">
    <el-col>
      <TableTitle>{{ $t("COMMON.OPERATIONLOG")}}</TableTitle>
    </el-col>
  </el-row>

  <!-- 头 start -->
  <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input">
    <el-col :span="5">
      <el-input :placeholder="$t('COMMON.IPADDRESS')" size="medium" v-model="params.ip" clearable @clear="handleSearch()">
<!--        <template slot="prepend">IP</template>-->
      </el-input>
    </el-col>
    <el-col :span="5">
      <el-input :placeholder="$t('COMMON.PLACEHOLDER31')" size="medium" v-model="params.path" clearable @clear="handleSearch()">
<!--        <template slot="prepend">路径</template>-->
      </el-input>
    </el-col>
    <el-col :span="14" class="text-right">
      <el-button type="indigo" size="medium" @click="handleSearch()">{{ $t("COMMON.SEARCH")}}</el-button>

<!--      <el-button type="default" size="medium" @click="handleReset()">重置</el-button>-->
    </el-col>
  </el-row>
  <!-- 头 end -->

  <!-- 表 start -->
  <el-table :data="tableData" v-loading="loading">
    <el-table-column :label="$t('COMMON.NO')" type="index" width="50"></el-table-column>
    <el-table-column label="IP" prop="detailed.ip">
      <template v-slot="scope">
        <span class="cursor-pointer" @click="handleSearch({ip:scope.row.detailed.ip})">{{scope.row.detailed.ip}}</span>
      </template>
    </el-table-column>
    <el-table-column :label="$t('COMMON.PATH')" prop="detailed.path">
      <template v-slot="scope">
        <span class="cursor-pointer" @click="handleSearch({path:scope.row.detailed.path})">{{scope.row.detailed.path}}</span>
      </template>
    </el-table-column>
    <el-table-column :label="$t('COMMON.INSTRUCTION')" prop="type">
      <template v-slot="scope">
        {{scope.row.type ? $t(scope.row.type) : "未知"}}
      </template>
    </el-table-column>
    <el-table-column :label="$t('COMMON.TIMES')" prop="created_at"></el-table-column>
    <el-table-column :label="$t('COMMON.CONSUMING')" prop="detailed.request_time"></el-table-column>
    <el-table-column :label="$t('COMMON.USERNAME')" prop="detailed.name"></el-table-column>
  </el-table>
  <!-- 表 end -->

  <div class="text-right py-3">
    <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :current-page.sync="params.page"
        :page-size="params.limit"
        @current-change="getOperationIndex"></el-pagination>
  </div>
</div>
</template>

<script>
import {defineComponent} from "@vue/composition-api";
import useOperationIndex from "@/view/pages/log/useOperationIndex";
import TableTitle from "@/components/common/TableTitle.vue"

export default defineComponent({
  name: "Index",
  components: {
    TableTitle
  },
  setup(){

    let {
      tableData,
      params,
      loading,
      total,
      getOperationIndex,
      handleSearch,
      handleReset
    } = useOperationIndex()

    return {
      tableData,
      params,
      total,
      getOperationIndex,
      loading,
      handleSearch,
      handleReset,
    }
  }
})
</script>

<style scoped>
</style>