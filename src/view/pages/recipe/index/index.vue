<template>
  <div class="rounded card p-4">
    <!-- 头 start -->
    <el-row type="flex" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t('RECIPEMANAGEMENT.RECIPE_LIST.RECIPTLIST') }}</TableTitle>
      </el-col>
      <el-col :span="12" class="text-right">
        <!-- 添加权限按钮 -->
        <el-button size="medium" type="indigo" @click="handleAdd" :disabled="!hasAuth('sys:permission:add')">{{ $t('RECIPEMANAGEMENT.CREATERECIPE') }}</el-button>
        <el-button size="medium" type="border" @click="showSendToMQTTVisity">下发配置</el-button>
      </el-col>
    </el-row>
    <!-- 头 end -->

    <!-- 表 start -->
    <el-table :data="tableData" v-loading="loading" row-key="id">
      <el-table-column type="index"></el-table-column>
      <el-table-column :label="$t('RECIPEMANAGEMENT.RECIPE_LIST.BOTTOMPOTID')" prop="BottomPotId"></el-table-column>
      <el-table-column :label="$t('RECIPEMANAGEMENT.RECIPE_LIST.BOTTOMPOT')" prop="BottomPot"></el-table-column>
      <el-table-column :label="$t('RECIPEMANAGEMENT.RECIPE_LIST.POTTYPID')" prop="PotTypeId"></el-table-column>
      <el-table-column :label="$t('RECIPEMANAGEMENT.RECIPE_LIST.POTTYPE')" prop="PotTypeName"></el-table-column>
      <el-table-column :label="$t('RECIPEMANAGEMENT.RECIPE_LIST.MATERIAL')" prop="Materials"></el-table-column>
      <el-table-column :label="$t('RECIPEMANAGEMENT.RECIPE_LIST.TASTE')" prop="Taste"></el-table-column>
      <el-table-column :label="$t('RECIPEMANAGEMENT.RECIPE_LIST.BOTTOMPROPERTIES')" prop="BottomProperties"></el-table-column>

      <el-table-column :label="$t('RECIPEMANAGEMENT.RECIPE_LIST.OPERATION')" align="center" width="250">
        <template v-slot="scope">
          <div class="text-right">

            <el-button type="indigo" size="mini" class="mr-3" 
              @click="handleEdit(scope.row)">
              {{ $t('RECIPEMANAGEMENT.RECIPE_LIST.EDIT') }}
            </el-button>

            <el-popconfirm :title="$t('SYSTEM_MANAGEMENT.PERMISSION_MANAGEMENT.DELETETHISITEM')" 
              @confirm="handleDelete(scope.row)">
              <el-button slot="reference" type="danger" size="mini">
                {{ $t('RECIPEMANAGEMENT.RECIPE_LIST.DELETE') }}
              </el-button>
            </el-popconfirm>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <!-- 表 end -->

    <!-- 分页 start -->
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
    <!-- 分页 end -->

    <el-dialog class="el-dark-dialog el-dark-input"
               :visible.sync="dialogVisible"
               @closed="dialogVisible = false"
               :close-on-click-modal="false"
               :before-close="onCancel"
               :title="$t('RECIPEMANAGEMENT.MATERIAL')"
               width="600px">
      <el-form :model="formData"
               label-position="right"
               label-width="140px"
               :inline="false"
      >
        <el-input type="hidden" v-model="formData.Id"></el-input>

        <el-form-item :label="$t('RECIPEMANAGEMENT.RECIPE_EDIT.BOTTOMPOT')" style="width: 100%">
          <el-input size="medium" v-model="formData.BottomPot"></el-input>
        </el-form-item>

        <el-form-item :label="$t('RECIPEMANAGEMENT.RECIPE_EDIT.BOTTOMPOTID')" style="width: 100%">
          <el-input size="medium" v-model="formData.BottomPotId"></el-input>
        </el-form-item>

        <el-form-item :label="$t('RECIPEMANAGEMENT.RECIPE_EDIT.POTTYPE')" style="width: 100%">
          <el-select style="width: 100%"  :placeholder="$t('RECIPEMANAGEMENT.RECIPE_EDIT.POTTYPE')" v-model="formData.PotTypeName" @change="selectedPotType($event)">
                <el-option v-for="(item,index) in potTypeList" :key="index" :label="item.Name"
                           :value="index"></el-option>
              </el-select>
        </el-form-item>

        <el-form-item :label="$t('RECIPEMANAGEMENT.RECIPE_EDIT.MATERIAL')" style="width: 100%">
          <el-button type="save" @click="handleMaterialsCreate">添加物料</el-button>
          <div style="display: flex;">
            <!-- <el-input size="medium" v-model="formData.Materials"></el-input> -->
            <el-tag :key="tag" v-for="(tag,index) in dynamicTags" closable :disable-transitions="false" @close="handleClose(tag,index)">{{tag}}</el-tag>
          </div>
        </el-form-item>

        <el-form-item :label="$t('RECIPEMANAGEMENT.RECIPE_EDIT.TASTE')" style="width: 100%">
          <el-button type="save" @click="handleTasteCreate">添加口味</el-button>
          <div style="display: flex;">
            <el-tag :key="tag" v-for="(tag,index) in tasteDynamicTags" closable :disable-transitions="false" @close="handleTasteClose(tag,index)">{{tag}}</el-tag>
          </div>

        </el-form-item>

        <el-form-item :label="$t('RECIPEMANAGEMENT.RECIPE_EDIT.BOTTOMPROPERTIES')" style="width: 100%">
          <el-select style="width: 100%"  :placeholder="$t('RECIPEMANAGEMENT.RECIPE_EDIT.BOTTOMPROPERTIES')" v-model="formData.BottomProperties">
                <el-option label="辣" value="辣">辣</el-option>
                <el-option label="不辣" value="不辣">不辣</el-option>
              </el-select>
        </el-form-item>

        <el-form-item :label="$t('RECIPEMANAGEMENT.RECIPE_EDIT.SOUPSTANDARD')" style="width: 100%">
          <el-input-number size="medium" v-model="formData.SoupStandard"></el-input-number> ML 
        </el-form-item>

        <div style="display: flex;justify-content: center">
          <el-button type="cancel" @click="onCancel">{{ $t('SYSTEM_MANAGEMENT.CANCEL') }}</el-button>
          <el-button type="save" @click="onSubmit">{{ $t('SYSTEM_MANAGEMENT.CONFIRM') }}</el-button>
        </div>

      </el-form>
    </el-dialog>

    <el-dialog class="el-dark-dialog el-dark-input"
               :visible.sync="createMaterialsDialogVisible"
               @closed="createMaterialsDialogVisible = false"
               :close-on-click-modal="false"
               :before-close="onMaterialDialogCancel"
               :title="$t('RECIPEMANAGEMENT.ADDMATERIAL')"
               width="600px">
      <el-form :model="formMertialsData"
               label-position="right"
               label-width="140px"
               :inline="false"
      >
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_MATERIAL.MATERIAL')" prop="Matiral">
            <!-- <el-input v-model="formTasteData.Matiral"  @keyup.native="searchMatrialList()"></el-input> -->
            <el-select v-model="formMertialsData.Name" filterable  allow-create  @change="selectQueryMaterial">
                <el-option v-for="item in materialList" :value="item.Name" :key="item.Id">{{ item.Name }}</el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_MATERIAL.DOSAGE')" prop="Dosage">
            <el-input-number v-model="formMertialsData.Dosage">g/克</el-input-number>
          </el-form-item>
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_MATERIAL.UNIT')" prop="Unit">
            <el-input v-model="formMertialsData.Unit"></el-input>
        </el-form-item>
        <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_MATERIAL.ADDSOUPWATERLINE')" prop="Unit">
            <el-input-number v-model="formMertialsData.WaterLine"></el-input-number> ML
        </el-form-item>
        <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_MATERIAL.STATION')" style="width: 100%">
          <el-select style="width: 100%"  :placeholder="$t('RECIPEMANAGEMENT.ADD_MATERIAL.STATION')" v-model="formMertialsData.Station">
                <el-option label="鲜料工位" value="鲜料工位">鲜料工位</el-option>
                <el-option label="传锅工位" value="传锅工位">传锅工位</el-option>
              </el-select>
        </el-form-item>
        <div style="display: flex;justify-content: center">
          <el-button type="cancel" @click="onMaterialDialogCancel">{{ $t('SYSTEM_MANAGEMENT.CANCEL') }}</el-button>
          <el-button type="save" @click="onMaterialDialogSubmit">{{ $t('SYSTEM_MANAGEMENT.CONFIRM') }}</el-button>
        </div>
      </el-form>
    </el-dialog>

    <el-dialog class="el-dark-dialog el-dark-input"
               :visible.sync="createTasteDialogVisible"
               @closed="createTasteDialogVisible = false"
               :close-on-click-modal="false"
               :before-close="onTasteDialogCancel"
               :title="$t('RECIPEMANAGEMENT.ADDTASTE')"
               width="600px">
      <el-form :model="formTasteData"
               label-position="right"
               label-width="140px"
               :inline="false"
      >
        <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_TASTE.TASTE')" prop="Taste">
            <el-input v-model="formTasteData.Taste"></el-input>
          </el-form-item>
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_TASTE.TASTEID')" prop="Taste">
            <el-input v-model="formTasteData.TasteId"></el-input>
          </el-form-item>
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_TASTE.MATRIAL')" prop="Matiral">
            <!-- <el-input v-model="formTasteData.Matiral"  @keyup.native="searchMatrialList()"></el-input> -->
            <el-select v-model="formTasteData.Matiral" filterable   allow-create  @change="selectQuery">
                <el-option v-for="(item,index) in materialList" :value="index" :key="item.Id" :label="item.Name"></el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_TASTE.DOSAGE')" prop="Dosage">
            <el-input-number v-model="formTasteData.Dosage"></el-input-number>
          </el-form-item>
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_TASTE.UNIT')" prop="Unit">
            <el-input v-model="formTasteData.Unit"></el-input>
        </el-form-item>
        <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_TASTE.ADDSOUPWATERLINE')" prop="Unit">
            <el-input-number v-model="formTasteData.WaterLine"></el-input-number> ML
        </el-form-item>
        <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_TASTE.STATION')" style="width: 100%">
          <el-select style="width: 100%"  :placeholder="$t('RECIPEMANAGEMENT.ADD_TASTE.STATION')" v-model="formTasteData.Station">
                <el-option label="鲜料工位" value="鲜料工位">鲜料工位</el-option>
                <el-option label="传锅工位" value="传锅工位">传锅工位</el-option>
              </el-select>
        </el-form-item>
        <div style="display: flex;justify-content: center">
          <el-button type="cancel" @click="onTasteDialogCancel">{{ $t('SYSTEM_MANAGEMENT.CANCEL') }}</el-button>
          <el-button type="save" @click="onTasteDialogSubmit">{{ $t('SYSTEM_MANAGEMENT.CONFIRM') }}</el-button>
        </div>
      </el-form>
    </el-dialog>

    <el-dialog class="el-dark-dialog el-dark-input"
               :visible.sync="dialogSendToMQVisible"
               @closed="dialogSendToMQVisible = false"
               :close-on-click-modal="false"
               title="下发配置"
               width="600px">
      <el-form :model="formSendToMQData"
               label-position="right"
               label-width="140px"
               :inline="false"
      >
        <el-form-item label="设备" style="width: 100%">
          <el-select style="width: 100%"  placeholder="请选择项目" v-model="formData.project" @change="selectedProject($event)">
                <el-option v-for="(item,index) in projectOptions" :key="index" :label="item.name" :value="item.id"></el-option>
          </el-select>
          <el-select style="width: 100%"  placeholder="请选择分组" v-model="formData.group" @change="selectedAsset($event)">
                <el-option v-for="(item,index) in assetList" :key="index" :label="item.name" :value="item.id"></el-option>
          </el-select>
          <el-select style="width: 100%"  placeholder="请选择设备" v-model="formData.device_name" @change="selectedDevice($event)">
                <el-option v-for="(item,index) in deviceList" :key="index" :label="item.device_name" :value="item.access_token+'='+item.asset_id"></el-option>
          </el-select>
        </el-form-item>

        <div style="display: flex;justify-content: center">
          <el-button type="save" @click="onSendToMQTT">下发</el-button>
        </div>

      </el-form>
    </el-dialog>

  </div>
</template>

<script>
import TableTitle from "@/components/common/TableTitle.vue"
import Recipe from "@/api/recipe"
import PotType from "@/api/pot"
import { business_index } from "@/api/business";
import {asset_list_a} from "@/api/asset";
import {device_list} from "@/api/device"
import {message_success,message_error} from "../../../../utils/helpers";
import { stringify } from "querystring";

export default {
  name: "index",
  components: {
    TableTitle
  },
  data() {
    return {
      tmpSoupStandard: 0,
      loading: false,
      tableData: [],
      formSendToMQData: {

      },
      formData: {
        TasteArr: [],
        MaterialArr: [],
      },
      formMertialsData: {},
      formTasteData: {},
      total: 10,
      params: {
        total: 0,
        current_page: 1,
        per_page: 5
      },
      potParams: {
        current_page: 1,
        per_page: 100
      },
      materialParams: {
          keyword: "",
      },
      potTypeList: [],
      materialList:[],
      dialogVisible: false,
      createMaterialsDialogVisible: false,
      createTasteDialogVisible: false,
      dialogSendToMQVisible: false,
      currentWaterLine: 0,
      dynamicTags: [],
      tasteDynamicTags: [],
      Materials: [],
      Taste: [],
      projectOptions: [],
      assetList: [],
      deviceList: [],
      sendToMQTTData: []
    }
  },
  mounted() {
    this.getList();
  },
  methods: {
    getPotTypeList(){
      PotType.page(this.potParams)
            .then(({data}) => {
              if (data.code == 200) {
                this.potTypeList = data.data.data
              }
            })
    },

    changQuery(val) {
      this.searchMatrialList1(val)
    },

    selectQuery(index) {
      this.formTasteData.Dosage = this.materialList[index].Dosage
      this.formTasteData.Unit = this.materialList[index].Unit
      this.formTasteData.WaterLine = this.materialList[index].WaterLine
      this.formTasteData.Station = this.materialList[index].Station
    },

    selectQueryMaterial(index) {
      this.materialParams.keyword = index;
      Recipe.search_index(this.materialParams)
            .then(({data}) => {
              if (data.code == 200) {
                if (data.data.length > 0 ) {
                    this.formMertialsData.Dosage = data.data[0].Dosage;
                    this.formMertialsData.Unit = data.data[0].Unit;
                    this.formMertialsData.Station = data.data[0].Station;
                    this.formMertialsData.WaterLine = data.data[0].WaterLine;
                }
              }
            })
    },

    /**
       * 打开创建物料对话框
       */
       handleMaterialsCreate() {
        this.searchMatrialList()
        this.createMaterialsDialogVisible = true;
        this.materialParams.keyword = ''
      },
      searchMatrialList1(name) {
        console.log(name)
        this.materialParams.keyword = name;
      Recipe.search_index(this.materialParams)
            .then(({data}) => {
              if (data.code == 200) {
                if (data.data.length > 0 ) {
                    this.formMertialsData.Dosage = data.data[0].Dosage;
                    this.formMertialsData.Unit = data.data[0].Unit;
                    this.formMertialsData.Station = data.data[0].Station;
                    this.formMertialsData.WaterLine = data.data[0].WaterLine;
                }
              }
            })
    },
      searchMatrialList() {
      Recipe.search_index(this.materialParams)
            .then(({data}) => {
              if (data.code == 200) {
                this.materialList = data.data
              }
            })
    },
      /**
       * 打开创建口味对话框
       */
       handleTasteCreate() {
        this.searchMatrialList()
        this.createTasteDialogVisible = true;
        this.materialParams.keyword = ''
      },
    
    getList() {
        Recipe.page(this.params)
            .then(({data}) => {
              if (data.code == 200) {
                this.total = data.data.total
                this.tableData = data.data.data
              }
            })
    },
    handleAdd() {
      this.formData = {}
      this.getPotTypeList()
      this.dialogVisible = true
    },
    showSendToMQTTVisity() {
      business_index({limit: 100, page: 1})
          .then(({data}) => {
            if (data.code == 200) {
              this.projectOptions = data.data?.data || [];
            }
          })
      this.dialogSendToMQVisible = true;
    },

    selectedProject(event) {
      
      asset_list_a({business_id: event}).then(({data}) => {
        if (data.code === 200) {
           this.assetList = data.data
        }
    })
    },

    selectedAsset(event) {
      device_list({asset_id: event,current_page:1,per_page:10}).then(({data}) => {
        if (data.code === 200) {
           this.deviceList = data.data.data
        }
    })
    },

    selectedDevice(event) {
        this.sendToMQTTData = event.split('=')
    },

    onSendToMQTT() {
      if(this.sendToMQTTData.length != 2){
        message_error("请选择设备")
      }
      Recipe.sendToMQTT({access_token: this.sendToMQTTData[0],asset_id: this.sendToMQTTData[1]})
        .then(({data}) => {
          if (data.code == 200) {
            message_success("下发成功")
            this.projectOptions =  []
            this.assetList =  []
            this.deviceList = []
            this.sendToMQTTData =  []
            this.dialogSendToMQVisible = false
          }
        })
    },
    handleEdit(row) {
      Recipe.getOne({
        "current_page": 1,
        "per_page": 1,
        "id": row.Id
      })
        .then(({data}) => {
          if (data.code == 200) {
            this.formData = data.data.data[0]
            this.dynamicTags = data.data.data[0].Materials.split('\n')
            this.tasteDynamicTags = data.data.data[0].Taste.split('\n')
          }
        })
      this.dialogVisible = true
    },
    handleDelete(row) {
      Recipe.del({ id: row.Id })
        .then(({data}) => {
          if (data.code == 200) {
            this.getList();
          }
        })
    },
    onCancel() {
      this.formData = {}
      this.dialogVisible = false
      this.dynamicTags = []
      this.tasteDynamicTags = []
    },
    onMaterialDialogCancel() {
      this.formMertialsData = {}
      this.createMaterialsDialogVisible = false
      this.materialParams.keyword = ''
      this.dynamicTags = []
    },
    onTasteDialogCancel() {
      this.formTasteData = {}
      this.createTasteDialogVisible = false
      this.materialParams.keyword = ''
      this.tasteDynamicTags = []
    },
    onMaterialDialogSubmit() {
      var tmpMaterialData = '';
      tmpMaterialData = this.formMertialsData.Name+this.formMertialsData.Dosage+this.formMertialsData.Unit
      this.dynamicTags.push(tmpMaterialData)
      this.Materials.push(tmpMaterialData)
      if (this.formData.MaterialArr === 'undefined' || this.formData.MaterialArr == null || this.formData.MaterialArr === '') {
        this.formData.MaterialArr = []
      }
      this.formData.MaterialArr.unshift(this.formMertialsData)
      this.formMertialsData = {}
      this.createMaterialsDialogVisible = false
      this.materialParams.keyword = ''
    },
    onTasteDialogSubmit() {
      var tmpTasteData = '';
      tmpTasteData  = this.formTasteData.Taste+this.formTasteData.Dosage+this.formTasteData.Unit
      this.tasteDynamicTags.push(tmpTasteData);
      this.Taste.push(tmpTasteData)
      if ( this.formData.TasteArr === 'undefined' || this.formData.TasteArr == null || this.formData.TasteArr === '') {
        this.formData.TasteArr = []
      }
      this.formData.Taste = tmpTasteData
      this.formData.TasteArr.unshift(this.formTasteData)
      this.formTasteData = {}
      this.createTasteDialogVisible = false
    },
    onSubmit() {
        // saveOrUpdate
        
        this.formData.Materials = this.dynamicTags
        this.formData.Taste = this.tasteDynamicTags
      Recipe.saveOrUpdate(this.formData.Id ? "edit":"add", this.formData)
            .then(({ data }) => {
              if (data.code == 200) {
                this.dialogVisible = false
                this.dynamicTags = []
                this.tasteDynamicTags =  []
                this.Materials = []
                this.Taste = []
                message_success("操作成功")
                this.getList();
              }
            })
    },
    selectedPotType(index){
      console.log(index)
      this.formData.SoupStandard = this.potTypeList[index].SoupStandard
      this.formData.PotTypeId = this.potTypeList[index].PotTypeId
      this.formData.PotTypeName = this.potTypeList[index].Name
    },
    handleClose(tag,index) {
        this.dynamicTags.splice(this.dynamicTags.indexOf(tag), 1);
        console.log(this.formData.MaterialArr[index].Id)
        if ( this.formData.MaterialArr[index].Id === 'undefined' || this.formData.MaterialArr[index].Id == null || this.formData.MaterialArr[index].Id === '') {
      
        } else { 
          console.log(this.formData.MaterialArr[index].Id)
          Recipe.delete_materials({ id: this.formData.MaterialArr[index].Id })
        .then(({data}) => {
          if (data.code == 200) {
            console.log("删除成功")
          }
        })
        }
       
        this.formData.MaterialArr.splice(index,1)
      },
    handleTasteClose(tag,index) {
      this.tasteDynamicTags.splice(this.tasteDynamicTags.indexOf(tag), 1);
      if ( this.formData.TasteArr[index].Id === 'undefined' || this.formData.TasteArr[index].Id == null || this.formData.TasteArr[index].Id === '') {
      
    } else { 
      Recipe.delete_taste({ id: this.formData.TasteArr[index].Id })
    .then(({data}) => {
      if (data.code == 200) {
        console.log("删除成功")
      }
    })
    }
        this.formData.TasteArr.splice(index,1)
    }
  }
}
</script>

<style scoped>
.el-tag + .el-tag {
    margin-left: 10px;
  }
  .button-new-tag {
    margin-left: 10px;
    height: 32px;
    line-height: 30px;
    padding-top: 0;
    padding-bottom: 0;
  }
  .input-new-tag {
    width: 90px;
    margin-left: 10px;
    vertical-align: bottom;
  }
</style>