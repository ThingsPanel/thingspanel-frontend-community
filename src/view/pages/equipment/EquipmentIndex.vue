<template>
  <div class="rounded card p-4">
    <el-row type="flex" :gutter="20" class="pt-3 pb-3 px-3">
      <el-col>
        <TableTitle>{{ $t("COMMON.EQUIPMENTLOG")}}</TableTitle>
      </el-col>
    </el-row>

    <!-- 头 start -->
    <el-row type="flex" :gutter="10" class="pt-3 pb-4 px-3 el-dark-input">
      <el-col :span="10">
        <el-input
          :placeholder="$t('COMMON.PLACEHOLDER18')"
          size="medium"
          v-model="params.business_name"
          clearable
          @clear="handleSearch()"
        >
          <!--        <template slot="prepend">IP</template>-->
        </el-input>
      </el-col>
      <el-col :span="10">
        <el-input
          :placeholder="$t('COMMON.ENTERASSETNAME')"
          size="medium"
          v-model="params.asset_name"
          clearable
          @clear="handleSearch()"
        >
          <!--        <template slot="prepend">路径</template>-->
        </el-input>
      </el-col>
      <el-col :span="5">
        <el-select v-model="params.operation_type" size="medium" :placeholder="$t('COMMON.OPERATIONTYPE')">
          <el-option :label="$t('COMMON.TIMINGTRIGGER')" value="1"></el-option>
          <el-option :label="$t('COMMON.MANUALCONTROL')" value="2"></el-option>
          <el-option :label="$t('COMMON.AUTOMATICCONTROL')" value="3"></el-option>
        </el-select>
      </el-col>
      <el-col :span="6">
        <el-select v-model="params.send_result" :placeholder="$t('COMMON.SELECTSENDRESULTS')" size="medium">
          <el-option :label="$t('COMMON.SUCCESSFUL')" value="1"></el-option>
          <el-option :label="$t('COMMON.FAILURE')" value="2"></el-option>
        </el-select>
      </el-col>
      <el-col :span="14">
        <el-button type="border" size="medium" @click="handleSearch()" class="butStyle"
          >{{ $t("COMMON.SEARCH")}}</el-button
        >
        <el-button type="default" size="medium" @click="handleReset()" class="butStyle">{{ $t("COMMON.RESET")}}</el-button>
      </el-col>
    </el-row>
    <!-- 头 end -->

    <!-- 表 start -->
    <el-table :data="tableData" v-loading="loading">
      <el-table-column :label='$t("COMMON.NUMBERID")' type="index" width="50" align="left"></el-table-column>
      <el-table-column :label='$t("COMMON.BUSINESSNAME1")'  width="270" align="left" prop="business_name">
        <template v-slot="scope">
          <span
            class="cursor-pointer"
            @click="handleSearch({ business_name: scope.row.business_name })"
            >{{ scope.row.business_name }}</span
          >
        </template>
      </el-table-column>
      <el-table-column :label='$t("COMMON.DEVICENAME1")' prop="device_name">
        <template v-slot="scope">
          {{ scope.row.device_name }}
        </template>
      </el-table-column>

      <el-table-column :label='$t("COMMON.DWVICEGROUPNAME1")' prop="asset_name"  width="150">
        <template v-slot="scope">
          <span
            class="cursor-pointer"
            @click="handleSearch({ asset_name: scope.row.asset_name })"
            >{{ scope.row.asset_name }}</span
          >
        </template>
      </el-table-column>

      <el-table-column :label='$t("COMMON.INSTRUCTION1")' prop="instruct">
        <template v-slot="scope">
          {{ scope.row.instruct }}
        </template>
      </el-table-column>
      <el-table-column :label='$t("COMMON.OPERATIONTYPE1")' prop="operation_type">
         <template v-slot="scope">
           <el-tag class="tag-operation-type" v-if="scope.row.operation_type == '1'">{{"定时触发"}}</el-tag>
           <el-tag class="tag-operation-type" v-if="scope.row.operation_type == '2'">{{"手动控制"}}</el-tag>
           <el-tag class="tag-operation-type" v-if="scope.row.operation_type == '3'">{{ $t("COMMON.AUTOMATICCONTROL")}}</el-tag>
<!--           <p class="green" v-if="scope.row.operation_type == '1'"><span>{{"定时触发"}}</span></p>-->
<!--           <p class="green" v-if="scope.row.operation_type == '2'"><span>{{"手动控制"}}</span></p>-->
<!--           <p class="green" v-if="scope.row.operation_type == '3'"><span>{{"自动控制"}}</span></p>-->

        </template>
      </el-table-column>
      <el-table-column :label='$t("COMMON.TRIGGERINGTIME1")' prop="cteate_time" width="145"></el-table-column>
       <!-- <el-table-column :label='$t("COMMON.BUSINESS")' ></el-table-column> -->
       <!-- <div class="text-title">{{ $t("COMMON.BUSINESS") }}：</div> -->
      <el-table-column :label='$t("COMMON.SENDTHERESULIT1")'  prop="send_result" align="center"  width="130">
       
              <template v-slot="scope"  >
                <el-tag class="tag-success" v-if="scope.row.send_result == '1'">{{ $t("COMMON.SUCCESSFUL")}}</el-tag>
                <el-tag class="tag-failed" v-else>{{ $t("COMMON.FAILURE")}}</el-tag>


            </template>
      </el-table-column>
      <el-table-column :label='$t("COMMON.PROTOCOLTYPE1")' prop="protocol_type" align="center"></el-table-column>
    </el-table>
    <!-- 表 end -->

    <div class="text-right py-3">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :current-page.sync="params.page"
        :page-size="params.limit"
        @current-change="getOperationIndex"
      ></el-pagination>
    </div>
  </div>
</template>

<script>
import {
  defineComponent,
  ref,
  onMounted,
  reactive,
} from "@vue/composition-api";
import TableTitle from "@/components/common/TableTitle.vue";
import ApiService from "@/core/services/api.service";
import AUTH from "@/core/services/store/auth.module";
import {is_string} from "@/utils/helpers";
import {local_url} from "../../../api/LocalUrl";
export default defineComponent({
  name: "EquipmentIndex",
  components: {
    TableTitle,
  },
  setup() {
    let tableData = ref([]);
    let loading = ref(false);
    let params = reactive({
      business_name: "",
      per_page: 10,
      current_page: 1,
      asset_name: "",
      operation_type: "",
      send_result: "",
    });
    let total = ref(0);

    onMounted(() => {
      queryValue();
    });

    // 数据查询 /api/conditions/log/index
    const queryValue = () => {
      ApiService.post(local_url + "api/conditions/log/index", params).then(
        ({ data }) => {
          if (data.code == 200) {
            console.log(data.data.data)
            tableData.value = data.data.data;
            total.value = data.data.total;
            loading.value = false
          }
        }
      );
    };
    const handleSearch = (filter) => {
      // 有传参的时候才赋值查询
      if (filter) {
        if ("business_name" in filter && is_string(filter.business_name)) {
          params.business_name = filter.business_name;
        }
        if ("asset_name" in filter && is_string(filter.asset_name)) {
          params.asset_name = filter.asset_name;
        }
        if ("operation_type" in filter && is_string(filter.operation_type)) {
          params.operation_type = filter.operation_type;
        }
        if ("send_result" in filter && is_string(filter.send_result)) {
          params.send_result = filter.send_result;
        }
      }

      params.current_page = 1;
      queryValue();
    };
    const getOperationIndex = (page) => {
        loading.value = true
        params.current_page = page;
        queryValue();
    };
    const handleReset=()=>{
      params.business_name= "";
      params.per_page = 10;
      params.current_page= 1;
      params.asset_name= "";
      params.operation_type= "";
      params.send_result= "";
    }

    return {
      handleReset,
      getOperationIndex,
      queryValue,
      handleSearch,
      tableData,
      loading,
      params,
      total,
    };
  },
});
</script>

<style lang="scss">
.tag-operation-type {
  border: 1px solid;
  background-color: transparent;
}
.tag-success {
  color: #67ff0f;
  border: 1px solid #67ff0f;
  background-color: transparent;
}
.tag-failed {
  color: #cc0000;
  border: 1px solid #cc0000;
  background-color: transparent;
}
.butStyle{
  height: 30px;
  line-height: 10px;
}

.green{
  color: chartreuse;
    border: 1px solid;
    width: 65px;
    height: 24px;
    border-radius: 20px;
  text-align: center;
}
.orange{
  color:orange;
  border: 1px solid;
  width: 45px;
  height: 24px;
  border-radius: 20px;
}
.divStyle{
  text-align: -webkit-center;
}
.el-table-column {
  .el-tag {

  }
}
</style>
