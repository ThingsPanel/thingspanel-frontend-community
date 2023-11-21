<template>
  <div class="rounded p-4 card no-border v-application my-v-input" data-app="true">
      <v-snackbar v-model="snackbar" top :vertical="vertical">
        {{ text }}

        <template v-slot:action="{ attrs }">
          <v-btn color="indigo" text v-bind="attrs" @click="snackbar = false">
            Close
          </v-btn>
        </template>
      </v-snackbar>
    <div class="system-box">
      <p class="tab-title">
        <span
          v-for="(item, index) in tabs"
          :key="index"
          :class="{ active: item.value == activeTab }"
          @click="activeTab = item.value"
        >
          {{ $t(item.name) }}
        </span>
      </p>
      <div class="content">
        <div v-if="activeTab == 1">
          <!-- 系统设置 -->
          <p style="font-size: 1.3rem; padding: 2rem 0">
            {{ formObj.system_name }}
          </p>
          <div class="content-form">
            <el-form
              :label-position="'left'"
              label-width="120px"
              :model="formObj"
            >
              <el-form-item :label="$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.SYSTEMTITLE')">
                <el-input
                  style="width: 328px"
                  v-model="formObj.system_name"
                  :placeholder="$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.PLACEHOLDER1')"
                ></el-input>
              </el-form-item>
              <el-form-item :label="$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.THEMECOLOR')">
                <el-select
                  v-model="formObj.theme"
                  :placeholder="$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.PLACEHOLDER2')"
                  style="width: 328px"
                >
                  <el-option :label="$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.BLUE')" value="blue"></el-option>
                  <el-option :label="$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.WHITE')" value="white"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item size="large">
                <div class="img-upload">
                  <div style="margin-right: 2.5rem">
                    <p>{{$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.HOMEANDBACKEND')}} logo</p>
                    <div>
                      <img :src="url + formObj.logo_one" alt="" />
                    </div>
                    <p>
                      <el-upload
                        class="upload-logo"
                        :action="url + 'api/file/up'"
                        :show-file-list="false"
                        :headers="headersObj"
                        :data="params"
                        :on-success="handleAvatarSuccess"
                        :before-upload="beforeAvatarUpload"
                      >
                        <el-button
                          type="primary"
                          icon="el-icon-refresh"
                          size="mini"
                          
                          >{{$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.CHANGE')}} logo</el-button
                        >
                      </el-upload>
                    </p>
                  </div>
                  <div style="margin-right: 2.5rem">
                    <p>{{$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.LOADINGPAGE')}} logo</p>
                    <div>
                      <img :src="url + formObj.logo_two" alt="" width="148px" />
                    </div>
                    <p>
                      <el-upload
                        class="upload-logo"
                        :action="url + 'api/file/up'"
                        :show-file-list="false"
                        :headers="headersObj"
                        :data="params"
                        :on-success="handleAvatarSuccessTwo"
                        :before-upload="beforeAvatarUpload"
                      >
                        <el-button
                          type="primary"
                          icon="el-icon-refresh"
                          size="mini"
                          >{{$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.CHANGE')}} logo</el-button
                        >
                      </el-upload>
                    </p>
                  </div>
                  <div style="margin-right: 2.5rem">
                    <p>{{$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.WEBSITE')}} logo</p>
                    <div>
                      <img :src="url + formObj.logo_three" alt="" width="148px" />
                    </div>
                    <p>
                      <el-upload
                        class="upload-logo"
                        :action="url + 'api/file/up'"
                        :show-file-list="false"
                        :headers="headersObj"
                        :data="params"
                        :on-success="handleAvatarSuccessThree"
                        :before-upload="beforeAvatarUpload"
                      >
                        <el-button
                          type="primary"
                          icon="el-icon-refresh"
                          size="mini"
                          >{{$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.CHANGE')}} logo</el-button
                        >
                      </el-upload>
                    </p>
                  </div>
                  <div>
                    <p>{{$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.BACKGROUND')}}</p>
                    <div>
                      <img :src="formObj.home_background ? url + formObj.home_background : '/media/bg/bg-12.png'"
                           alt="" width="148px" />
                    </div>
                    <p>
                      <el-upload
                          class="upload-logo"
                          :action="url + 'api/file/up'"
                          :show-file-list="false"
                          :headers="headersObj"
                          :data="params"
                          :on-success="handleAvatarSuccessFour"
                          :before-upload="beforeAvatarUpload"
                      >
                        <el-button
                            type="primary"
                            icon="el-icon-refresh"
                            size="mini"
                        >{{$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.CHANGE')}}</el-button
                        >
                      </el-upload>
                    </p>
                  </div>
                </div>
              </el-form-item>
            </el-form>
          </div>
          <div style="padding-left: 120px; margin-bottom: 20px;">
            <el-button type="save" @click="submitData()">{{$t('SYSTEM_MANAGEMENT.SAVE')}} </el-button>
          </div>
        </div>
        <div v-if="activeTab == 2">
          
          <el-table :data="tableData" v-loading="tableLoading">
              <!-- id -->
              <el-table-column :label="$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.ID')" type="index" align="left" min-width="110" width="200">
              </el-table-column>

              <!-- 清理类型 -->
              <el-table-column :label="$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.CLEANUP_TYPE')" prop="cleanup_type" align="left">
                  <template v-slot="scope">
                    <el-tag type="primary" class="transparent-tag-blue" v-if="scope.row.cleanup_type === 1">{{ $t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.DEVICE_DATA') }}</el-tag>
                    <el-tag type="success"  class="transparent-tag-green" v-if="scope.row.cleanup_type === 2">{{ $t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.OPERATION_LOG') }}</el-tag>
                  </template>
              </el-table-column>

              <!-- 保留天数 -->
              <el-table-column :label="$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.RETENTION_DAYS')" prop="retention_days" align="left">
              </el-table-column>

              <!-- 上次清理时间 -->
              <el-table-column :label="$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.LAST_CLEANUP_TIME')" prop="last_cleanup_time" align="left">
                  <template v-slot="scope">
                      {{ scope.row.last_cleanup_time ? formatTimestamp(scope.row.last_cleanup_time) : "" }}
                  </template>
              </el-table-column>

              <!-- 上次清理数据时间节点 -->
              <el-table-column :label="$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.LAST_CLEANUP_DATA_TIME')" prop="last_cleanup_data_time" align="left">
                  <template v-slot="scope">
                      {{ scope.row.last_cleanup_data_time ? formatTimestamp(scope.row.last_cleanup_data_time) : "" }}
                  </template>
              </el-table-column>

              <!-- 备注 -->
              <el-table-column :label="$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.REMARK')" prop="remark" align="left">
              </el-table-column>

              <!-- 操作 -->
              <el-table-column align="left" :label="$t('COMMON.OPERATION')" width="230">
                  <template v-slot="scope">
                      <div style="text-align: left">
                          <!-- 编辑 -->
                          <el-button type="indigo" size="mini" @click="handleEdit(scope.row)">{{ $t('COMMON.EDIT') }}</el-button>
                      </div>
                  </template>
              </el-table-column>

              <template #empty>
                  <div>{{ $t('COMMON.TABLE_NO_DATA') }}</div>
              </template>
          </el-table>
        </div>
        <!-- <div v-if="activeTab == 3">
          <p>系统授权</p>
        </div> -->
      </div>
    </div>

    <!-- 编辑对话框 start -->
    <el-dialog class="el-dark-dialog" :title="$t('COMMON.EDIT')" width="600px" :visible.sync="editVisible">
        <el-form class="console-create-form el-dark-input" label-position="left"  label-width="100px" 
            ref="createFormRef" :model="formData">

            <!-- 保留天数 -->
            <el-form-item :label="$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.RETENTION_DAYS')" prop="retention_days">
                <el-input type="number" style="width: 280px" v-model.number="formData.retention_days"></el-input>
            </el-form-item>
            
            <!-- 备注 -->
            <el-form-item :label="$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.REMARK')" prop="remark">
                <el-input type="textarea" :rows="3" style="width: 280px" v-model="formData.remark"></el-input>
            </el-form-item>

        </el-form>
        <div class="dialog-footer" style="text-align: center;">
            <el-button type="primary" @click="sumbitEdit">{{ $t('COMMON.EDIT') }}</el-button>
        </div>
    </el-dialog>
    <!-- 编辑对话框 end -->


  </div>
</template>


<script>
import { local_url } from "@/api/LocalUrl"
import ApiService from "@/core/services/api.service";
import JwtService from "@/core/services/jwt.service";
import { get_cleanup_list, edit_cleanup_data } from "@/api/system";
import { REFRESH } from "@/core/services/store/auth.module";
import { RESET_LAYOUT_CONFIG } from "@/core/services/store/config.module"
import "@/core/mixins/common"
import { message_success } from "@/utils/helpers.js";


export default {
  data: () => ({
    activeTab: "1",
    tabs: [
      {
        name: "SYSTEM_MANAGEMENT.GENERALSETTINGS",
        value: "1",
      },
      {
        name: "SYSTEM_MANAGEMENT.DATA_CLEANUP_SETTINGS",
        value: "2",
      },
      {
        name: "SYSTEM_MANAGEMENT.SYSTEMAUTHORIZATION",
        value: "3",
      },
    ],
    url: local_url,
    formObj: {
      custom_id: "",
      id: "",
      logo_one: "",
      logo_three: "",
      logo_two: "",
      remark: "",
      system_name: "",
      theme: "",
    },
    headersObj: {
      Authorization: "Bearer " + JwtService.getToken(),
    },
    params: {
      type: "logo",
    },
    text:'',
    snackbar:false,
    vertical: true,
    tableData: [],
    tableLoading: false,
    formData: {
      id: "",
      retention_days: 0,
      remark: "",
    },
    editVisible: false,
  }),

  created() {
    ApiService.post(local_url + "api/system/logo/index", null).then(
      ({ data }) => {
        if (data.code == 200) {
          this.formObj = Object.assign({}, data.data);

          console.log("====formObj", this.formObj)
        } else if (data.code == 401) {
          this.$store.dispatch(REFRESH).then(() => {});
        } else {
          //
        }
      }
    );
  },
  watch: {
    activeTab(val) {
      if (val === "2") {
        this.getCleanUpList();
      }
    }
  },

  methods: {
    handleAvatarSuccess(res, file) {
      console.log(res,file);
      this.formObj.logo_one = res.data;
    },
    handleAvatarSuccessTwo(res, file) {
      this.formObj.logo_two = res.data;
    },
    handleAvatarSuccessThree(res, file) {
      this.formObj.logo_three = res.data;
    },
    handleAvatarSuccessFour(res, file) {
      this.formObj.home_background = res.data;
    },
    beforeAvatarUpload(file) {
      // 上传前设置请求头，因为 token 会刷新
      this.headersObj.Authorization = "Bearer " + JwtService.getToken()
      // console.log('111',file);
      return true;
    },
    submitData() {
      ApiService.post(local_url + "api/system/logo/update", this.formObj).then(
        ({ data }) => {
          if (data.code == 200) {
              this.text = "保存成功！";
              this.$store.dispatch(RESET_LAYOUT_CONFIG);
              this.snackbar = true;
          } else if (data.code == 401) {
              this.$store.dispatch(REFRESH).then(() => {});
          } else {
          }
        }
      );
    },
    getCleanUpList(){
      this.tableLoading = true;
      get_cleanup_list().then(({data}) => {
        if (data.code == 200) {
          this.tableData = data.data;
        }
      }).finally(() => {
        this.tableLoading = false;
      })

    },
    formatTimestamp(timestamp) {
      if (!timestamp) {
        return '';
      }

      // Determine the length of the timestamp
      const length = timestamp.toString().length;

      // Convert to milliseconds
      if (length === 10) { // seconds
        timestamp *= 1000;
      } else if (length === 16) { // microseconds
        timestamp /= 1000;
      }

      // Create a Date object
      const date = new Date(timestamp);

      // Format the date
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    handleEdit(v) {
      this.editVisible = true;
      let data = JSON.parse(JSON.stringify(v));
      this.formData = {
        id: data.id,
        retention_days: data.retention_days,
        remark: data.remark,
      }
    },
    sumbitEdit() {
      this.tableLoading = true;
      edit_cleanup_data(this.formData).then(({data}) => {
        if (data.code == 200) {
          message_success(this.$t('COMMON.EDIT_SUCCESS'));
          this.editVisible = false;
          this.getCleanUpList();
        }
      }).finally(() => {
        this.tableLoading = false;
      })
    },
  },
};
</script>
<style lang="scss" scoped>
.system-box {
  color: #fff;
  p {
    margin: 0;
  }
  .tab-title {
    font-size: 1.3rem;
    border-bottom: 1px solid #f6f6f613;
    padding: 0 1rem;
    span {
      display: inline-block;
      padding: 0.6rem 0 1.4rem;
      margin-right: 5rem;
      cursor: pointer;
      &.active {
        border-bottom: 2px solid #5b92ff;
      }
    }
  }
  .content {
    padding: 0 1rem;
    & > p {
      font-size: 14px;
    }
    &-form {
      ::v-deep .el-form-item__label {
        color: #fff;
      }
    }
  }
  .img-upload {
    display: flex;
    img {
      width: 140px;
      height: 140px;
      object-fit: contain;
    }
    ::v-deep .el-button {
      width: 100%;
      margin-top: 1rem;
      background: #212d66;
      border-color: #212d66;
    }
    ::v-deep .el-upload{
      width: 100%;
    }
  }
}
.transparent-tag-green {
  background-color: transparent !important;
  border-color: #67c23a;
}
.transparent-tag-blue {
  background-color: transparent !important;
  border-color: #409EFF;
}
.console-create-form {
    margin: 30px 12%;
    .el-radio {
        line-height: 40px;
    }
}
</style>