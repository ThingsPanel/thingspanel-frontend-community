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
        <el-button size="medium" type="border" >下发配置</el-button>
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
          <el-select style="width: 100%"  :placeholder="$t('RECIPEMANAGEMENT.RECIPE_EDIT.POTTYPE')" v-model="formData.PotTypeId" @change="selectedPotType($event)">
                <el-option v-for="(item,index) in potTypeList" :key="item.Id" :label="item.Name"
                           :value="index"></el-option>
              </el-select>
        </el-form-item>

        <el-form-item :label="$t('RECIPEMANAGEMENT.RECIPE_EDIT.MATERIAL')" style="width: 100%">
          <div style="display: flex;justify-content: center">
            <el-input size="medium" v-model="formData.Materials"></el-input>
            <el-button type="save" @click="handleMaterialsCreate">添加物料</el-button>
          </div>
        </el-form-item>

        <el-form-item :label="$t('RECIPEMANAGEMENT.RECIPE_EDIT.TASTE')" style="width: 100%">
          <div style="display: flex;justify-content: center">
            <el-input size="medium" v-model="formData.Taste"></el-input>
            <el-button type="save" @click="handleTasteCreate">添加口味</el-button>
          </div>
        </el-form-item>

        <el-form-item :label="$t('RECIPEMANAGEMENT.RECIPE_EDIT.BOTTOMPROPERTIES')" style="width: 100%">
          <el-select style="width: 100%"  :placeholder="$t('RECIPEMANAGEMENT.RECIPE_EDIT.BOTTOMPROPERTIES')" v-model="formData.BottomProperties">
                <el-option label="辣" value="辣">辣</el-option>
                <el-option label="不辣" value="不辣">不辣</el-option>
              </el-select>
        </el-form-item>

        <el-form-item :label="$t('RECIPEMANAGEMENT.RECIPE_EDIT.SOUPSTANDARD')" style="width: 100%">
          <el-input-number size="medium" v-model="formData.SoupStandard"></el-input-number>
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
               :title="$t('RECIPEMANAGEMENT.ADDMATERIAL')"
               width="600px">
      <el-form :model="formMertialsData"
               label-position="right"
               label-width="140px"
               :inline="false"
      >
          <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_MATERIAL.MATERIAL')" prop="Matiral">
            <!-- <el-input v-model="formTasteData.Matiral"  @keyup.native="searchMatrialList()"></el-input> -->
            <el-select v-model="formMertialsData.Name" filterable  allow-create @change="changQuery">
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
            <el-input-number v-model="formMertialsData.AddSoupWaterLine"></el-input-number>
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
            <el-select v-model="formTasteData.Matiral" filterable  @on-create="changQuery" @change="selectQuery">
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
            <el-input-number v-model="formTasteData.AddSoupWaterLine"></el-input-number>
        </el-form-item>
        <el-form-item :label="$t('RECIPEMANAGEMENT.ADD_TASTE.STATION')" style="width: 100%">
          <el-select style="width: 100%"  :placeholder="$t('RECIPEMANAGEMENT.ADD_TASTE.STATION')" v-model="formData.Station">
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

  </div>
</template>

<script>
import TableTitle from "@/components/common/TableTitle.vue"
import Recipe from "@/api/recipe"
import PotType from "@/api/pot"
import {message_success} from "../../../../utils/helpers";

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
      formData: {
        TastesArr: [],
        MaterialsArr: []
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
      currentWaterLine: 0,
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
    sendToMQTT() {
      Recipe.sendToMQTT()
        .then(({data}) => {
          if (data.code == 200) {
            message_success("操作成功")
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
            console.log(this.formData)
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
      if(typeof this.formData.Materials === 'undefined' || this.formData.Materials == null || this.formData.Materials === ''){
        tmpMaterialData  = this.formMertialsData.Name+this.formMertialsData.Dosage+this.formMertialsData.Unit
      }else{
        tmpMaterialData =  this.formData.Materials+ "," + this.formMertialsData.Name+this.formMertialsData.Dosage+this.formMertialsData.Unit
      }
      this.formData.Materials = tmpMaterialData
      if (this.formData.MaterialsArr === 'undefined' || this.formData.MaterialsArr == null || this.formData.MaterialsArr === '') {
        this.formData.MaterialsArr = []
      }
      this.formData.MaterialsArr.unshift(this.formMertialsData)

      if(typeof this.formData.AddSoupWaterLine === 'undefined' || this.formData.AddSoupWaterLine == null || this.formData.AddSoupWaterLine === ''){
        tmpMaterialData  = this.formMertialsData.Name+this.formMertialsData.Dosage+this.formMertialsData.Unit
      }else{
        tmpMaterialData =  this.formData.Materials+ "," + this.formMertialsData.Name+this.formMertialsData.Dosage+this.formMertialsData.Unit
      }
      if(typeof this.formData.CurrentWaterLine === 'undefined' || this.formData.CurrentWaterLine == null || this.formData.CurrentWaterLine === ''){
        this.formData.CurrentWaterLine  = this.formMertialsData.AddSoupWaterLine
      }else{
        this.formData.CurrentWaterLine  += this.formMertialsData.AddSoupWaterLine
      }
    
      
      this.formMertialsData = {}
      this.createMaterialsDialogVisible = false
      this.materialParams.keyword = ''
    },
    onTasteDialogSubmit() {
      var tmpTasteData = '';
      if(typeof this.formData.Tastes === 'undefined' || this.formData.Tastes == null || this.formData.Tastes === ''){
        tmpTasteData  = this.formTasteData.Taste+this.formTasteData.Dosage+this.formTasteData.Unit
      }else{
        tmpTasteData =  this.formData.Tastes+ "," + this.formTasteData.Taste+this.formTasteData.Dosage+this.formTasteData.Unit
      }
     
      this.formData.Taste = tmpTasteData
      if ( this.formData.TastesArr === 'undefined' || this.formData.TastesArr == null || this.formData.TastesArr === '') {
        this.formData.TastesArr = []
      } 
      this.formData.TastesArr.unshift(this.formTasteData)

      if(typeof this.formData.CurrentWaterLine === 'undefined' || this.formData.CurrentWaterLine == null || this.formData.CurrentWaterLine === ''){
        this.formData.CurrentWaterLine  = this.formTasteData.AddSoupWaterLine
      }else{
        this.formData.CurrentWaterLine  += this.formTasteData.AddSoupWaterLine
      }
      this.formTasteData = {}
      this.createTasteDialogVisible = false
    },
    onSubmit() {
        // saveOrUpdate
      Recipe.saveOrUpdate(this.formData.Id ? "edit":"add", this.formData)
            .then(({ data }) => {
              if (data.code == 200) {
                this.dialogVisible = false
                message_success("操作成功")
                this.getList();
              }
            })
    },
    selectedPotType(index){
      this.formData.SoupStandard = this.potTypeList[index].SoupStandard
      this.formData.PotTypeId = this.potTypeList[index].PotTypeId
    }
  }
}
</script>

<style scoped>

</style>