# 项目说明

本项目使用Service Worker实现实时编译vue文件的功能，可以不依赖vite和webpack等脚手架也可以直接开发vue项目。

且使用[importmap](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Reference/Elements/script/type/importmap)实现模块的简化名称导入。

# 运行方法

执行npm run dev并在浏览器查看项目效果，不需要下载依赖

# 灵感来源

在[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API)中对Service Worker的描述有这样一句话：
---
Service workers 也可以用来做这些事情：
在客户端进行 CoffeeScript、LESS、CJS/AMD 等模块编译和依赖管理（用于开发目的）
---

所以想试试能不能实现对vue的编译，结果是可以的。

# 环境要求

1. 浏览器支持模块化Service Worker，即Chrome 91或以上版本（火狐不支持模块化的Service Worker）或Safari 16或以上版本

2. 开发要求安装nodejs，v10.24.1的nodejs也可以运行

# 项目自带的环境或框架

1. vue v3.5.17
2. typescript v5.8.3
3. core-js 3.40.0
4. vue-router v4.5.1
5. element-plus v2.10.2

# 功能说明
项目正常运行后，可以直接导入css, json, vue, ts四种类型的文件。

1. css: 无返回值，将css直接嵌入到html中
```js
import './a/b.css';
// 或
await import('./a/b.css');
```
注: 在chrome 123中全面支持的import-with导入css: 返回CSSStyleSheet
```js
import sheet from './a/b.css' with { type: "css" };
// 或
const { default: sheet  } = await import("./a/b.css", { with: { type: "css" } });
```

2. json: 将json文件的数据转换为js的json数据
```js
import json from './package.json'
// 或
const { default: json } = await import('./package.json');
```
注: 在chrome 123中全面支持的import-with导入json: 返回对应的json数据
```js
import json from './package.json' with { type: "json" };
// 或
const { default: json } = await import('./package.json', { with: { type: "json"} });
```

3. typescript: 返回编译后的js，同样的，在electron应用中可以导入一个node的原生模块（js文件中也可用）
```js
import xxx from './a/b.ts';
// 或
const { default: xxx } = await import('./a/b.ts');

import fs from 'node:fs';
// 或
const { default: fs } = await import('node:fs');
```

4. vue: 同vue项目的使用方法，vue文件中目前只支持使用原生js，ts和原生css
```html
<template>
    <Hello />
</template>

<script setup lang="ts">
import Hello from './Hello.vue';
// 或
const { default: Hello } = await import('./Hello.vue');
</script>
```

另外支持几种vite的查询参数功能：
1. raw: 返回资源的原始内容字符串
```js
import string from './xxx.js?raw';
// 打印该文件的字符串形式
console.log(string);
```

2. [worker](https://developer.mozilla.org/zh-CN/docs/Web/API/Worker)和[sharedworker](https://developer.mozilla.org/zh-CN/docs/Web/API/SharedWorker): 返回一个 Web Worker 或 Shared Worker 构造函数
```js
// 普通worker
import myWorker from 'url?worker';
new myWorker();

// 普通sharedworker
import myWorker2 from 'url?sharedworker';
new myWorker2();

// 模块worker
import myWorker3 from 'url?worker&module';
new myWorker3();

// 模块sharedworker
mport myWorker4 from 'url?sharedworker&module';
new myWorker4();
```

3. url: 返回资源的 URL 而不是文件内容
```js
import logoUrl from 'logo.png?url';
img.src = logoUrl;
```

# 实现原理
Service Worker可以拦截页面的所有请求并修改结果，这使得可以不依赖vite和webpack等脚手架也可以直接开发vue项目（但不包括打包和热更新等功能）。

Service Worker中，监听fetch事件，然后跟据请求路径判断要请求的文件类型。
如果没有查询参数，是vue，ts就进行编译（或从map缓存中拿结果），如果是css或者json就跟据请求体中特定字段（origin）来判断这个文件是普通的引入还是通过import引入然后修改结果。
如果有，先进行查询参数的判断和执行逻辑。

# core文件夹中的主要文件的功能

1. canUse.ts
测试文件，测试浏览器是否可以成功导入一个typescript文件

2. compiler-sfc.esm-browser.js
解析（编译）vue文件，这个文件运行在Service Worker线程中

3. core-js-bundle.js
对浏览器环境进行兼容性处理，注入低版本浏览器不支持的函数

4. element-plus.full.js 和 element-plus.css
element-plus的完整版本

5. empty-devtools-api.js
导出一个空的devtools-api

6. generate-importmap.cjs 和 importmap.js
使用importMap解析模块。执行前者生成后者，最后在html中引入

7. main.js
对浏览器环境进行最基本的判断，然后注册Service Worker和注入core.js(polyfill),以及对electron环境的一些兼容性处理

8. onerror.js
错误处理，使用alert进行更明显的错误提示

9. server.cjs
启动http端口和sse服务并生成importmap.js，这个文件在运行npm run dev时运行

10. sse.js
创建sse服务，用于实时推送文件修改给客户端，使客户端进行重启，达到伪热更新的作用

11. typescript.js
用于编译ts文件，这个文件运行在Service Worker线程中，但如果在electron环境中使用了require('xxx.ts')或在浏览器中使用import('typescript')，则会主线程（渲染进程）加载这个文件

13. vue-router.esm-browser.js
提供vue-router环境，使用方法等同于vite项目中的vue-router模块

13. vue.esm-browser.js
提供vue环境，使用方法等同于vite项目中的vue模块

# 其他模块的引入方法
以pinia为例：

1. 下载pinia模块: npm i pinia

2. 修改src/main.ts文件
```js
// src/main.ts
import { createApp } from 'vue';

// pinia
import { createPinia } from 'pinia';

import App from './App.vue';
const app = createApp(App);
app.use(createPinia())
app.mount('#app');
```

3. 重新启动项目


# 项目缺陷

1. 注册的Service Worker不会因为项目的关闭而注销，需要去浏览器控制台的“应用程序-Service Workers”中进行手动注销，不然会影响本浏览器以后使用所有本端口的web项目

2. 其他模块的引入只能兼容部分，如果其未提供xx.esm-browser.js，即使用了nodejs的变量，则无法兼容

3. element-plus的代码提示未兼容，可以手动npm i element-plus获取代码提示

# 项目优点

1. 可以便捷开发vue项目，省去下载vue和脚手架占用的空间

2. 学习本项目可以简单了解vue和ts的编译过程，以及Service Worker的使用

3. 支持在浏览器端，electron端，安卓端（webview）使用