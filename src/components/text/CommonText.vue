<template>
  <div class="text-container" :style="vStyle">
    <input class="input" ref="inputRef" type="text"  v-if="active && editable" v-model="textValue"
           @mousedown="stopPropagation" @mouseup="stopPropagation" @click="stopPropagation"
           @keydown="stopPropagation"/>

    <span class="text" v-else>{{ textValue }}</span>
  </div>
</template>

<script>
export default {
  name: "CommonText",
  props: {
    option: {
      type: [Object],
      default: () => { return {} }
    },
    mode: {
      type: [String],
      default: "edit"
    },
    active: {
      type: [Boolean],
      default: false
    },
    editable: {
      type: [Boolean],
      default: false
    },
    value: {
      type: [String, Array],
      default: "文本"
    },
    vStyle: {
      type: [Object],
      default: () => {
        return {
          borderRadius: 0,
          borderWidth: 0,
          borderColor: "#2d3d86",
          fontSize: 18
        }
      }
    }
  },
  data() {
    return {
      textValue: ""
    }
  },
  created() {
    this.$emit("update:value", this.value);
    this.textValue = this.value;
  },
  watch: {
    value: {
      handler(newValue) {
        console.log("====CommonText.value", newValue)
        if (typeof newValue == "string") {
          this.textValue = newValue;
        } else if (typeof newValue == "object") {
          this.textValue = newValue[0];
        }
      }
    },
    textValue: {
      handler(newValue) {
        this.$emit("update:value", newValue)
      }
    },
    editable: {
      handler(newValue) {
        this.$nextTick(() => {
          if (newValue) {
            // 激活 input 后使 input 获得焦点
            let input = this.$refs["inputRef"];
            if (input) input.focus();
          }
        })
      }
    },
    vStyle: {
      handler(newValue) {
        console.log("====text", newValue)

      },
      immediate: true
    }
  },
  methods: {
    stopPropagation(e){
      e.stopPropagation()
    }
  }
}
</script>

<style scoped>
.text-container {
  margin: 0 auto;
  text-align: center
}
.input {
  width: 100%;
  height: 30px;
  text-align: center;
  background-color: transparent;
  color: #FFF;
  border: 0px;
}
.text {
  color: #fff;
}
</style>