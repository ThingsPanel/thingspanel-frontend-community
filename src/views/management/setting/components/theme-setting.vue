<script setup lang="ts">
import { reactive } from 'vue'
import { useLoading } from '@sa/hooks'
import { editThemeSetting, fetchThemeSetting } from '@/service/api/setting'
import { deepClone } from '@/utils/common/tool'
// import { createServiceConfig } from '~/env.config';
// const { otherBaseURL } = createServiceConfig(import.meta.env);
// const url = ref(new URL(otherBaseURL.demo));
import { useSysSettingStore } from '@/store/modules/sys-setting'
import { $t } from '@/locales'
import UploadImage from './upload-image.vue'

const { loading, startLoading, endLoading } = useLoading(false)

const formModel = reactive<GeneralSetting.ThemeSetting>(createDefaultFormModel())
const sysSettingStore = useSysSettingStore()

function setTableData(data: GeneralSetting.ThemeSetting) {
  Object.assign(formModel, data)
}

async function getGeneralSetting() {
  startLoading()
  const { data } = await fetchThemeSetting()
  if (data) {
    const list: Api.GeneralSetting.ThemeSetting[] = data.list
    if (list.length) {
      setTableData(list[0])
    }
  }
  endLoading()
}

function createDefaultFormModel(): GeneralSetting.ThemeSetting {
  return {
    id: '',
    system_name: '',
    logo_background: '',
    logo_cache: '',
    logo_loading: '',
    home_background: ''
  }
}

async function handleSubmit() {
  startLoading()
  const formData = deepClone(formModel)
  const data: any = await editThemeSetting(formData)
  if (!data.error) {
    window.$message?.success(data.msg)
    // 确保系统设置在应用启动时加载
    await sysSettingStore.initSysSetting()
    endLoading()
    await getGeneralSetting()
  }
}

function init() {
  getGeneralSetting()
}

init()
</script>

<template>
  <NSpin :show="loading">
    <NForm ref="formRef" label-placement="left" :label-width="120" :model="formModel">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem
          :span="24"
          :label="系统标题"
          path="system_name"
        >
          <NInput v-model:value="formModel.system_name" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="首页和后台 logo">
          <UploadImage
            v-model="formModel.logo_background"
            accept="image/png, image/jpeg, image/jpg"
            :file-type="['jpg', 'png', 'jpeg']"
          ></UploadImage>
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="加载页面 logo">
          <UploadImage
            v-model="formModel.logo_loading"
            accept="image/png, image/jpeg, image/jpg"
            :file-type="['jpg', 'png', 'jpeg']"
          ></UploadImage>
        </NFormItemGridItem>
        <!--
 <NFormItemGridItem :span="24" :label="站标 logo">
          <UploadImage v-model="formModel.logo_cache" accept="image/png, image/jpeg, image/jpg"
            :file-type="['jpg', 'png', 'jpeg']"></UploadImage>
        </NFormItemGridItem>
-->
        <NFormItemGridItem :span="24" :label="背景图片">
          <UploadImage
            v-model="formModel.home_background"
            accept="image/png, image/jpeg, image/jpg"
            :file-type="['jpg', 'png', 'jpeg']"
          ></UploadImage>
        </NFormItemGridItem>

        <!--
 <NFormItemGridItem :span="24">
          <div class="w-120px"></div>
          <NSpace class="text-center">
            <div>
              <div>
                {{ "首页和后台 logo" }}
              </div>
              <NImage width="140" class="mt-20px h-140px" object-fit="contain"
                :src="url.origin + formModel.logo_background?.slice(1)" />
              <UploadImage v-model:value="formModel.logo_background" accept="image/png, image/jpeg, image/jpg"
                class="mt-10px" :text="更换 logo"
                :file-type="['jpg', 'png', 'jpeg']"></UploadImage>
            </div>
            <div class="ml-20px">
              <div>
                {{ "加载页面 logo" }}
              </div>
              <NImage width="140" class="mt-20px h-140px" object-fit="contain"
                :src="url.origin + formModel.logo_loading?.slice(1)" />
              <UploadImage v-model:value="formModel.logo_loading" accept="image/png, image/jpeg, image/jpg, image/gif"
                class="mt-10px" :text="更换 logo"
                :file-type="['jpg', 'png', 'jpeg', 'gif']"></UploadImage>
            </div>
            <div class="ml-20px">
              <div>
                {{ "站标 logo" }}
              </div>
              <NImage width="140" class="mt-20px h-140px" object-fit="contain"
                :src="url.origin + formModel.logo_cache?.slice(1)" />
              <UploadImage v-model:value="formModel.logo_cache" accept="image/png, image/jpeg, image/jpg"
                class="mt-10px" :text="更换 logo"
                :file-type="['jpg', 'png', 'jpeg']"></UploadImage>
            </div>
            <div class="ml-20px">
              <div>
                {{ "背景图片" }}
              </div>
              <NImage width="140" class="mt-20px h-140px" object-fit="contain"
                :src="url.origin + formModel.home_background?.slice(1)" />
              <UploadImage v-model:value="formModel.home_background" accept="image/png, image/jpeg, image/jpg"
                class="mt-10px" :text="更换 logo"
                :file-type="['jpg', 'png', 'jpeg']"></UploadImage>
            </div>
          </NSpace>
        </NFormItemGridItem>
-->
        <NFormItemGridItem :span="24" class="mt-30px">
          <div class="w-120px"></div>
          <NButton class="w-72px" type="primary" @click="handleSubmit">
            {{ "保存" }}
          </NButton>
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="start"></NSpace>
    </NForm>
  </NSpin>
</template>

<style lang="scss"></style>
