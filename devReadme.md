## 开发原则及规范

### 开发第一原则：尊重原作者，不要直接改原有的

### 开发第二原则：如果必须扩展，写在最后，不要随便乱插，如果觉得每次都要滚到最后麻烦，就自己建个文件，把需要引用进去即可

### 推送代码必须遵守的原则  <span style="color:red;">推送前请先进行页面测试， 并遵循先拉后推原则，推前必拉！， 没问题再进行推送</span>

----

### 代码规范

##### 命名规范

##### 1 文件和文件夹命名: 统一用小写加连字符`-`命名，多个单词用连字符连接

```
views
├── home
│   └── index.vue

```

##### 2 Vue 组件名称

- 组件名称统一用 PascalCase 法命名，多个单词首字母大写
  ```vue
  <template>
    <AppProvider>
      <RouterView class="bg-layout" />
    </AppProvider>
  </template>
  ```
- iconify 图标组件名称统一用 kebab-case 法命名，多个单词用中划线连接
  ```vue
  <template>
    <icon-mdi-emoticon />
  </template>
  ```

> 方便iconify插件直接展示图标

##### 3 构造函数、class 类、TS 类型命名：统一用 PascalCase 法命名，多个单词首字母大写

```ts
function Person() {
}

class Person {
}

type Person = {
  name: string;
};

interface Person {
  name: string;
}
```

##### 4 变量、普通函数命名：统一用 camelCase 法命名，多个单词首字母小写

```ts
let num: number = 1;

function getNum() {
}
```

##### 5 常量命名：统一用大写字母命名，多个单词用下划线连接

```ts
const MAX_COUNT = 10;
```

##### 6 样式的命名：统一用小写字母命名，多个单词用中划线连接

```css
.container {
}

.container-item {
}
```

---

---

## 开发相关说明

### 项目环境需求

##### 1 谷歌浏览器请升级到最新

##### 浏览器支持

本地开发推荐使用`Chrome 90+` 浏览器

支持现代浏览器, 不支持 IE

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/archive/internet-explorer_9-11/internet-explorer_9-11_48x48.png" alt="IE" width="24px" height="24px"  />](http://godban.github.io/browsers-support-badges/)IE | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt=" Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)Safari |
|:-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|:-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|:------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|:--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------:|
|                                                                                                                not support                                                                                                                |                                                                                          last 2 versions                                                                                          |                                                                                               last 2 versions                                                                                                |                                                                                             last 2 versions                                                                                              |                                                                                             last 2 versions                                                                                              |

##### 2 nodejs  v18 以上，建议使nodejs用多版本管理器  npm  使用方法 谷歌 百度搜一些，或者参照：[https://blog.csdn.net/qq_41904629/article/details/123552090](https://blog.csdn.net/qq_41904629/article/details/123552090)

确保你的环境满足以下要求：

- **git**: 你需要git来克隆和管理项目版本。
- **NodeJS**: >=18.0.0，推荐 18.19.0 或更高。
  > 你可以使用 [volta](https://volta.sh/) 或 [fnm](https://github.com/Schniz/fnm) 来管理你的NodeJS版本。
- **pnpm**: >= 8.0.0，推荐最新版本。

---

---

### 开发建议 ：

##### 1 类型文件件建在自己的文件夹里，使用引用方式 用原有的类型

##### 2 因为是联合开发，拉完代码有人装了包你也不知道，所有 直接使用 这个命令 `pnpm i && pnpm` dev会先装包后跑

##### 2 VSCode插件建议

##### 本项目推荐使用 VSCode 进行开发，项目里面已内置 VSCode 配置，包含推荐的插件和设置。

##### 以下为推荐的插件：

- [Auto Close Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-close-tag) - 自动添加 HTML/XML
  结束标签
- [Auto Complete Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-complete-tag) - 为 HTML/XML
  添加关闭标签和自动重命名成对的标签
- [Auto Rename Tag](https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag) - 自动重命名成对的
  HTML/XML 标签
- [Color Highlight](https://github.com/naumovs/vscode-ext-color-highlight) - 颜色高亮插件
- [DotENV](https://marketplace.visualstudio.com/items?itemName=mikestead.dotenv) - 高亮.env 文件
- [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig) -
  统一不同编辑器的一些配置
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) - 代码检查
- [Git Graph](https://marketplace.visualstudio.com/items?itemName=mhutchie.git-graph) - Git 图形化操作工具
- [GitLens — Git supercharged](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) - 显示具体某行代码的
  git 信息
- [Icônes](https://marketplace.visualstudio.com/items?itemName=afzalsayed96.icones) - 搜索 iconify 图标的插件
- [Iconify IntelliSense](https://marketplace.visualstudio.com/items?itemName=antfu.iconify) - Iconify 图标实时显示的插件
- [i18n Ally](https://marketplace.visualstudio.com/items?itemName=Lokalise.i18n-ally) - i18n 国际化插件
- [javascript console utils](https://marketplace.visualstudio.com/items?itemName=whtouche.vscode-js-console-utils) -
  提供快捷键 ctrl+l 直接输入 console.log()
- [Material Icon Theme](https://marketplace.visualstudio.com/items?itemName=PKief.material-icon-theme) -
  图标主题，显示文件和文件多种图标
- [One Dark Pro](https://marketplace.visualstudio.com/items?itemName=zhuangtongfa.Material-theme) - 主题
- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) - 代码格式化插件
- [UnoCSS](https://marketplace.visualstudio.com/items?itemName=antfu.unocss) - unocss 写法提示插件
- [Vue Language Features (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) - Vue 服务插件
- [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin) -
  Vue 的 TS 服务插件
- [Vue VSCode Snippets](https://marketplace.visualstudio.com/items?itemName=sdras.vue-vscode-snippets) - vue2、vue3 写法提示

---

---

### 目录说明

```
ThingsPanel
├── .vscode                        //vscode插件和设置
│   ├── extensions.json            //vscode推荐的插件
│   ├── launch.json                //debug配置文件(debug Vue 和 TS)
│   └── settings.json              //vscode配置(在该项目中生效，可以复制到用户配置文件中)
├── build                          //vite构建相关配置和插件
│   ├── config                     //构建打包配置
│   │   └── proxy.ts               //网络请求代理
│   └── plugins                    //构建插件
│       ├── index.ts.432432               //插件汇总
│       ├── router.ts              //elegant-router插件
│       ├── unocss.ts              //unocss插件
│       └── unplugin.ts            //自动导入UI组件、自动解析iconify图标、自动解析本地svg作为图标
├── packages                       //子项目
│   ├── axios                      //网络请求封装
│   ├── color-palette              //颜色调色板
│   ├── hooks                      //组合式函数hooks
│   ├── materials                  //组件物料
│   ├── ofetch                     //网络请求封装
│   ├── scripts                    //脚本
│   ├── uno-preset                 //uno-preset配置
│   └── utils                      //工具函数
├── public                         //公共目录(文件夹里面的资源打包后会在根目录下)
│   └── favicon.svg                //网站标签图标
├── src
│   ├── assets                     //静态资源
│   │   ├── imgs                   //图片
│   │   └── svg-icon               //本地svg图标
│   ├── components                 //全局组件
│   │   ├── advanced               //高级组件
│   │   ├── common                 //公共组件
│   │   └── custom                 //自定义组件
│   ├── constants                  //常量
│   │   ├── app.ts                 //app常量
│   │   ├── business.ts            //业务常量
│   │   ├── common.ts              //通用常量
│   │   └── reg.ts                 //正则常量
│   ├── enums                      //枚举
│   ├── hooks                      //组合式的函数hooks
│   │   ├── chart                  //图表
│   │   │   └── use-echarts        //echarts
│   │   └── common                 //通用hooks
│   │       ├── form               //表单
│   │       ├── router             //路由
│   │       └── table              //表格
│   ├── layouts                    //布局组件
│   │   ├── base-layout            //基本布局(包含全局头部、多页签、侧边栏、底部等公共部分)
│   │   ├── blank-layout           //空白布局组件(单个页面)
│   │   ├── hooks                  //布局组件的hooks
│   │   └── modules                //布局组件模块
│   │       ├── global-breadcrumb  //全局面包屑
│   │       ├── global-content     //全局主体内容
│   │       ├── global-footer      //全局底部
│   │       ├── global-header      //全局头部
│   │       ├── global-logo        //全局Logo
│   │       ├── global-menu        //全局菜单
│   │       ├── global-sider       //全局侧边栏
│   │       ├── global-tab         //全局标签页
│   │       └── theme-drawer       //主题抽屉
│   ├── locales                //国际化配置
│   │   ├── langs              //语言文件
│   │   ├── dayjs.ts           //dayjs的国际化配置
│   │   ├── locale.ts          //语言文件汇总
│   │   └── naive.ts           //NaiveUI的国际化配置
│   ├── plugins                //插件
│   │   ├── assets.ts          //各种依赖的静态资源导入(css、scss等)
│   │   ├── dayjs.ts           //dayjs插件
│   │   ├── iconify.ts         //iconify插件
│   │   ├── loading.ts         //全局初始化时的加载插件
│   │   └── nprogress.ts       //顶部加载条nprogress插件
│   ├── router                 //vue路由
│   │   ├── elegant            //elegant-router插件生成的路由声明、导入和转换等文件
│   │   ├── guard              //路由守卫
│   │   ├── routes             //路由声明入口
│   │   └── index.ts.432432           //路由入口
│   ├── service                //网络请求
│   │   ├── api                //接口api
│   │   └── request            //封装的请求函数
│   ├── store                  //pinia状态管理
│   │   ├── modules            //状态管理划分的模块
│   │   │   ├── app            //app状态(页面重载、菜单折叠、项目配置的抽屉)
│   │   │   ├── auth           //auth状态(用户信息、用户权益)
│   │   │   ├── route          //route状态(动态路由、菜单、路由缓存)
│   │   │   ├── tab            //tab状态(多页签、缓存页面的滚动位置)
│   │   │   └── theme          //theme状态(项目主题配置)
│   │   └── plugins            //状态管理插件
│   ├── styles                 //全局样式
│   │   ├── css                //css
│   │   └── scss               //scss
│   ├── theme                  //主题配置
│   │   ├── settings.ts        //主题默认配置及覆盖配置
│   │   └── vars.ts            //主题token对应的css变量
│   ├── typings                //TS类型声明文件(*.d.ts)
│   │   ├── api.d.ts           //请求接口返回的数据的类型声明
│   │   ├── app.d.ts           //应用相关的类型声明
│   │   ├── common.d.ts        //通用类型声明
│   │   ├── components.d.ts    //自动导入的组件的类型声明
│   │   ├── elegant-router.d.ts//插件elegant-router生成的路由声明
│   │   ├── env.d.ts           //vue路由描述和请求环境相关的类型声明
│   │   ├── global.d.ts        //全局通用类型
│   │   ├── naive-ui.d.ts      //NaiveUI类型
│   │   ├── router.d.ts        //Vue的路由描述的类型声明
│   │   ├── storage.d.ts       //本地缓存的数据类型
│   │   └── union-key.d.ts     //联合类型
│   ├── utils                  //全局工具函数(纯函数，不含状态)
│   │   ├── common             //通用工具函数
│   │   ├── icon               //图标相关工具函数
│   │   └── storage            //存储相关工具函数
│   ├── views                  //页面
│   │   ├── _builtin           //系统内置页面：登录、异常页等
│   │   ├── about              //关于
│   │   ├── function           //功能
│   │   ├── home               //首页
│   │   ├── manage             //系统管理
│   │   ├── multi-menu         //多级菜单
│   │   └── user-center        //用户中心
│   ├── App.vue                //vue文件入口
│   └── main.ts                //项目入口ts文件
├── .editorconfig              //统一编辑器配置
├── .env                       //环境文件
├── .env.development           //开发环境的环境文件
├── .env.production            //生产环境的环境文件
├── .eslintignore              //忽略eslint检查的配置文件
├── .gitignore                 //忽略git提交的配置文件
├── .npmrc                     //npm配置
├── env-config.ts              //请求环境的配置文件
├── eslint.config.js           //eslint flat配置文件
├── index.html                 //html文件
├── package.json               //npm依赖描述文件
├── pnpm-lock.yaml             //npm包管理器pnpm依赖锁定文件
├── README.md                  //项目介绍文档
├── README.zh-CN.md            //项目介绍文档(中文)
├── tsconfig.json              //TS配置
├── uno.config.ts              //原子css框架unocss配置
└── vite.config.ts             //vite配置
```

---

---

### 页面开发：

#### 在[src/views](src/views)创建页面文件即可，如果不想生成路由或类型的文件，请使用 modules创建文件夹，而不是 components

---

---

### mock相关：

##### 请尽量使用 https://apifox.com/ ，在 [env.config.ts](env.config.ts)，修改 `const mockURL = 'https://mock.apifox.com/m1/4080832-0-default';`

##### 并将该文件排除提交
---

---

### 类型概览：

##### 01 国际化类型:[src/typings/app.d.ts](src/typings/app.d.ts)   type（App.I18n.Schema）

##### 02 接口类型:[src/typings/api.d.ts](src/typings/api.d.ts)

##### 03 路由类型:[src/typings/elegant-router.d.ts](src/typings/elegant-router.d.ts)

##### 04 RouteMeta类型:[src/typings/elegant-router.d.ts](src/typings/elegant-router.d.ts)

##### 05 全局类型:[src/typings/elegant-router.d.ts](src/typings/elegant-router.d.ts])

##### 06 缓存数据类型:[src/typings/storage.d.ts](src/typings/storage.d.ts) 缓存的数据类型需要预先在 src/typings/storage.d.ts 里面定义好

##### 99 其他应该是迁移而来，用到自行分析

基本不用动 的类型

##### 07 组件类型:[src/typings/components.d.ts](src/typings/components.d.ts)  不要动，只要在views里 基本都是自己生成的

##### 08 naive-ui类型:[src/typings/naive-ui.d.ts](src/typings/naive-ui.d.ts)

基本不会用的类型

##### 09  package类型:[src/typings/naive-ui.d.ts](src/typings/naive-ui.d.ts)  作者有个 package 二次封装了一些库的功能，跟这个有关，不明白就不动即可

##### 10 环境类型:[src/typings/env.d.ts](src/typings/env.d.ts)  尽量不动 ，估计业务层开发也用不上

##### 11 联合密钥:[src/typings/union-key.d.ts](src/typings/union-key.d.ts) 作者用的一些类型吧，应该用不上

---



---

### 系统路由说明

#### 本系统的路由基于插件 [Elegant Router](https://github.com/soybeanjs/elegant-router)，详细用法请查看插件文档。

#### 1自动生成

##### 启动项目后，插件会自动生成 src/router/elegant 目录，该目录下的文件为自动生成的路由导入、路由定义和路由转换的文件

#### 2 路由创建

##### 命令创建

##### 通过执行 `pnpm gen-route` 命令，可以快速创建路由文件

##### **路由名称的命名规则**

##### - 一级路由: `demo`, `demo-page`, `route1`

##### > 名称为小写加连字符`-`的形式

##### - 二级路由: `demo2_child`, `demo2-page_child`, `route2_child`

##### > 路由的层级用下划线`_`分隔，两边仍然遵守一级路由的命名规则

##### - 三级及三级以上路由: `demo3_child_child`, `demo3-page_child_child_child`

##### 手动创建

##### **手动创建路由文件，需要遵循以下规则：**

##### 每层路由的文件夹名称为路由名称，文件夹下的 index.vue 或者 [id].vue 为路由组件

#### 路由详解

##### 一级路由(单级路由)

##### 文件夹结构

```
views
├── about
│   └── index.vue
```

##### 生成的路由

```ts
{
  name: 'about',
    path
:
  '/about',
    component
:
  'layout.base$view.about',
    meta
:
  {
    title: 'about'
  }
}
,
```

##### > 它是一个单级路由，为了添加布局，组件属性将布局和视图组件组合在一起，用美元符号“$”分割

##### 转换成的Vue路由

```ts
{
  path: '/about',
    component
:
  BaseLayout,
    children
:
  [
    {
      name: 'about',
      path: '',
      component: () => import('@/views/about/index.vue'),
      meta: {
        title: 'about'
      }
    }
  ]
}
,
```

##### 二级路由

##### 文件夹结构

```
views
├── list
│   ├── home
│   │   └── index.vue
│   ├── detail
│   │   └── index.vue
```

##### **错误示例**

```
views
├── list
│   ├── index.vue
│   ├── detail
│   │   └── index.vue
```

> 请不要出现上述 index.vue 和文件夹同级的情况，这种情况不在约定的规则中

##### 生成的路由

```ts
{
  name: 'list',
    path
:
  '/list',
    component
:
  'layout.base',
    meta
:
  {
    title: 'list'
  }
,
  children: [
    {
      name: 'list_home',
      path: '/list/home',
      component: 'view.list_home',
      meta: {
        title: 'list_home'
      }
    },
    {
      name: 'list_detail',
      path: '/list/detail',
      component: 'view.list_detail',
      meta: {
        title: 'list_detail'
      }
    }
  ]
}
```

##### > 二级路由的路由数据也是有两层的，第一层路由是布局组件，第二层路由是页面组件

##### 转换成的Vue路由

```ts
{
  name: 'list',
    path
:
  '/list',
    component
:
  BaseLayout,
    redirect
:
  {
    name: 'list_home'
  }
,
  meta: {
    title: 'list'
  }
,
  children: [
    {
      name: 'list_home',
      path: '/list/home',
      component: () => import('@/views/list/home/index.vue'),
      meta: {
        title: 'list_home'
      }
    },
    {
      name: 'list_detail',
      path: '/list/detail',
      component: () => import('@/views/list/detail/index.vue'),
      meta: {
        title: 'list_detail'
      }
    }
  ]
}
,
```

##### > 路由数据的第一层包含重定向的配置，默认重定向到第一个子路由

##### 多级路由（三级路由及以上）

##### 文件夹结构

##### - 文件夹层级深

```
views
├── multi-menu
│   ├── first
│   │   ├── child
│   │   │   └── index.vue
│   ├── second
│   │   ├── child
│   │   │   ├── home
│   │   │   │   └── index.vue
```

##### - 两层文件夹层级（推荐）

```
views
├── multi-menu
│   ├── first_child
│   │   └── index.vue
│   ├── second_child_home
│   │   └── index.vue
```

##### > 通过下划线符号 `_` 来分割路由层级，这样可以避免文件夹层级过深

##### 生成的路由

```ts
{
  name: 'multi-menu',
    path
:
  '/multi-menu',
    component
:
  'layout.base',
    meta
:
  {
    title: 'multi-menu'
  }
,
  children: [
    {
      name: 'multi-menu_first',
      path: '/multi-menu/first',
      meta: {
        title: 'multi-menu_first'
      },
      children: [
        {
          name: 'multi-menu_first_child',
          path: '/multi-menu/first/child',
          component: 'view.multi-menu_first_child',
          meta: {
            title: 'multi-menu_first_child'
          }
        }
      ]
    },
    {
      name: 'multi-menu_second',
      path: '/multi-menu/second',
      meta: {
        title: 'multi-menu_second'
      },
      children: [
        {
          name: 'multi-menu_second_child',
          path: '/multi-menu/second/child',
          meta: {
            title: 'multi-menu_second_child'
          },
          children: [
            {
              name: 'multi-menu_second_child_home',
              path: '/multi-menu/second/child/home',
              component: 'view.multi-menu_second_child_home',
              meta: {
                title: 'multi-menu_second_child_home'
              }
            }
          ]
        }
      ]
    }
  ]
}
```

##### > 如果路由层级大于 2，生成的路由数据是一个递归结构

##### 转换成的Vue路由

```ts
{
  name: 'multi-menu',
    path
:
  '/multi-menu',
    component
:
  BaseLayout,
    redirect
:
  {
    name: 'multi-menu_first'
  }
,
  meta: {
    title: 'multi-menu'
  }
,
  children: [
    {
      name: 'multi-menu_first',
      path: '/multi-menu/first',
      redirect: {
        name: 'multi-menu_first_child'
      },
      meta: {
        title: 'multi-menu_first'
      }
    },
    {
      name: 'multi-menu_first_child',
      path: '/multi-menu/first/child',
      component: () => import('@/views/multi-menu/first_child/index.vue'),
      meta: {
        title: 'multi-menu_first_child'
      }
    },
    {
      name: 'multi-menu_second',
      path: '/multi-menu/second',
      redirect: {
        name: 'multi-menu_second_child'
      },
      meta: {
        title: 'multi-menu_second'
      },
    },
    {
      name: 'multi-menu_second_child',
      path: '/multi-menu/second/child',
      redirect: {
        name: 'multi-menu_second_child_home'
      },
      meta: {
        title: 'multi-menu_second_child'
      },
    },
    {
      name: 'multi-menu_second_child_home',
      path: '/multi-menu/second/child/home',
      component: () => import('@/views/multi-menu/second_child_home/index.vue'),
      meta: {
        title: 'multi-menu_second_child_home'
      }
    }
  ]
}
```

##### > 转换的 Vue 路由只有两层，第一层是布局组件，第二层是重定向路由或者页面路由

##### 忽略文件夹的聚合路由

##### 以下划线 `_` 开头的文件夹名称会被忽略，不会出现在路由中，其下的文件会被聚合到上一级的路由中

##### 文件夹结构

```
views
├── _error
│   ├── 403
│   │   └── index.vue
│   ├── 404
│   │   └── index.vue
│   ├── 500
│   │   └── index.vue
```

##### 生成的路由

```ts
{
  name: '403',
    path
:
  '/403',
    component
:
  'layout.base$view.403',
    meta
:
  {
    title: '403'
  }
}
,
{
  name: '404',
    path
:
  '/404',
    component
:
  'layout.base$view.404',
    meta
:
  {
    title: '404'
  }
}
,
{
  name: '500',
    path
:
  '/500',
    component
:
  'layout.base$view.500',
    meta
:
  {
    title: '500'
  }
}
```

##### 参数路由

##### 文件夹结构

```
views
├── user
│   └── [id].vue
```

##### 生成的路由

```ts
{
  name: 'user',
    path
:
  '/user/:id',
    component
:
  'layout.base$view.user',
    props
:
  true,
    meta
:
  {
    title: 'user'
  }
}
```

##### 高级的参数路由

```ts
import type {RouteKey} from "@elegant-router/types";

ElegantVueRouter({
  routePathTransformer(routeName, routePath) {
    const routeKey = routeName as RouteKey;

    if (routeKey === "user") {
      return "/user/:id(\\d+)";
    }

    return routePath;
  },
});
```

##### 自定义路由

自定义路由只用于生成路由声明，不会生成路由文件，需要手动创建路由文件

##### 自定义路由配置

```ts
ElegantVueRouter({
  customRoutes: {
    map: {
      root: "/",
      notFound: "/:pathMatch(.*)*",
    },
    names: ["two-level_route"],
  },
});
```

##### **生成的路由key**

```ts
type RouteMap = {
  root: "/";
  notFound: "/:pathMatch(.*)*";
  "two-level": "/two-level";
  "two-level_route": "/two-level/route";
};

type CustomRouteKey = "root" | "notFound" | "two-level" | "two-level_route";
```

##### 自定义路由的component

##### **复用已经存在的页面路由component**

```ts
import type {CustomRoute} from "@elegant-router/types";

const customRoutes: CustomRoute[] = [
  {
    name: "root",
    path: "/",
    redirect: {
      name: "403",
    },
  },
  {
    name: "not-found",
    path: "/:pathMatch(.*)*",
    component: "layout.base$view.404",
  },
  {
    name: "two-level",
    path: "/two-level",
    component: "layout.base",
    children: [
      {
        name: "two-level_route",
        path: "/two-level/route",
        component: "view.about",
      },
    ],
  },
];
```

#### 路由 component

##### 布局组件

- **layout.base**: 具有公共部分的布局，如全局头部、侧边栏、底部等

- **layout.blank**: 空白布局

##### 页面组件

- **view.[RouteKey]**: 页面组件
  > 例如：`view.home`, `view.multi-menu_first_child`

##### 布局和页面的混合组件

- **layout.base$view.[RouteKey]**: 布局和页面的混合组件
  > 例如：`layout.base$view.home`, `layout.base$view.multi-menu_first_child`

::: tip 提示
该类型组件表示单级路由
:::

#### 类型说明

##### 1. type RouteKey

**解释：**

联合类型 RouteKey 声明所有的路由 key，方便统一管理路由，
该类型由插件 [Elegant Router](https://github.com/soybeanjs/elegant-router) 根据 views 下面的页面文件自动生成

::: tip 代码位置
src/typings/elegant-router.d.ts
:::

##### 2. type RoutePath

**解释：**

路由的路径 path，该类型与 RouteKey 一一对应

##### 3. type RouteMeta

```typescript
// 路由元信息接口
interface RouteMeta {
  /**
   * 路由标题
   *
   * 可用于文档标题中
   */
  title: string;
  /**
   * 路由的国际化键值
   *
   * 如果设置，将用于i18n，此时title将被忽略
   */
  i18nKey?: App.I18n.I18nKey;
  /**
   * 路由的角色列表
   *
   * 当前用户拥有至少一个角色时，允许访问该路由，角色列表为空时，表示无需权限
   */
  roles?: string[];
  /** 是否缓存该路由 */
  keepAlive?: boolean;
  /**
   * 是否为常量路由
   *
   * 无需登录，并且该路由在前端定义
   */
  constant?: boolean;
  /**
   * Iconify 图标
   *
   * 可用于菜单或面包屑中
   */
  icon?: string;
  /**
   * 本地图标
   *
   * 存在于 "src/assets/svg-icon" 目录下，如果设置，将忽略icon属性
   */
  localIcon?: string;
  /** 路由排序顺序 */
  order?: number;
  /** 路由的外部链接 */
  href?: string;
  /** 是否在菜单中隐藏该路由 */
  hideInMenu?: boolean;
  /**
   * 进入该路由时激活的菜单键
   *
   * 该路由不在菜单中
   *
   * @example
   *   假设路由是"user_detail"，如果设置为"user_list"，则会激活"用户列表"菜单项
   */
  activeMenu?: import('@elegant-router/types').RouteKey;
  /** 默认情况下，相同路径的路由会共享一个标签页，若设置为true，则使用多个标签页 */
  multiTab?: boolean;
  /** 若设置，路由将在标签页中固定显示，其值表示固定标签页的顺序 */
  fixedIndexInTab?: number;
}
```

::: tip 提示
icon 图标值从这里获取：[https://icones.js.org/](https://icones.js.org/)
:::

#### 注意

##### 如果在 views 中创建了一个路由页面，在别的地方调用但不在菜单那边显示,那么需要设置 meta 中的 `hideInMenu: true`

```typescript
{
  name: '403',
    path
:
  '/403',
    component
:
  'layout.blank$view.403',
    meta
:
  {
    title: '403',
      i18nKey
  :
    'route.403',
      hideInMenu
  :
    true
  }
}
```

---

---

### 系统图标

##### 图标渲染原理

基于 iconify 的 svg 的 json 数据，通过 unplugin-icons 插件，将 svg 数据转换成 vue 组件

- [unplugin-icons](https://github.com/antfu/unplugin-icons)
- [iconify](https://github.com/iconify/iconify)
- [Journey with Icons Continues](https://antfu.me/posts/journey-with-icons-continues)

#### 图标教程

##### 一、静态用法：直接写在 template 中

- **iconify**

  - 安装 vscode
    智能提示的插件: [Iconify IntelliSense](https://marketplace.visualstudio.com/items?itemName=antfu.iconify)

  - 找图标：网址 [https://icones.js.org/](https://icones.js.org/) 或者 vscode
    安装 - [Icônes](https://marketplace.visualstudio.com/items?itemName=afzalsayed96.icones)

  - 确定图标名字：找到图标后复制名字 如：'mdi:emoticon' 或者 'mdi-emoticon'，则对应的 vue 的 template 为

    ```html
    <div>
      <icon-mdi-emoticon class="text-24px text-red" />
      <icon-mdi:emoticon style="font-size:24px;color:#f00;" />
    </div>
    ```

    ::: tip 提示
    'icon-' 为预设的前缀, 在.env 里面设置变量 VITE_ICON_PREFFIX
    :::

  - 设置样式：同 html 标签一样直接应用 style 属性或者 class 属性; 通过设置 color 和 font-size 属性设置对应的颜色和大小

- **本地 svg 图标**

  - 在 src/assets/svg-icon 目录下选择一个 svg，取它的文件名，例如: 'custom-icon.svg'

  - 则对应的 vue 的 template 为

    ```html
    <icon-local-custom-icon class="text-24px text-red" />
    ```

    ::: tip 提示
    'icon-local' 为预设的前缀, 在.env 里面设置变量 VITE_ICON_LOCAL_PREFFIX
    :::

##### 二、动态渲染: 根据图标名称渲染对应图标

- **iconify**

  - 确定图标名字，如：'mdi-emoticon'

  - 动态渲染

    ```html
    <svg-icon icon="mdi-emoticon" />
    ```

  - 多个图标动态渲染

    ```html
    <svg-icon
      v-for="icon in icons"
      :key="icon"
      :icon="icon"
      class="text-24px text-red"
    />
    ```

- **本地 svg 图标**

  - 确定 svg 文件名，例如: 'custom-icon.svg'

  - 动态渲染

    ```html
    <svg-icon local-icon="custom-icon" style="font-size:24px;color:#f00;" />
    ```

    ::: tip 提示
    svg-icon 为全局组件，已经注册过了，直接在 template 中应用，icon 属性为 iconify 图标名称, local-icon 为本地 svg 图标的文件名
    :::

##### 三、通过 render 函数渲染: 适用于 NaiveUI 的图标渲染

- 确定图标名字，如：iconify: **'mdi-emoticon'**, 或者本地 svg 图标 'custom-icon.svg'

  - 使用 **useSvgIconRender**

    ::: tip 代码位置
    packages/hooks/src/use-svg-icon-render.ts
    :::

    ```typescript
    import { useSvgIconRender } from '@sa/hooks';
    import SvgIcon from '@/components/custom/svg-icon.vue';

    const { SvgIconVNode } = useSvgIconRender(SvgIcon);

    SvgIconVNode({ icon: 'ant-design:close-outlined', fontSize: 18 }); // iconify

    SvgIconVNode({ localIcon: "custom-icon" }); // 本地svg图标
    ```

---


---

### 系统主题

##### 系统主题的实现分为两个部分，一部分是组件库的主题配置，另一部分是 UnoCSS 的主题配置。为了统一两个部分的主题配置，在这之上维护了一些主题配置，通过这些主题配置分别控制组件库和 UnoCSS 的主题配置。

##### 原理

- 定义一些主题配置的变量，包括各种主题颜色，布局的参数配置等
- 通过这些配置产出符合组件库的主题变量
- 通过这些配置产出一些主题 tokens 并衍生出对应的 css 变量，再将这些 css 变量传递给 UnoCSS

##### 主题配置

##### 类型定义

见 App.Theme.ThemeSetting

::: tip 代码位置
src/typings/app.d.ts
:::

##### 初始化配置

```ts
export const themeSettings: App.Theme.ThemeSetting = {
  //默认配置
}
```

::: tip 代码位置
src/theme/settings.ts
:::

##### 配置覆盖更新

当发布新的版本时，可以通过配置覆盖更新的方式，来更新主题配置

```ts
export const overrideThemeSettings: Partial<App.Theme.ThemeSetting> = {
  //覆盖配置
};
```

::: tip 代码位置
src/theme/settings.ts
:::

##### 环境说明

- 当项目处于`开发模式`时，主题配置不会被缓存，可以通过更新 `src/theme/settings.ts` 中的 `themeSettings` 来更新主题配置
  > 开发阶段为了能够实时看到主题配置的变化，所以不会缓存主题配置

- 当项目处于`生产模式`时，主题配置会被缓存到 localStorage 中
  > 每次发布新版本，可以通过更新 `src/theme/settings.ts` 中的 `overrideThemeSettings` 来覆盖更新主题配置

##### 组件库主题

##### NaiveUI 主题配置

**根据主题颜色产出组件库的主题变量**

```ts
/**
 * Get naive theme
 *
 * @param colors Theme colors
 */
function getNaiveTheme(colors: App.Theme.ThemeColor) {
  const {primary: colorLoading} = colors;

  const theme: GlobalThemeOverrides = {
    common: {
      ...getNaiveThemeColors(colors)
    },
    LoadingBar: {
      colorLoading
    }
  };

  return theme;
}

/** Naive theme */
const naiveTheme = computed(() => getNaiveTheme(themeColors.value));

```

::: tip 代码位置
src/store/modules/theme/shared.ts

src/store/modules/theme/index.ts.432432
:::

**应用主题变量**

```vue

<template>
  <NConfigProvider
    :theme="naiveDarkTheme"
    :theme-overrides="themeStore.naiveTheme"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
    class="h-full"
  >
    <AppProvider>
      <RouterView class="bg-layout"/>
    </AppProvider>
  </NConfigProvider>
</template>
```

::: tip 代码位置
src/App.vue
:::

##### AntDesignVue 主题配置

**根据主题颜色产出组件库的主题变量**

```ts
/**
 * Get antd theme
 *
 * @param colors Theme colors
 * @param darkMode Is dark mode
 */
function getAntdTheme(colors: App.Theme.ThemeColor, darkMode: boolean) {
  const {defaultAlgorithm, darkAlgorithm} = antdTheme;

  const {primary, info, success, warning, error} = colors;

  const theme: ConfigProviderProps['theme'] = {
    token: {
      colorPrimary: primary,
      colorInfo: info,
      colorSuccess: success,
      colorWarning: warning,
      colorError: error
    },
    algorithm: [darkMode ? darkAlgorithm : defaultAlgorithm],
    components: {
      Menu: {
        colorSubItemBg: 'transparent'
      }
    }
  };

  return theme;
}

/** Antd theme */
const antdTheme = computed(() => getAntdTheme(themeColors.value, darkMode.value));
```

::: tip 代码位置
src/store/modules/theme/shared.ts

src/store/modules/theme/index.ts.432432
:::

**应用主题变量**

```vue

<template>
  <ConfigProvider :theme="themeStore.antdTheme" :locale="antdLocale">
    <AppProvider>
      <RouterView class="bg-layout"/>
    </AppProvider>
  </ConfigProvider>
</template>
```

##### 主题 tokens

##### 类型定义

```ts
type ThemeToken = {
  colors: ThemeTokenColor;
  boxShadow: {
    header: string;
    sider: string;
    tab: string;
  };
};
```

::: tip 代码位置
src/typings/app.d.ts
:::

##### 基于 tokens 的 css 变量

初始化时会在 html 上生成一些 css 变量，这些 css 变量是基于主题 tokens 产出的

```ts
/** Theme vars */
export const themeVars: App.Theme.ThemeToken = {
    colors: {
      ...colorPaletteVars,
      nprogress: 'rgb(var(--nprogress-color))',
      container: 'rgb(var(--container-bg-color))',
      layout: 'rgb(var(--layout-bg-color))',
      inverted: 'rgb(var(--inverted-bg-color))',
      base_text: 'rgb(var(--base-text-color))'
    },
    boxShadow: {
      header: 'var(--header-box-shadow)',
      sider: 'var(--sider-box-shadow)',
      tab: 'var(--tab-box-shadow)'
    }
  };
```

::: tip 代码位置
src/theme/vars.ts
:::

##### UnoCSS 主题

通过上述的 `themeVars` 注入到 UnoCSS 的主题配置中

```ts
import {themeVars} from './src/theme/vars';

export default defineConfig<Theme>({
  theme: {
    ...themeVars,
  }
});

```

这样，借助于 UnoCSS 的能力，可以使用类似 `text-primary bg-primary` 等 class 名称进而统一了组件库和 UnoCSS 的主题颜色的应用。

::: tip 代码位置
./uno.config.ts
:::

##### UnoCSS 的暗黑模式

通过 UnoCSS 提供的预设暗黑模式方案, 只要在 html 上添加 class="dark"，则项目中类似于 `dark:text-#000 dark:bg-#333` 的
class 就会生效，从而达到暗黑模式的效果

```ts
export default defineConfig<Theme>({
  presets: [presetUno({dark: "class"})],
});
```

::: tip 代码位置
./uno.config.ts
:::


---

##### 样式

- 系统初始化时的加载样式通过html代码方式实现

  ::: tip 组件位置
  src/plugins/loading.ts
  :::

- 系统的 Logo 使用 SystemLogo 组件实现

  [系统图标方案](icon.md)

##### 渲染原理

创建 setupLoading 函数, 它的主要功能是设置页面加载时的动画效果。
这个加载动画包括一个系统Logo、旋转的点阵动画和标题文字，并且所有元素的颜色均基于从本地存储获取的主题色 themeColor 动态生成。
并且在DOM中查找ID为app的元素作为加载动画的挂载点, 如果找到了这个元素，则将其内部HTML替换为刚刚构建的加载动画HTML结构

```ts
export function setupLoading() {
  const themeColor = localStg.get('themeColor') || '#DB5A6B';

  const {r, g, b} = getRgbOfColor(themeColor);

  const primaryColor = `--primary-color: ${r} ${g} ${b}`;

  const loadingClasses = [
    'left-0 top-0',
    'left-0 bottom-0 animate-delay-500',
    'right-0 top-0 animate-delay-1000',
    'right-0 bottom-0 animate-delay-1500'
  ];

  const logoWithClass = systemLogo.replace('<svg', `<svg class="size-128px text-primary"`);

  const dot = loadingClasses
    .map(item => {
      return `<div class="absolute w-16px h-16px bg-primary rounded-8px animate-pulse ${item}"></div>`;
    })
    .join('\n');

  const loading = `
<div class="fixed-center flex-col" style="${primaryColor}">
  ${logoWithClass}
  <div class="w-56px h-56px my-36px">
    <div class="relative h-full animate-spin">
      ${dot}
    </div>
  </div>
  <h2 class="text-28px font-500 text-#646464">${$t('system.title')}</h2>
</div>`;

  const app = document.getElementById('app');

  if (app) {
    app.innerHTML = loading;
  }
}

```

::: tip 代码位置
src/plugins/loading.ts
:::

最后要将 setupLoading 函数注册到 main.ts 中

```typescript
async function setupApp() {
  setupLoading();
  app.mount('#app');
}
```

---

---

### 其他：请采用问答的形式进行，在这里直接提问，任何人知道的话都可直接回答，如果嫌麻烦要在群里问，请您把本次问答的内容补充在这里，做一名高素质的开发人员

## Q&A：

### 1 问： Q:最近开心吗？

##### 1 答：

A:还好，挺开心的

### 2 问： 缓存方面的问题

##### 2 答：

的项目配置默认是 localStorage , 初始化时对项目的主题涉及的数据进行持久化

项目的缓存分为两方面

LocalStorage
SessionStorage
缓存要点

对于本框架缓存方面的使用主要集中在下列几个方法中：
set：通过给方法传递必填参数 key 、value 和可选参数 expire 对数据进行缓存
get：通过给方法传递必填参数 key 获取缓存的数据
remove：通过给方法传递必填参数 key 移除指定的缓存数据
clear：通过调用该方法，清除当前所有的 Storage 相关的缓存数据
缓存的数据类型需要预先在 src/typings/storage.d.ts 里面定义好

### 3 问： 关于修改文件相关的问题

##### 3 答：

1. 当修改`.env`等环境文件及`vite.config.ts`文件时，vite 会自动重启服务。

> 但是自动重启有几率出现问题，请重新运行项目即可解决。

2. 当修改 `.vue` 或者 `.ts` 时， vite 进行热部署时有几率造成页面卡顿导致无法看到

> 实时修改的效果，`F5` 刷新即可解决

### 4 问：前端静态路由添加菜单后没显示

##### 4 答：

问题背景

项目初始化路由时，该同学的顶级路由数据 meta 中含有 `hideInMenu` 属性为 true

所以菜单和页面都无法显示出来

::: tip 组件位置
src/typings/router.d.ts
:::

跳转查看 [`RouteMeta`](../guide/router.md#类型说明)

**解决方案:**

去除 `hideInMenu` 属性即可正常显示菜单和页面

### 5 问：项目中的权限路由模式如何理解，相应的渲染路由的数据格式怎么定义

##### 5 答：

**问题背景**

项目中的权限路由模式分为：

- 静态路由

  静态路由指的是前端项目：`src/router/routes.ts` 中的路由数据
  项目能够根据在这个路径下定义进行路由数据的解析，并自动渲染出菜单信息

- 动态路由

  动态路由指的是后台项目传递过来的路由数据

> 项目使用动态路由模式进行数据渲染时，会自动覆盖路由首页的 name 值

### 6 问： Tab 页签刷新后一片空白

##### 6 答：

---

这是由于开启了路由切换动画，且对应的页面组件存在多个根元素时导致的，
可以通过在页面最外层添加一个 `<div></div>` ( 或者) 即可

❌ **错误示范**

```vue

<template>
  <!-- 注释也算一个标签节点哦  -->
  <p1></p1>
  <p2></p2>
</template>
```

✔ **正确示范**

```vue

<template>
  <div>
    <p1></p1>
    <p2></p2>
  </div>
</template>
```

### 7 问：组件命名问题

##### 7 答：

**命名规范**

- 文件命名: 统一用小写字母命名，多个单词用中划线连接

```
views
├── home
├── demo-page
```

- Vue 组件名称
  - 组件名称统一用 PascalCase 法命名，多个单词首字母大写
  ```vue
  <template>
    <AppProvider>
      <RouterView class="bg-layout" />
    </AppProvider>
  </template>
  ```
  - iconify 图标组件名称统一用 kebab-case 法命名，多个单词用中划线连接
  ```vue
  <template>
    <icon-mdi-emoticon />
  </template>
  ```
  > 方便iconify插件直接展示图标


- 构造函数、class 类、TS 类型命名：统一用 PascalCase 法命名，多个单词首字母大写

```ts
function Person() {
}

class Person {
}

type Person = {
  name: string;
};

interface Person {
  name: string;
}
```

- 变量、普通函数命名：统一用 camelCase 法命名，多个单词首字母小写

```ts
let num: number = 1;

function getNum() {
}
```

- 常量命名：统一用大写字母命名，多个单词用下划线连接

```ts
const MAX_COUNT = 10;
```

- 样式的命名：统一用小写字母命名，多个单词用中划线连接

```css
.container {
}

.container-item {
}
```

### 8 问：项目中使用 Iframe 嵌入本地的 HTML 时出现 404 的问题

##### 8 答：

问题背景

整个项目都是单页面应用，所以从路径里去加载不同的 HTML 本身就不支持，要么创建多页面应用，要么在单页面应用里通过 iframe
去加载其它的 HTML。

解决方案

集成 vite-plugin-mpa 插件。

### xx 问：

##### xx 答：

---

---

##### end
