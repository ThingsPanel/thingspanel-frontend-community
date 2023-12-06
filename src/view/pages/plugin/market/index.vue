<template>
    <div class="content-form">
      <el-form label-position="left" label-width="120px">
           <el-form-item :label="$t('PLUGIN.TAB1_CONTENT.PLUGIN_TYPE') + ': '">
             <el-radio-group v-model="params.pluginType" size="small" @change="handlePluginTypeChanged">
               <el-radio-button label="device">{{ $t("PLUGIN.TAB1_CONTENT.DEVICE_PLUGIN") }}</el-radio-button>
               <el-radio-button label="script">{{ $t("PLUGIN.TAB1_CONTENT.ANALYSIS_SCRIPT") }}</el-radio-button>
               <el-radio-button label="nodeRed">{{ $t("PLUGIN.TAB1_CONTENT.RULE_ENGINE") }}</el-radio-button>
               <el-radio-button label="protocol">{{ $t("PLUGIN.TAB1_CONTENT.PROTOCOL_PLUGIN") }}</el-radio-button>
               <el-radio-button label="visual">{{ $t("PLUGIN.TAB1_CONTENT.VISUAL_PLUGIN") }}</el-radio-button>
             </el-radio-group>
            </el-form-item>

             <el-form-item :label="$t('COMMON.SEARCH') + ': '">
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
          <PluginCard :key="item.storeId" :data="item" :isInstalled="true" :category="category"
                      :pluginType="params.pluginType"
                      @edit="handleEditPlugin"
                      @delete="handleDelPlugin"
                      @install="handleInstallPlugin"
          ></PluginCard>
        </div>
      </div>

      <div v-else>
        <!-- 表 start -->
        <el-form class="inline-edit">
          <el-table :data="listArr" v-loading="listLoadig">

            <!-- 名称 -->
            <el-table-column :label="$t('PLUGIN.TAB2_CONTENT.NAME')" prop="name" align="left"></el-table-column>

            <el-table-column :label="$t('PLUGIN.TAB2_CONTENT.AUTHOR')"  prop="author" align="left"></el-table-column>

            <el-table-column :label="$t('PLUGIN.TAB2_CONTENT.DESCRIBE')"  prop="describe" align="left"></el-table-column>

            <el-table-column :label="$t('PLUGIN.TAB2_CONTENT.PLUGIN_TYPE')"  prop="devicePluginTypeLabel" align="left"></el-table-column>


            <!-- 操作列-->
            <el-table-column align="left" :label="$t('PLUGIN.TAB2_CONTENT.OPERATION')" width="240">
              <template v-slot="scope">
                <div style="text-align: left">
                  <el-button slot="reference" size="mini" type="border" @click="handleInstallPlugin(scope.row)">{{ $t('PLUGIN.TAB2_CONTENT.INSTALL') }}</el-button>
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
            :total="total"
            :current-page.sync="params.page"
            :page-size="params.pageSize"
            @current-change="loadList"></el-pagination>
      </div>

      <login-store :visible.sync="loginStoreDialogVisible" :login="loginCallback"/>
    </div>
</template>

<script>
import PluginCard from "./PluginCard";
import PluginAPI from "@/api/plugin.js";
import LoginStore from '@/view/pages/auth/LoginStore';
import StoreAPI from "@/api/store"
import { Wash, PluginType } from "../Const";
import { addCustomExchangeAgreement } from "@/api/device"
export default {
  name: "PluginList",
  components: {PluginCard, LoginStore},
  data() {
    return {
      loading: false,
      listLoadig: false,
      total: 12,
      params: {
        page: 1,
        pageSize: 10,
        pluginType: "device",
        installationStatus: "all",
        displayMode: "grid"
      },
      list: [],
      listArr: [],
      searchValue: '',
      category: [],
      refreshBtnLoading: false,
      loginStoreDialogVisible: false,
      loginCallback: () => {}
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
      if (StoreAPI.list[this.params.pluginType]) {
        this.refreshBtnLoading = true;
        this.listLoading = true;
        this.listArr = [];
        const params = {
          page: this.params.page,
          pageSize: this.params.pageSize,
          approvalFlag: 1,
          pluginName: this.searchValue
        }
        StoreAPI.list[this.params.pluginType](params)
          .then(({data: result}) => {
            if (result.code === 0) {
              const list = result.data?.list || [];
              this.total = result.data?.total || 0;
              this.listArr = list.map(item => Wash[this.params.pluginType]?.fromStore(item) || []);
            }
          })
          .finally(() => {
            this.refreshBtnLoading = false;
            this.listLoading = false;
          })
      } else {
        this.listArr = [];
      }
    },
    handleEditPlugin(item) {
      this.$emit("edit", item);
    },
    handleDelPlugin(item) {
      this.load();
    },
    searchPlugin(value) {
      this.loadList();
    },
    handleChangeDisplayMode(mode) {
      this.params.displayMode = mode;
    },
    /**
     * 插件类型
     * @param v
     */
    handlePluginTypeChanged(v) {
      switch (v) {
        case "device": {

          break;
        }
      }
      this.loadList();
    },
    handleInstallPlugin(item, cb) {
      const isAuth = this.$store.getters.getStoreAuthenticated;
      if (isAuth) {
        // 安装
        switch(item.pluginType) {
          case PluginType.Device: {
            // 安装设备插件
            this.installDevicePlugin(item, cb);
            break;
          }
          case PluginType.Script: {
            // 安装脚本插件
            this.installScriptPlugin(item, cb)
            break;
          }
        }
      } else {
        // 登录
        this.loginCallback = cb;
        this.loginStoreDialogVisible = true;
      }
    },
    /**
     * @description: 安装设备插件
     * @param {*} item
     * @param {*} callback
     * @return {*}
     */    
    async installDevicePlugin(item, callback) {
      try {
        let {data: res1} = await StoreAPI.get.device({id: item.storeId});
        if (res1 === 0) throw new Error("获取插件失败！")
        const data = res1.data.rePluginDevice;
        const params = {
          model_type: data.devicePluginType + "",
          chart_data: data.dataResource,
          model_name: data.pluginName,
          version: data.versionNumber,
          author: data.pluginAuthor
        }
        const {data: res2 } = await PluginAPI.add(params);
        if (res2.code !== 200) throw new Error("安装失败！")
        callback({ code: 200, data, msg: "安装成功！" })
      } catch(err) {
        callback({ code: 401, data, msg: err.message })
      }
    },
    /**
     * @description: 安装脚本插件
     * @param {*} item
     * @param {*} callback
     * @return {*}
     */    
    installScriptPlugin(item, callback) {
      let data = {
        protocol_type: item.protocol_type,
        script_name: item.name,
        company: item.name,
        product_name: item.name,
        script_content_a: item.uplinkScript,
        script_content_b: item.downlinkScript,
        remark: item.describe,
        device_type: item.scriptPluginType
      };
      addCustomExchangeAgreement(data)
        .then(({ data: result }) => {
          if (result.code === 200) {
            callback({ code: 200, msg: "安装成功!"})
          }
        })
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