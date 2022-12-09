<!-- 组态配置面板 -->
<template>
  <div>
    <el-row style="margin: 20px 0 20px 0">
      <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">名称</el-col>
      <el-col :span="18"><el-input size="mini" v-model="form.name"></el-input></el-col>
    </el-row>
    <!--    <el-row>-->
    <!--      <el-col :span="6" style="height:100%;padding-top: 6px;color:#fff">尺寸</el-col>-->
    <!--      <el-col :span="18" style="display: block">-->
    <!--        <el-input size="mini" >-->
    <!--          <template slot="prepend">宽</template>-->
    <!--        </el-input>-->
    <!--        <el-input size="mini">-->
    <!--          <template slot="prepend">高</template>-->
    <!--        </el-input>-->
    <!--      </el-col>-->
    <!--    </el-row>-->

    <el-collapse class="el-dark-collapse information-collapse" style="padding:10px;" v-model="activeNames">

<!--      <el-collapse-item title="信息" name="info">-->

<!--      </el-collapse-item>-->


      <el-collapse-item title="数据源" name="source">
        <el-cascader ref="cascaderRef" class="el-cascader" size="mini"
                     :options="casOptions" :props="{ emitPath: false }"
                     filterable @change="handleChangeOptions" placeholder="请选择设备">
          <template slot-scope="{ node, data }">
            <span>{{ data.label }}</span>
            <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
            <span v-if="data.device_id">({{ data.plugin_id ? "已绑定" : "未绑定" }})</span>
          </template>
        </el-cascader>

      </el-collapse-item>

    </el-collapse>

    <!--    <el-collapse class="el-dark-collapse" style="padding:10px;" v-model="activeNames">-->

    <!--      &lt;!&ndash; 名称 &ndash;&gt;-->
    <!--      <el-collapse-item title="图表" name="chart">-->
    <!--        <div class="component-item" v-for="(component, index) in chartList" :key="index">-->
    <!--          <vue-drag :option="component" :type="component.type" @click="handleComponentClicked" :index="'chart' + component.name">-->
    <!--            <el-image  :style="defaultStyle" :src="component.image_src"></el-image>-->
    <!--          </vue-drag>-->
    <!--        </div>-->
    <!--      </el-collapse-item>-->

    <!--    </el-collapse>-->
  </div>
</template>

<script>
export default {
  name: "ConfigureConfig",
  props: {
    formData: {
      type: [Object],
      default: () => { return {} }
    },
    casOptions: {
      type: [Array],
      default: () => []
    }
  },
  data() {
    return {
      activeNames: ["info", "source"],
      form: {
        name: "",
        text: "",
        mapping: ""
      }
    }
  },
  created() {
    console.log("====configure.created")
  },
  methods: {
    handleChangeOptions() {

    }
  }
}
</script>

<style scoped>

</style>