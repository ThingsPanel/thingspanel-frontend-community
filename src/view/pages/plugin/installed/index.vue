<template>
    <div class="content-form">
      <el-form label-position="left" label-width="120px">
           <el-form-item label="插件类型：">
             <el-radio-group v-model="params.pluginType" size="small" @change="handlePluginTypeChanged">
               <el-radio-button :label="pluginType.Device">设备插件</el-radio-button>
               <el-radio-button :label="pluginType.Script">解析脚本</el-radio-button>
               <el-radio-button :label="pluginType.NodRed">规则引擎代码</el-radio-button>
               <el-radio-button :label="pluginType.Protocol">协议插件</el-radio-button>
               <el-radio-button :label="pluginType.Visual">可视化插件</el-radio-button>
             </el-radio-group>
            </el-form-item>

             <el-form-item label="搜索：">
                <el-row>
                  <el-col :span="20">
                    <div class="flex">
                      <el-input style="margin-right: 10px;width: 200px" size="small" clearable v-model="searchValue" :placeholder="$t('PLUGIN.TAB1_CONTENT.PLACEHOLDER')"></el-input>
                      <el-button icon="el-icon-refresh" class="primary el-button--indigo" size="mini"
                             :loading="refreshBtnLoading" @click="loadList">{{ $t('PLUGIN.TAB1_CONTENT.SEARCH') }}</el-button>
                    </div>
                    
                  </el-col>

                  <el-col :span="4" class="flex">
                    <el-button :class="params.displayMode=='grid'? 'isActive' : ''" type="border" size="mini" icon="el-icon-s-grid"
                      @click="handleChangeDisplayMode('grid')"></el-button>

                    <el-button :class="params.displayMode=='table'? 'isActive' : ''" type="border" size="mini" icon="el-icon-s-unfold"
                      @click="handleChangeDisplayMode('table')"></el-button>
                  </el-col>
                </el-row>
             </el-form-item>
      </el-form>

      <div v-if="params.displayMode==='grid'" v-loading="listLoadig">
        <div class="width-20" v-for="(item,index) in listArr" :key="index">
          <PluginCard :key="item.id" :data="item" :isInstalled="true" :category="category"
                      @export="handleExportPlugin"
                      @edit="handleEditPlugin"
                      @delete="handleDelPlugin"
          ></PluginCard>
        </div>
      </div>

      <div v-else>
        <!-- 表 start -->
        <el-form class="inline-edit">
          <el-table :data="listArr" v-loading="listLoadig">

            <!-- 名称 -->
            <el-table-column label="名称" prop="name" align="left"></el-table-column>

            <el-table-column label="作者"  prop="author" align="left"></el-table-column>

            <el-table-column label="说明"  prop="describe" align="left"></el-table-column>

            <el-table-column label="插件分类"  prop="devicePluginTypeLabel" align="left"></el-table-column>


            <!-- 操作列-->
            <el-table-column align="left" :label="$t('PLUGIN.TAB2_CONTENT.OPERATION')" width="240">
              <template v-slot="scope">
                <div style="text-align: left">

                  <login-store :visible.sync="loginStoreDialogVisible"/>
                  <el-button slot="reference" size="mini" type="border" @click="handleEditPlugin(scope.row)">编辑</el-button>
                  <el-button slot="reference" size="mini" type="border" @click="handleExportPlugin(scope.row)">导出</el-button>

                  <el-popconfirm :title="$t('PLUGIN.TAB2_CONTENT.TITLE4')" @confirm="handleDelete(scope.row)">
                    <el-button slot="reference" size="mini" type="danger">卸载</el-button>
                  </el-popconfirm>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-form>
        <!-- 表 end -->
      </div>
      

      <div class="text-right py-3">
        <el-pagination
            background
            layout="prev, pager, next"
            :total="params.total"
            :current-page.sync="params.current_page"
            :page-size="params.per_page"
            @current-change="loadList"></el-pagination>
      </div>

      <!-- 导出JSON-->
      <export-plugin :visible.sync="exportDialogVisible" :jsonObj="exportPluginJson"></export-plugin>
    </div>
</template>

<script>
import PluginCard from "./PluginCard";
import PluginAPI from "@/api/plugin.js";
import { getCustomExchangeAgreementList } from "@/api/device";
import ProtocolPlugin from "@/api/protocolPlugin.js";
import LoginStore from '@/view/pages/auth/LoginStore';

import ExportPlugin from "./ExportPlugin"
import { PluginType, Wash } from "../Const"
export default {
  name: "PluginList",
  components: {PluginCard, LoginStore, ExportPlugin},
  data() {
    return {
      loading: false,
      listLoadig: false,
      pluginType: PluginType,
      params: {
        total: 0,
        current_page: 1,
        per_page: 10,
        pluginType: PluginType.Device,
        installationStatus: "all",
        displayMode: "grid"
      },
      list: [],
      listArr: [],
      searchValue: '',
      category: [],
      refreshBtnLoading: false,
      loginStoreDialogVisible: false,
      exportDialogVisible: false,
      exportPluginJson: {}
    }
  },
  created() {
    this.loadList();
  },
  watch: {
    searchValue(newVal) {
      this.debounce(this.searchPlugin, 500, newVal)
    }
  },
  methods: {
    /**
     * 加载插件列表
     */
    loadList() {
      switch (this.params.pluginType) {
        case PluginType.Device: {
          this.loadDevicePluginList();
          break;
        }
        case PluginType.Script: {
          this.loadScriptPluginList();
          break;
        }
        default: {
          this.listArr = [];
        }
      }
    },
    /**
     * 获取设备插件列表
     */
    loadDevicePluginList() {
      // 加载插件列表
      PluginAPI.page(this.params)
        .then(({data}) => {
          if (data.code == 200) {
            this.params.total = data.data?.total || 0;
            this.params.current_page = data.data?.current_page || 1;
            this.params.per_page = data.data?.per_page || 10;
            let pluginList = data.data?.data || [];
            this.listArr = pluginList.map(item => Wash.device.fromTP(item))
            this.refreshBtnLoading = false;
          }
        })
    },
    /**
     * @description: 获取协议插件列表
     * @return {*}
     */    
    loadProtocolPluginList() {
      ProtocolPlugin.page(this.params)
          .then(({ data }) => {
            if (data.code == 200) {
              this.loading = false;
              this.params = data.data;
            }
          })
    },
    /**
     * @description: 获取脚本插件列表
     * @return {*}
     */    
    loadScriptPluginList() {
      this.loading = true;
      getCustomExchangeAgreementList(this.params)
          .then(({ data }) => {
            if (data.code == 200) {
              this.params.total = data.data?.total || 0;
              this.params.current_page = data.data?.current_page || 1;
              this.params.per_page = data.data?.per_page || 10;
              let pluginList = data.data?.data || [];
              this.listArr = pluginList.map(item => Wash.script.fromTP(item))
              consolelog("getCustomExchangeAgreementList", this.listArr)
              this.refreshBtnLoading = false;
            }
          })
    },
    /**
     * @description: 编辑
     * @param {*} item
     * @return {*}
     */    
    handleEditPlugin(item) {
      if (item.pluginType === PluginType.Device) {
        this.$emit("edit", item);
      }
    },
    /**
     * @description: 导出
     * @param {*} item
     * @return {*}
     */    
    handleExportPlugin(item) {
      this.exportPluginJson = item.chart_data || item.jsonData;
      this.exportDialogVisible = true;
    },
    /**
     * @description: 删除
     * @param {*} item
     * @return {*}
     */    
    handleDelPlugin(item) {
      this.load();
    },
    searchPlugin(value) {
      if (value == "") {
        this.listArr = this.list;
      } else {
        this.listArr = this.list.filter(item => item.name.indexOf(this.searchValue) > -1);
      }
    },
    handleChangeDisplayMode(mode) {
      this.params.displayMode = mode;
    },
    /**
     * 插件类型
     * @param v
     */
    handlePluginTypeChanged(v) {
      console.log("handlePluginTypeChanged", v)
      switch (v) {
        case "device": {

          break;
        }
      }
      this.loadList();
    },
    handleInstallPlugin(item) {
      const isAuth = this.$store.getters.getStoreAuthenticated;

      if (isAuth) {
        // 安装
        console.log("安装", isAuth)
      } else {
        // 登录
        this.loginStoreDialogVisible = true;
      }
    },
    /**
     * 防抖
     * @param callback
     * @param delay
     * @param value
     */
    debounce: function (callback, delay, value) {
      if (timer == 1) return;
      setTimeout(() => timer = null, delay)
      timer = 1;
      callback(value);
    }
  }
}
let timer = null;
</script>

<style scoped>
.el-form-item {
  margin-bottom: 0;
}
::v-deep .el-button--border.isActive {
  background-color: #6573e0 !important;
  border-color: #6573e0 !important;
}
.width-20 {
  width: 20%;
  display: inline-block;
  padding: 10px;
}


@media (max-width: 1500px) {
  .width-20 {
    width: 25%;
  }
}

@media (max-width: 1424px) {
  .width-20 {
    width: 33%;
  }
}

@media (max-width: 1160px) {
  .width-20 {
    width: 50%;
    display: inline-block;
    padding: 10px;
  }
}

@media (max-width: 580px) {
  .width-20 {
    width: 100%;
    display: block;
    padding: 0px;
  }
}
</style>