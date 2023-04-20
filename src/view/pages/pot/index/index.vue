<template>
    <div class="rounded card p-4">
      <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3">
        <el-col :span="12">
          <TableTitle>{{ $t('POTTYPE.POTTYPE_MANAGEMENT.POTTYPRLIST') }}</TableTitle>
        </el-col>
        <el-col :span="12" class="px-2 text-right">
          <el-button size="medium" type="border" @click="handleCreate">{{ $t('POTTYPE.POTTYPE_MANAGEMENT.CREATEPOTTYPE') }}</el-button>
        </el-col>
      
      </el-row>
  
      <!-- 筛选 start -->
      <!-- <el-row type="flex" :gutter="20" class="pt-3 pb-4 px-3 el-dark-input">
  
        <el-col :span="12">
          <el-input :placeholder="$t('PRODUCT_MANAGEMENT.PRODUCT_LIST.PRODUCTNUMBER')" v-model="params.serialNumber" clearable></el-input>
        </el-col>
  
        <el-col :span="12">
          <el-button type="border" size="medium" @click="handleSearch">{{ $t('PRODUCT_MANAGEMENT.PRODUCT_LIST.SEARCH') }}</el-button> -->
          <!--      <el-button type="default" size="medium" @click="handleReset()">重置</el-button>-->
        <!-- </el-col>
      </el-row> -->
      <!-- 筛选 end -->
  
      <!-- 表 start -->
      <el-form class="inline-edit">
        <el-table :data="tableData" v-loading="loading">
  
          <!-- 锅型ID-->
          <el-table-column :label="$t('POTTYPE.POTTYPE_MANAGEMENT.POTTYPEID')" prop="PotTypeId" align="left">
  
          </el-table-column>
  
          <!-- 锅型名称-->
          <el-table-column :label="$t('POTTYPE.POTTYPE_MANAGEMENT.POTNAME')" prop="Name" align="left">
  
          </el-table-column>
  
          <!-- 图片-->
          <el-table-column :label="$t('POTTYPE.POTTYPE_MANAGEMENT.POTIMAGE')" prop="Image" align="left">
            <template v-slot:default="scope">
                 <el-image style="width: 100px; height: 100px" :src="scope.row.Image"/>
            </template>
          </el-table-column>
  
          <!-- 操作列-->
          <el-table-column align="left" :label="$t('POTTYPE.POTTYPE_MANAGEMENT.OPERATION')" width="230">
            <template v-slot="scope">
              <div style="text-align: left">
                <el-button type="indigo" size="mini" class="mr-3" @click="handleEdit(scope.row)">编辑</el-button>
                <el-popconfirm :title="$t('AUTOMATION.TITLE4')" @confirm="handleDelete(scope.row)">
                  <el-button slot="reference" size="mini" type="danger">{{ $t('POTTYPE.POTTYPE_MANAGEMENT.DELETE') }}</el-button>
                </el-popconfirm>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <!-- 表 end -->
  
      <div class="text-right py-3">
        <el-pagination
            background
            layout="prev, pager, next"
            :total="params.total"
            :current-page.sync="params.current_page"
            :page-size="params.per_page"
            @current-change="getProductList"></el-pagination>
      </div>

      <el-dialog class="el-dark-dialog el-dark-input"
               :visible.sync="createDialogVisible"
               @closed="createDialogVisible = false"
               :close-on-click-modal="false"
               :title="$t('POTTYPE.POTTYPE_MANAGEMENT.POTTYPEMANAGEMENT')"
               width="600px">
      <el-form :model="formData"
               label-position="right"
               label-width="140px"
               :inline="false"
      >
        <el-input type="hidden" v-model="formData.Id"></el-input>

        <el-form-item :label="$t('POTTYPE.POTTYPE_ADD.POTNAME')" prop="name">
            <el-input v-model="formData.Name"></el-input>
          </el-form-item>

          <el-form-item :label="$t('POTTYPE.POTTYPE_ADD.POTID')" prop="pot_type_id">
            <el-input v-model="formData.PotTypeId"></el-input>
          </el-form-item>
  
  
        <el-form-item :label="$t('POTTYPE.POTTYPE_ADD.POTIMAGE')" prop="image">
          <div >
            <el-upload
                        class="upload-logo"
                        :action="url + 'api/file/up'"
                        :show-file-list="false"
                        :headers="headersObj"
                        :data="params"
                        :on-success="handleAvatarSuccess"
                        :before-upload="beforeAvatarUpload"
                        :on-preview="mainImagePreview"
                      >
                        <el-button
                          type="primary"
                          icon="el-icon-refresh"
                          size="mini"
                          
                          >{{$t('SYSTEM_MANAGEMENT.SYSTEM_SETTING.CHANGE')}} 图片</el-button
                        >
                        <img width="80px" height="80px" v-if="formData.Image" id="mainImageUrl" :src="formData.Image"/>
            </el-upload>
          </div>
  
       </el-form-item>

       <el-form-item :label="$t('POTTYPE.POTTYPE_ADD.SOUPSTANDARD')" prop="SoupStandard">
            <el-input-number v-model="formData.SoupStandard"></el-input-number>
          </el-form-item>
  

        <div style="display: flex;justify-content: center">
          <el-button type="cancel" @click="onCancel">{{ $t('SYSTEM_MANAGEMENT.CANCEL') }}</el-button>
          <el-button type="save" @click="onSubmit">{{ $t('SYSTEM_MANAGEMENT.CONFIRM') }}</el-button>
        </div>

      </el-form>
    </el-dialog>

    </div>
  </template>
  
  <script>
  import TableTitle from "@/components/common/TableTitle.vue"
  import PotAPI from "@/api/pot.js"
  import JwtService from "@/core/services/jwt.service";
  import { local_url } from "@/api/LocalUrl"
  import {message_success} from "../../../../utils/helpers";
  import {dateFormat} from "@/utils/tool";
  
  export default {
    name: "index",
    components: { TableTitle },
    data() {
      return {
        url: local_url,
        tableData: [],
        loading: false,
        dialogVisible:false,
        formData: {},
        createDialogVisible: false,
        params: {
          total: 0,
          current_page: 1,
          per_page: 10,
          type: "logo",
        },
        headersObj: {
      Authorization: "Bearer " + JwtService.getToken(),
    },
      }
    },
    mounted() {
      this.getProductList();
    },
    methods: {
      handleAvatarSuccess(res, file) {
      this.formData.Image = res.data;
    },
   
    mainImagePreview(file) {
      console.log(file.url)
        this.formData.Image = file.url
        this.dialogVisible = true
      },
      
      /**
       * 获取产品列表
       */
      getProductList() {
        PotAPI.page(this.params)
          .then(({ data }) => {
            if (data.code == 200) {
              this.tableData = data.data.data.map(item => {
                item.created = dateFormat(item.created_time)
                return item;
              })
            }
          })
      },
      handleSearch() {
        this.getProductList();
      },
      /**
       * 打开创建锅型对话框
       */
      handleCreate() {
        this.createDialogVisible = true;
      },

      handleEdit(row) {
        PotAPI.getOne({
        "current_page": 1,
        "per_page": 10,
        "id": row.Id
      }).then(({data}) => {
          if (data.code == 200) {
            this.formData = data.data.data[0]
          }
        })
      this.createDialogVisible = true
    },
      
      handleDelete(item) {
        PotAPI.del({id: item.Id })
          .then(({data}) => {
            if (data.code == 200) {
              message_success("删除成功");
              this.getProductList();
            }
            console.log(data)
          })
      },

      onSubmit() {
        // saveOrUpdate
        PotAPI.saveOrUpdate(this.formData.Id ? "edit":"add", this.formData)
            .then(({ data }) => {
              if (data.code == 200) {
                this.createDialogVisible = false
                message_success("操作成功")
                this.getProductList();
              }
            })
    },

    onCancel() {
      this.formData = {}
      this.createDialogVisible = false
    },
    beforeAvatarUpload(file) {
      // 上传前设置请求头，因为 token 会刷新
      this.headersObj.Authorization = "Bearer " + JwtService.getToken()
      // console.log('111',file);
      return true;
    },
    }
  }
  </script>
  
  <style scoped>
  .el-tag--plain {
    color: #5B92FF !important;
    background-color: transparent !important;   
    border-color: #5B92FF !important;
  }
  </style>