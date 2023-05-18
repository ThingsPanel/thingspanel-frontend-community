<template>
  <div class="rounded card p-4">
    <!-- 头 start -->
    <el-row type="flex" class="pt-3 pb-4 px-3">
      <el-col :span="12">
        <TableTitle>{{ $t('RECIPEMANAGEMENT.RECIPE_LIST.RECIPTLIST') }}</TableTitle>
      </el-col>
      <el-col :span="12" class="text-right">
        <!-- 添加权限按钮 -->
        <el-button size="medium" type="indigo" @click="handleAdd" >{{ $t('RECIPEMANAGEMENT.CREATERECIPE') }}</el-button>
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
          <div>
            <el-button type="save" @click="handleMaterialsCreate">添加物料</el-button>
          </div>
          <el-tag :key="tag" v-for="(tag,index) in dynamicTags" closable :disable-transitions="false" @close="handleClose(tag,index)">{{tag}}</el-tag>
        </el-form-item>

        <el-form-item :label="$t('RECIPEMANAGEMENT.RECIPE_EDIT.TASTE')" style="width: 100%">
          <div>
            <el-button type="save" @click="handleTasteCreate">添加口味</el-button>
          </div>
          <el-tag :key="tag" v-for="(tag,index) in tasteDynamicTags" closable :disable-transitions="false" @close="handleTasteClose(tag,index)">{{tag}}</el-tag>
        </el-form-item>

        <el-form-item :label="$t('RECIPEMANAGEMENT.RECIPE_EDIT.BOTTOMPROPERTIES')" style="width: 100%">
          <el-select style="width: 100%"  :placeholder="$t('RECIPEMANAGEMENT.RECIPE_EDIT.BOTTOMPROPERTIES')" v-model="formData.BottomProperties">
                <el-option label="辣" value="辣">辣</el-option>
                <el-option label="不辣" value="不辣">不辣</el-option>
              </el-select>
        </el-form-item>

        <el-form-item :label="$t('RECIPEMANAGEMENT.RECIPE_EDIT.SOUPSTANDARD')" style="width: 100%">
          <el-input-number size="medium" v-model="formData.SoupStandard" disabled></el-input-number> ML 
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
            <el-select v-model="formMertialsData.Name" filterable  allow-create  @change="selectQueryMaterial" placeholder="请输入或选择">
                <el-option v-for="(item,index) in materialList" :value="index" :key="item.Id" :label="item.Name">{{ item.Name }}{{ item.Dosage }}{{ item.Unit }}{{ item.WaterLine }} ML</el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_MATERIAL.DOSAGE')" prop="Dosage">
            <el-input-number v-model="formMertialsData.Dosage" :disabled="materialDosageDisabled">g/克</el-input-number>
          </el-form-item>
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_MATERIAL.UNIT')" prop="Unit">
            <el-input v-model="formMertialsData.Unit" :disabled="materialUnitDisabled"></el-input>
        </el-form-item>
        <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_MATERIAL.ADDSOUPWATERLINE')" prop="WaterLine">
            <el-input-number v-model="formMertialsData.WaterLine" :disabled="materialWaterLineIsDisabled"></el-input-number> ML
        </el-form-item>
        <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_MATERIAL.STATION')" style="width: 100%" prop="Station">
          <el-select style="width: 100%"  :placeholder="$t('RECIPEMANAGEMENT.ADD_MATERIAL.STATION')" v-model="formMertialsData.Station" :disabled="materialStationDisabled">
                <el-option label="所有工位" value="所有工位">所有工位</el-option>
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
            <el-select v-model="formTasteData.Taste" filterable   allow-create  @change="selectTasteQuery" placeholder="请输入或选择">
                <el-option v-for="(item,index) in tasteList" :value="index" :key="index" :label="item.Name"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_TASTE.TASTEID')" prop="TasteId">
            <el-input v-model="formTasteData.TasteId" :disabled="tasteIdIsDisabled"></el-input>
          </el-form-item>
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_TASTE.MATRIAL')" prop="MaterialsName">
            <el-select v-model="formTasteData.Material" filterable   allow-create  @change="selectMaterialOnTaste" placeholder="请输入或选择">
                <el-option v-for="(item,index) in materialList" :value="index" :key="item.Id">{{ item.Name }}{{ item.Dosage }}{{ item.Unit }}{{ item.WaterLine }} ML</el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_TASTE.DOSAGE')" prop="Dosage">
            <el-input-number v-model="formTasteData.Dosage" :disabled="dosageIsDisabled"></el-input-number>
          </el-form-item>
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_TASTE.UNIT')" prop="Unit">
            <el-input v-model="formTasteData.Unit" :disabled="unitIsDisabled"></el-input>
        </el-form-item>
        <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_TASTE.ADDSOUPWATERLINE')" prop="WaterLine">
            <el-input-number v-model="formTasteData.WaterLine" :disabled="waterLineIsDisabled"></el-input-number> ML
        </el-form-item>
        <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_TASTE.STATION')" style="width: 100%">
          <el-select style="width: 100%"  :placeholder="$t('RECIPEMANAGEMENT.ADD_TASTE.STATION')" v-model="formTasteData.Station" :disabled="stationIsDisabled">
                <el-option label="所有工位" value="所有工位">所有工位</el-option>
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
      <el-form :model="formSendData"
               label-position="right"
               label-width="140px"
               :inline="false"
      >
        <el-form-item label="设备" style="width: 100%">
          <el-select style="width: 100%"  placeholder="请选择项目" v-model="formSendData.project" @change="selectedProject($event)">
                <el-option v-for="(item,index) in projectOptions" :key="index" :label="item.name" :value="item.id"></el-option>
          </el-select>
          <el-select style="width: 100%"  placeholder="请选择分组" v-model="formSendData.group" @change="selectedAsset($event)">
                <el-option v-for="(item,index) in assetList" :key="index" :label="item.name" :value="item.id"></el-option>
          </el-select>
          <el-select style="width: 100%"  placeholder="请选择设备" v-model="formSendData.device_name" @change="selectedDevice($event)">
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
      formSendData: {

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
      tasteList: [],
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
      sendToMQTTData: [],
      tasteIdIsDisabled: false,
      dosageIsDisabled: false,
      unitIsDisabled: false,
      waterLineIsDisabled: false,
      stationIsDisabled: false,
      materialDosageDisabled: false,
      materialUnitDisabled: false,
      materialWaterLineIsDisabled: false,
      materialStationDisabled: false
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

    selectMaterialOnTaste(index) {
      if (this.materialList[index] === 'undefined' || this.materialList[index] == null || this.materialList[index] === '') {
          this.dosageIsDisabled = false
          this.unitIsDisabled = false
          this.waterLineIsDisabled = false
          this.stationIsDisabled = false
          this.formTasteData.Material = ''
          this.formTasteData.Dosage = 0
          this.formTasteData.Unit = ''
          this.formTasteData.WaterLine = 0
          this.formTasteData.Station = ''
          this.formTasteData.MaterialId = ''
          this.formTasteData.Action = ""
      }else{
          this.formTasteData.Material = this.materialList[index].Name
          this.formTasteData.Dosage = this.materialList[index].Dosage
          this.formTasteData.Unit = this.materialList[index].Unit
          this.formTasteData.WaterLine = this.materialList[index].WaterLine
          this.formTasteData.Station = this.materialList[index].Station
          this.formTasteData.MaterialId = this.materialList[index].Id
          this.formTasteData.Action = "GET"
          this.dosageIsDisabled = true
          this.unitIsDisabled = true
          this.waterLineIsDisabled = true
          this.stationIsDisabled = true
      }
      
    },


    selectTasteQuery(index) {
      if (this.tasteList[index] === 'undefined' || this.tasteList[index] == null || this.tasteList[index] === ''){
        this.tasteIdIsDisabled = false
        this.formTasteData.TasteId = '' 
        this.formTasteData.Taste = ''
        this.formTasteData.Action = ''
      }else{
        this.formTasteData.TasteId = this.tasteList[index].TasteId 
        this.formTasteData.Taste = this.tasteList[index].Name
        this.formTasteData.Action = "GET"
        this.tasteIdIsDisabled = true
      }
    
    },

    selectQueryMaterial(index) {
      if (this.materialList[index] === 'undefined' || this.materialList[index] == null || this.materialList[index] === ''){
                    this.materialDosageDisabled = false
                    this.materialUnitDisabled = false
                    this.materialWaterLineIsDisabled =  false
                    this.materialStationDisabled=  false
                    this.formMertialsData.Dosage = 0;
                    this.formMertialsData.Unit = '';
                    this.formMertialsData.Station = '';
                    this.formMertialsData.WaterLine = 0;
                    this.formMertialsData.Action = ""
       }else{
                    this.formMertialsData.Dosage = this.materialList[index].Dosage;
                    this.formMertialsData.Unit = this.materialList[index].Unit;
                    this.formMertialsData.Station = this.materialList[index].Station;
                    this.formMertialsData.WaterLine = this.materialList[index].WaterLine;
                    this.formMertialsData.Action = "GET"
                    this.materialDosageDisabled = true
                    this.materialUnitDisabled = true
                    this.materialWaterLineIsDisabled =  true
                    this.materialStationDisabled=  true
        }
    },

    /**
       * 打开创建物料对话框
       */
       handleMaterialsCreate() {
        this.searchMatrialList()
        this.createMaterialsDialogVisible = true;
        this.materialParams.keyword = ''
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
        this.getTasteList()
        this.searchMatrialList()
        this.createTasteDialogVisible = true;
        this.materialParams.keyword = ''
      },

      getTasteList() {
        Recipe.search_taste({})
            .then(({data}) => {
              if (data.code == 200) {
                  this.tasteList = data.data;
              }
            })
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
        return
      }
      Recipe.sendToMQTT({access_token: this.sendToMQTTData[0],asset_id: this.sendToMQTTData[1]})
        .then(({data}) => {
          if (data.code == 200) {
            message_success("下发成功")
            this.formSendData = {}
            this.projectOptions =  []
            this.assetList =  []
            this.deviceList = []
            this.sendToMQTTData =  []
            this.dialogSendToMQVisible = false
          }
        })
    },
    handleEdit(row) {
      this.getPotTypeList()
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
    },
    onTasteDialogCancel() {
      this.formTasteData = {}
      this.createTasteDialogVisible = false
      this.materialParams.keyword = ''
    },
    onMaterialDialogSubmit() {
      var tmpMaterialData = '';
      if (this.formMertialsData.Action !== "GET") {
        tmpMaterialData = this.formMertialsData.Name+this.formMertialsData.Dosage+this.formMertialsData.Unit+this.formMertialsData.WaterLine
      } else{
        tmpMaterialData = this.formMertialsData.Name
      }
      
      this.dynamicTags.push(tmpMaterialData)
      this.Materials.push(tmpMaterialData)
      if (this.formData.MaterialArr === 'undefined' || this.formData.MaterialArr == null || this.formData.MaterialArr === '') {
        this.formData.MaterialArr = []
      }
      this.formData.MaterialArr.unshift(this.formMertialsData)
      this.formMertialsData = {}
      this.createMaterialsDialogVisible = false
      this.materialParams.keyword = ''
      console.log(this.formData.MaterialArr)
    },
    onTasteDialogSubmit() {
      var tmpTasteData = '';
      if (this.formTasteData.Action !== "GET") {
        tmpTasteData  = this.formTasteData.Taste+":"+this.formTasteData.Material+this.formTasteData.Dosage+this.formTasteData.Unit
        if (this.formData.MaterialArr === 'undefined' || this.formData.MaterialArr == null || this.formData.MaterialArr === '') {
        this.formData.MaterialArr = []
      }
      this.formMertialsData.Name = this.formTasteData.Material
      this.formMertialsData.Dosage = this.formTasteData.Dosage
      this.formMertialsData.Unit = this.formTasteData.Unit
      this.formMertialsData.WaterLine = this.formTasteData.WaterLine
      this.formMertialsData.Station = this.formTasteData.Station
      this.formMertialsData.Action = "Taste"
      this.formData.MaterialArr.unshift(this.formMertialsData)
      }else{
        tmpTasteData  = this.formTasteData.Taste+":"+this.formTasteData.Material
      }
      this.tasteDynamicTags.push(tmpTasteData);
      this.Taste.push(tmpTasteData)
      if ( this.formData.TasteArr === 'undefined' || this.formData.TasteArr == null || this.formData.TasteArr === '') {
        this.formData.TasteArr = []
      }
      this.formData.Taste = tmpTasteData
      this.formData.TasteArr.unshift(this.formTasteData)
      this.formTasteData = {}
      this.formMertialsData = {}
      this.createTasteDialogVisible = false
    },

    onSubmit() {
      var materialCount = this.formData.MaterialArr.length
      var tasteCount = this.formData.TasteArr.length
      var count = 0
      var deleteCount = 0
      if (materialCount == 0)  {
        message_error("请添加物料")
        return
      }
      for (var i = 0; i < materialCount; i++ ) {
                    if (this.formData.MaterialArr[i].Operate == "delete") {
                        count ++
                    }
      }
      if (count == materialCount) {
        message_error("请添加物料")
        return
      }

      for (var i = 0; i < tasteCount; i++ ) {
                    if (this.formData.TasteArr[i].Operate == "delete") {
                      deleteCount ++
                    }
      }

      if (deleteCount == tasteCount) {
        message_error("请添加口味")
        return
      }
      
      if (tasteCount == 0)  {
        message_error("请添加口味")
        return
      }
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
      console.log(tag,index)
      console.log(this.formData.MaterialArr)
        this.dynamicTags.splice(this.dynamicTags.indexOf(tag), 1);
        if ( this.formData.MaterialArr[index].Id === 'undefined' || this.formData.MaterialArr[index].Id == null || this.formData.MaterialArr[index].Id === '') {
          console.log(1111)
        } else { 
          console.log(2222)
          this.formData.MaterialArr[index].Operate = "delete"
        }
        console.log(this.formData.MaterialArr)
      },
    handleTasteClose(tag,index) {
      console.log(tag,index)
      console.log(this.formData.TasteArr)
      if ( this.formData.TasteArr[index].Id === 'undefined' || this.formData.TasteArr[index].Id == null || this.formData.TasteArr[index].Id === '') {
        console.log(1111)
    } else { 
      console.log(2222)
      this.formData.TasteArr[index].Operate = "delete"
    }
    this.tasteDynamicTags.splice(this.tasteDynamicTags.indexOf(tag), 1);
    console.log(this.formData.TasteArr)
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