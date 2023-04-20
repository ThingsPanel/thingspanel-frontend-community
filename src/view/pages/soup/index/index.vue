<template>
  <div class="rounded card p-4">
    <el-row type="flex" :gutter="20" class="pt-3 pb-3 px-3">
      <el-col>
        <TableTitle>{{ $t('SOUPDATAMANGEMENT.ADDSOUPDATAMANAGME') }}</TableTitle>
      </el-col>
    </el-row>
  
    <!-- 头 start -->
    <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input">  
      <el-col :span="4">
        <el-input
            v-model="params.shop_name"
            :placeholder="$t('SOUPDATAMANGEMENT.SHOPNAMEKEYS')"
     
            clearable
            @keydown.enter.native="handleSearch()"
            @clear="handleSearch()">
        </el-input>
      </el-col>
  
      <el-col :span="5">
        <div>
          <el-button class="mr-2" type="border" size="medium" @click="handleSearch()">{{ $t('DATA_MANAGEMENT.SEARCH') }}</el-button>
  
          <el-popconfirm :title="`确定导出 ${total} 条数据吗?`" @confirm="handleExport()">
            <el-button slot="reference" type="export" size="medium">{{ $t('DATA_MANAGEMENT.EXPORT') }}</el-button>
          </el-popconfirm>
  
  <!--        <el-button class="ml-2" type="default" size="medium" @click="handleReset()">重置</el-button>-->
        </div>
      </el-col>
    </el-row>
    <!-- 头 end -->
  
    <!-- 表 start -->
    <el-table :data="tableData">
      <el-table-column :label="$t('SOUPDATAMANGEMENT.SOUPDATALIST.NO')" type="index" width="50"></el-table-column>
      <el-table-column :label="$t('SOUPDATAMANGEMENT.SOUPDATALIST.SHOPNAME')" prop="ShopName"></el-table-column>
  
      <el-table-column :label="$t('SOUPDATAMANGEMENT.SOUPDATALIST.ORDERID')" prop="OrderSn"></el-table-column>
      <el-table-column :label="$t('SOUPDATAMANGEMENT.SOUPDATALIST.BOTTOMNAME')"  prop="BottomPot"></el-table-column>
      <el-table-column :label="$t('SOUPDATAMANGEMENT.SOUPDATALIST.TABLENUMBER')" prop="TableNumber"></el-table-column>
  <!--    <el-table-column label="Token" prop="token" width="300">-->
  <!--      <template v-slot="scope">-->
  <!--        <span class="cursor-pointer" @click="handleSearch({token: scope.row.token})">{{scope.row.token}}</span>-->
  <!--      </template>-->
  <!--    </el-table-column>-->
  
      <el-table-column :label="$t('SOUPDATAMANGEMENT.SOUPDATALIST.ORDERTIME')"  prop="OrderTime"></el-table-column>
      <el-table-column :label="$t('SOUPDATAMANGEMENT.SOUPDATALIST.STARTADDSOUPTIME')" prop="SoupStartTime"></el-table-column>
      <el-table-column :label="$t('SOUPDATAMANGEMENT.SOUPDATALIST.ADDSOUPFINISHTIME')" prop="SoupEndTime"></el-table-column>
      
    </el-table>
    <!-- 表 end -->
  
    <div class="text-right py-3">
      <el-pagination
          background
          layout="prev, pager, next"
          :total="total"
          :current-page.sync="params.current_page"
          :page-size="params.per_page"
          @current-change="getKvIndex"></el-pagination>
    </div>
  
    <el-dialog
        class="el-dark-dialog el-dark-input"
        width="30%"
        :title="$t('DATA_MANAGEMENT.EXPORT')"
        :visible.sync="exportVisible">
  
      <div class="text-center">
        <p>{{ downloadUrl ? downloadUrl.split('/').pop().toString() : $t('DATA_MANAGEMENT.GENERATE_WAIT') }}</p>
        <p v-if="!exporting">
            <a :href="downloadUrl">{{ $t('DATA_MANAGEMENT.CLICKDOWNLOAD') }}</a>
        </p>
      </div>
  
    </el-dialog>
  </div>
  </template>
  
  <script>
  import {defineComponent, watch} from "@vue/composition-api";
  import DatePickerOptions from "@/utils/DatePickerOptions";
  import useDataIndex from "./useDataIndex";
  import {dateFormat} from "@/utils/tool";
  import useDataExport from "./useDataExport";
  import TableTitle from "@/components/common/TableTitle.vue"
  import BusinessSelector from "@/components/common/BusinessSelector";
  import DeviceGroupSelector from "@/components/common/DeviceGroupSelector.vue"
  
  export default defineComponent({
    name: "DataIndex",
    components: {
      TableTitle,
      BusinessSelector,
      DeviceGroupSelector,
    },
    setup(){
      const url = (process.env.VUE_APP_BASE_URL ||
      document.location.protocol + "//" + document.domain + ":9999/")
      const {
        tableData,
        loading,
        params,
        total,
        getKvIndex,
        datetimerange,
        handleSearch,
        handleReset
      } = useDataIndex()
  
      // 清除 business 选择器
      function handleBusinessSelectorChange(){
        // 清除资产的筛选
        params.asset_id = ""
        handleSearch()
      }
  
  
      function imgView(str) {
        let arr = [];
        arr.push(this.url + str);
        return arr;
      }
  
      // 导出
     const {
       exportVisible,
       downloadUrl,
       exporting,
       handleExport,
     } = useDataExport(params)
  
  
  
      return {
        url,
        tableData,
        loading,
        params,
        total,
        getKvIndex,
        imgView,
        datetimerange,
        DatePickerOptions,
        handleSearch,
        handleReset,
        dateFormat,
        handleExport,
        exportVisible,
        downloadUrl,
        exporting,
        handleBusinessSelectorChange,
      }
    }
  })
  </script>
  
  <style scoped>
  
  </style>