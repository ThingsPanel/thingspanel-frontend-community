因soybean-admin 新版已发布，旧版移入分支legacy,大概率不再维护，考虑项目相关风险，做了本次迁移，
迁移后说明如下：

###### 建议：保留一份  old-version ，重新拉一下，然后切分支，放在另一个文件加里，已备不时之需

## 1迁移后如在测试，开发过程中发现bug的话，请及时在群内沟通

## 2因迁移量较大，如发现有未迁过来页面或者功能的情况，请及时在群内沟通

## 3新版路由，数据仓库配置，均有很大变化，

### a路由 ，在[src/views]()添加页面，必定触发[src/router/elegant/routes.ts]() 里按结构增加路由，

### 如果不想增加的部分，请使用modules创建文件夹，路由类型[src/typings/elegant-router.d.ts]()

### 则需要重新跑一次项目，如果不提交，不修改国际化文件，即可不用重跑项目

### b数据仓库写法发生很大变化c，另外基础的store封装到了框架底层，使用@sa/hooks ,如之前的 useBoolean, useLoading都在这里，使用前请进行简单的阅读和梳理

### c 之前的moke 弃用，请尽量使用 https://apifox.com/ ，在 [env.config.ts](env.config.ts)，修改 `const mockURL = 'https://mock.apifox.com/m1/4080832-0-default';`

### 并将该文件排除提交

## d其他：

### 之前的config，现在请在src/constants里创建，如果又为迁移过来的，请啦一个老版本（切换到old-version）上copy

### 剩下的请在开发中进行查找，或者查看[src/views]() 的示例，或者在群内讨论，

### [\src\views\_builtin]()里的文件不要进行结构上的改变，否则会引发不好处理的问题，如确实需要请使用modules创建文件夹

### 接口地址在\env.config.ts,里配置，使用方法请参考[src/views/management/setting/components/upload-image.vue]()

## 4本次迁移发现的几个问题，请之后根据实际情况改进

### a开发本着尊重作者原则，尽量不要修改作者的源文件，可参考[src/views/product]()的做法，

### 如果实在需要，外部写好后进行引用插入，这样还可以减少换底层库的成本

### b 提交前 ，先执行 `eslint ./`     然后执行   `eslint ./ --fix`，并按照提示处理错误，会让你的提交更加顺利，而且会将代码进行统一格式化

### c 开发过程中本着前端基本精神进行（尊重，开放，可扩展，交互易用性...），当你离开的时候，别人总能在你的代码上找到更多的亮点，而不是...
