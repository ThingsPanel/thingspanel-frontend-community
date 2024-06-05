## 1. 目录结构

```
**cards 2.0**                               // 卡片2.0目录入口，在/src下
│
├── **chart-card**                          // 图表卡片目录
│ ├── **demo1**                             // 单个卡片示例目录，
│ │ ├── `card-config-form.vue`              // 单个卡片的配置文件，
│ │ ├── `index.ts`                          // 单个卡片的定义文件，用于卡片收集
│ │ ├── `index.vue`                         // 单个卡片的UI文件，
│ │ └── `poster.png`                        // 大哥卡片的缩略图
│ └── `index.ts`                            // 图表卡片目录里所有卡片的📱
│
├── **plugins-card**                        // 插件卡片目录，内部结构同图表卡片目录
│
├── **system-card**                         // 系统卡片目录，内部结构同图表卡片目录
│
├── **modules**                             // 卡片公共组件，如果是单个卡片本身的，建议放卡片文件中
│ ├── `card-base-form.vue`                  // 基础配置，迭代改它
│ ├── `card-data-source-form.vue`           // 数据源配置，迭代改它
│ └── `device-selector.vue`                 // 设备指标选择器，迭代改它，用在数据源配置文件中的设备选择
│── **store**                               // 卡片的公共数据仓库文件夹
│ ├── `kan-ban-store.ts`                    // 这是一个仓库，目的就是为了根据id找到卡片的的定义
├── `card.d.ts`                             // 卡片的类型定义，迭代后需要改每个卡片的配置文件index.ts
├── `card-constants.ts`                     // 卡片的常量，定义卡片常量可以放这里，暂时没用到
├── `card2.0-readme.md`                     // 卡片2.0开发必读说明
```

## 2. 卡片类型

```typescript
export type CardType = 'system' | 'plugins' | 'chart';
export type SceneType = 'mobile' | 'pc' | 'all';

export interface CardItemBase {
  type: CardType; // 卡片类型
  id: string; // 卡片唯一标识，按照card_type_cardName命名不会错
  cardName: string; // 卡片名字
  renderID?: string;// 渲染Id，一般不配，在看板中或者数据提交的时候，加上
  sourceNumber: number; // 数据个数，必须限制，开发卡片时想好，可修改
  basicSettings?: {
    defaultTitle?: string; // 卡片标题 尽量使用国际化标题
    showTitle?: boolean;   // 卡片标题是否显示
  }; // 初始标题 可以不定义
  scene?: SceneType; // 'mobile' | 'pc' | 'all';
  minWH?: {
    minW: number | -1; // 卡片最小宽度，数字则表示占几列，当前默认共24列
    minH: number | -1; // 卡片最小高度，数字则表示占几行，当前默认单行高度30px
  };
  preset?: Record<string, any>; // 初始设定,可自定义
}

export interface CardItem {
  cardItemBase: CardItemBase;//卡片的基础属性，就是上面的CardItemBase
  poster: any; //示例图 一般就是 ./poster.png 尺寸比例16:9即可 尽量统一，引入正确即可
  component: any; // 卡片组件，一般就是 ./index.vue  ，名字可以随便，但是index.ts内要引用正确
  configForm: any; // 卡片配置文件，一般就是 card-config.vue 名字可以随便，但是index.ts内要引用正确
}

```

## 3. 卡片配置，

### 配置参考示例，一般基础配置必须有，其他的根据实际情况做

```vue

<script setup lang="ts">
  // 引入 Vue 的 inject 和 onMounted 方法
  import {inject, onMounted} from 'vue';
  // 引入自定义组件
  import CardBaseForm from '@/cards2.0/modules/card-base-form.vue';
  import CardDataSourceForm from '@/cards2.0/modules/card-data-source-form.vue';
  // 引入 TypeScript 类型定义
  import type {CardData, IConfigCtx} from '@/components/tp-kan-ban/kan-ban';
  // 引入多语言支持函数
  import {$t} from '@/locales';

  // 控制台打印多语言函数，用于调试
  console.log($t);

  // 定义组件接收的 props
  const props = defineProps<{
    data: CardData; // props.data 是 CardData 类型
  }>();

  // 固定写法开始
  // 通过 inject 获取全局上下文对象，这里的 'kan-ban-config-ctx' 是在祖先组件中提供的
  const ctx = inject<IConfigCtx>('kan-ban-config-ctx')!;
  // ctx.config 会传递给看板编辑器
  // 定义修改看板配置的方法
  const changeCtxConfig = (key: string, data: any) => {
    ctx.config[key] = {...data};
  }; // 改变 ctx.config 的方法
  // 固定写法结束

  // 组件挂载时执行
  onMounted(() => {
    // 初始化看板配置为传入的 props.data.config
    ctx.config = props.data.config;
  });
</script>

<template>
  <!-- 使用 Naive UI 的标签页组件 -->
  <n-tabs
    class="card-tabs"
    default-value="basic"
    size="large"
    animated
    pane-wrapper-style="margin: 0 -4px"
    pane-style="padding-left: 4px; padding-right: 4px; box-sizing: border-box;"
  >
    <!-- 基础配置标签页 必须有-->
    <n-tab-pane name="basic" tab="基础配置">
      <!-- 嵌入 CardBaseForm 组件，传递基础配置数据和修改配置的方法 -->
      <CardBaseForm :default-basis-data="props.data.config.basis" :change-ctx-config="changeCtxConfig"/>
    </n-tab-pane>
    <!-- 数据源配置标签页 可以没有，直接按下面的引入就行-->
    <n-tab-pane name="source" tab="数据源">
      <!-- 嵌入 CardDataSourceForm 组件，传递数据源配置数据和修改配置的方法 -->
      <CardDataSourceForm
        :max-source-number="props.data.sourceNumber || 9"
        :default-source-data="props.data.config.source"
        :change-ctx-config="changeCtxConfig"
      />
    </n-tab-pane>
    <!-- 卡片配置标签页 可以没有，需要自己编辑-->
    <n-tab-pane name="card-config" tab="卡片配置">
      <!-- 需要用户编写配置的区域 -->
      <NForm :model="ctx.config.cardUI">
        <NFormItem>
          <!-- 绑定输入框与卡片 UI 配置 -->
          <n-input v-model:value="ctx.config.cardUI.text"></n-input>
        </NFormItem>
      </NForm>
    </n-tab-pane>
  </n-tabs>
</template>

<style scoped></style>


```

## 3. UI示例，

### 最需要注意的就是 cardData.config,的数据，其他的东西，如果需要的时候打印 cardData进行查看，后使用

```typescript
export type cardConfig = {
  basis: {
    title: string;
    showTitle: boolean;
    [propName: string]: any;
  };
  source: {
    dataSource?: any;
    [propName: string]: any;
  };
  cardUI: Record<string, any>;
  [propName: string]: any;
};


```

```Vue

<script setup lang="ts">
  // 引入Vue的生命周期钩子和响应式API
  import {onMounted, ref, watch} from 'vue';
  // 引入类型定义，这通常用于TypeScript以确保类型安全
  import type {CardData} from '@/components/tp-kan-ban/kan-ban';

  // 使用 defineProps 定义组件接收的 props
  const props = defineProps<{
    view?: boolean; // 可选的布尔类型属性view，表示某种视图状态
    card: CardData; // 必须传入的CardData类型的属性card
  }>();

  // 使用ref创建一个响应式的cardData对象，初始值为空
  const cardData = ref<CardData>();

  // 监听props.card的变化，如果变化则更新cardData的值
  watch(
    () => props.card, // 监听源
    () => {
      cardData.value = props.card; // 响应函数
    },
    {deep: true} // 开启深度监听，可以监听到对象内部属性的变化
  );

  // 组件挂载时执行
  onMounted(() => {
    cardData.value = props.card; // 初始化cardData的值为传入的props.card
  });
</script>

<template>
  <!-- 容器使用flex布局，居中对齐内容 -->
  <div class="h-full w-full flex-col items-center justify-center">
    <!-- 显示文本，文本大小由cardData中的textsize属性决定，如果没有指定则默认为12px -->
    <div :style="`font-size:${cardData?.config?.cardUI?.textsize || 12}px`">
      一张网络图片（这字的大小是{{ cardData?.config?.cardUI?.textsize || 12 }}px）
    </div>
    <!-- 显示图片，图片尺寸固定为100x100，来源于cardData中的src属性 -->
    <div>
      <n-image
        :width="100"
        :height="100"
        :src="cardData?.config?.cardUI?.src"
        class="h-full w-full"
      />
    </div>
  </div>
</template>

<style scoped></style>

```
