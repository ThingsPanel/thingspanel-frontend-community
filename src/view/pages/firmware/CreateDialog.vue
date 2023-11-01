<template>
  <v-dialog v-model="dialog" width="500">
    <template v-slot:activator="{ on, attrs }">
      <v-btn class="mx-1" color="indigo" dark v-bind="attrs" v-on="on">新增固件</v-btn>
    </template>
    <v-card>
      <v-card-title class="text-h5 grey lighten-2"> 新增固件 </v-card-title>
      <v-card-text> 
          <v-form ref="createFirmwareForm">
              <v-select label="归属产品" 
                v-model="formData.product" 
                :items="productOptions"
              ></v-select>

              <v-text-field 
                label="固件名称" 
                v-model="formData.firmware_name">
              </v-text-field>

              <v-text-field 
                label="版本号" 
                v-model="formData.firmware_version">
              </v-text-field>

              <v-radio-group
                v-model="formData.signature"
                row
                >
                <v-radio
                    label="MD5"
                    value="MD5"
                ></v-radio>
                <v-radio
                    label="SHA256"
                    value="SHA256"
                ></v-radio>
              </v-radio-group>

              <v-text-field 
                label="签名" 
                v-model="formData.sign_value"
              ></v-text-field>

               <v-file-input
                    accept="image/*"
                    label="上传固件"
                ></v-file-input>

              <v-text-field 
                label="描述" 
                v-model="formData.sign_value"
              ></v-text-field>


          </v-form>
      </v-card-text>
      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="dialog = false">取消</v-btn>
        <v-btn color="indigo" dark @click="handleCreate">提交</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { defineComponent, reactive, ref } from "@vue/composition-api";

export default defineComponent({
  setup() {
    let dialog = ref(false);

    let productOptions = ref([
        '手推车','井盖','行李拖斗'
    ])

    let formData = reactive({
      product: "",
      firmware_name: "",
      firmware_version: "",
      signature: "",
      sign_value: "",
      description: "",
    })

    function handleCreate(){
        dialog.value = false
    }

    return {
      dialog,
      handleCreate,
      formData,
      productOptions,
    };
  },
});
</script>
