<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { NFlex } from 'naive-ui';
import { deviceConfigEdit, deviceConfigInfo, deviceConfigMenu } from '@/service/api/device';
import { useRouterPush } from '@/hooks/common/router';
import { $t } from '@/locales';
// eslint-disable-next-line vue/valid-define-emits
const emit = defineEmits();
const { routerPushByKey } = useRouterPush();

interface Props {
  configInfo?: object | any;
}

const props = withDefaults(defineProps<Props>(), {
  configInfo: null
});

const plugList = ref([{ name: $t('generate.unbind'), id: '' }]);

const selectValue = ref();

const getTableData = async name => {
  const res = await deviceConfigMenu({ device_config_name: name });
  plugList.value = plugList.value.concat(res.data);
};
const searchPlug = v => {
  getTableData(v);
};

const choseTemp = async v => {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  const res = await deviceConfigEdit({ device_template_id: v, id: props.configInfo.id });
  if (!res.error) {
    emit('upDateConfig');
  }
};
const toTemplate = () => {
  routerPushByKey('device_template');
};
onMounted(async () => {
  await getTableData('');
  const res = await deviceConfigInfo({ id: props.configInfo.id });
  selectValue.value = res.data.device_template_id;
});
</script>

<template>
  <div class="attribute-box">
    <NFlex align="center">
      <div>{{ $t('generate.bind-device-function-template') }}</div>
      <NSelect
        v-model:value="selectValue"
        class="w-300px"
        value-field="id"
        label-field="name"
        :options="plugList"
        filterable
        @update:value="choseTemp"
        @search="
          v => {
            searchPlug(v);
          }
        "
      />
      <div class="to-create" @click="toTemplate">{{ $t('generate.not-found-create') }}</div>
    </NFlex>
  </div>
</template>

<style scoped lang="scss">
.attribute-box {
  padding: 50px 10px;

  .to-create {
    color: #999999;
  }

  .to-create:hover {
    cursor: pointer;
    text-decoration: underline;
    color: #646cff;
  }

  .m-b-10 {
    margin-bottom: 10px;
  }
}

.pagination-box {
  display: flex;
  justify-content: flex-end;
}

.m-tb-10 {
  margin: 10px 0;
}

.w-300px {
  width: 300px;
  margin: 0 15px;
}

.w-500 {
  width: 500px;
}
</style>
