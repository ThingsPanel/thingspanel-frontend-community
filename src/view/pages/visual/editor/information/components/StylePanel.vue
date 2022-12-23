<template>
  <div class="style-panel-container">
    <el-form label-position="left" label-width="80px" :model="style">
      <el-form-item label="背景透明度">
        <el-slider v-model="style.opa" :max="1" :step="0.1" :min="0" show-stops></el-slider>
      </el-form-item>
      <el-form-item label="背景色">
        <el-color-picker v-model="style.bgColor"></el-color-picker>
      </el-form-item>
      <el-form-item label="圆角">
        <el-input-number size="small" v-model="style.borderRadius"></el-input-number>
      </el-form-item>
      <el-form-item label="边框宽度">
        <el-input-number size="small" v-model="style.borderWidth"></el-input-number>
      </el-form-item>
      <el-form-item label="边框颜色">
        <el-color-picker v-model="style.borderColor"></el-color-picker>
      </el-form-item>
      <el-form-item label="文字大小">
        <el-input-number size="mini" v-model="style.fontSize"></el-input-number>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { colorRGBA2Hex, colorHex2RGBA} from "@/utils/helpers"
import bus from "@/core/plugins/eventBus"

export default {
  name: "StylePanel",
  props: {

  },
  data() {
    return {
      // opacity: 1,
      // bgColor: "#2d3d86",
      // radius: 0,
      // borderWidth: 0,
      // borderColor: "#2d3d86",
      cptId: "",
      style: {
        opa: 1,
        bgColor: "#2d3d86",
        borderRadius: 0,
        borderWidth: 0,
        borderColor: "#2d3d86",
        fontSize: 18
      }
    }
  },
  watch: {
    style: {
      handler(val) {
        let styleData = JSON.parse(JSON.stringify(val));
        styleData.backgroundColor = colorHex2RGBA(val.bgColor, val.opa);
        if (styleData.borderWidth > 0) styleData.borderStyle = "solid";
        styleData.borderWidth += "px";
        styleData.borderRadius += "px";
        styleData.fontSize += "px";
        bus.$emit('changeStyle', this.cptId, styleData);
      },
      deep: true
    },
  },
  mounted() {
    bus.$on('share', val => {
      console.log("style.share", val)
      this.cptId = val.cptId;
      if (val.style) {
        this.initStyle(val.style);
      } else {
        this.initStyle({});
      }
    })
  },
  methods: {
    initStyle(style) {
      this.style.bgColor = style.backgroundColor ? colorRGBA2Hex(style.backgroundColor).hexColor : "#2d3d86";
      this.style.opa = style.backgroundColor ? parseFloat(colorRGBA2Hex(style.backgroundColor).opacity) : 1;
      this.style.borderRadius = style.borderRadius ? px2Number(style.borderRadius) : 0;
      this.style.borderWidth = style.borderWidth ? px2Number(style.borderWidth) : 0;
      this.style.borderColor = style.borderColor ? style.borderColor : "#2d3d86";
    }
  }
}
const px2Number = (value) => {
  if (value.indexOf("px") > -1) {
    return parseInt(value.replace("px", ""));
  }
  return parseInt(value);
}
</script>

<style scoped lang="scss">
  .style-panel-container {
    overflow-y: auto;
    overflow-x: hidden;
    padding-top: 20px;
    ::v-deep .el-form-item__label {
      color: #fff;
    }
    ::v-deep .el-form-item__content {
      margin-left: 10px;
      margin-right: 10px;
    }
  }

</style>