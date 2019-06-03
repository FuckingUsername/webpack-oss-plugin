# [@xmqd/webpack-oss-plugin][@xmqd/webpack-oss-plugin-url]

[![node][node-badage]][node-url]
[![npm][npm-badage]][npm-url]

[@xmqd/webpack-oss-plugin][@xmqd/webpack-oss-plugin-url] 是一款用于在 [webpack][webpack-url] 构建时自动上传构建资源到阿里云上的 [webpack][webpack-url] 插件。

## Table of Contents

* [Installation](#Installation)
* [Usage](#Usage)
* [Options](#Options)
* [License](#License)

## Installation

[@xmqd/webpack-oss-plugin][@xmqd/webpack-oss-plugin-url] requires [webpack][webpack-url] v4.0.0 or higher.

* Install with [npm][npm-url]
    ```bash
    $ npm install @xmqd/webpack-oss-plugin --save-dev
    ```

* Install with [yarn][yarn-url]
    ```bash
    $ yarn add @xmqd/webpack-oss-plugin --dev
    ```

## Usage
* require [@xmqd/webpack-oss-plugin](@xmqd/webpack-oss-plugin-url)
    ```js
    const OSSPlugin = require('@xmqd/webpack-oss-plugin');
    ```

* configure **webpack.prod.config.js**
    ```js
    // ...
    plugins: [
        // ...
        new OSSPlugin({
            accessKeyId: 'your oss accessKeyId',
            accessKeySecret: 'your oss accessKeySecret',
            bucket: 'your oss bucket',
            region: 'your oss region',
            isSilent: 'production' !== process.env.NODE_ENV
        }),
        // ...
    ],
    // ...
    ```

## Options
|Name|Type|Required|Default|Description|
|:--:|:--:|:------:|:-----:|:---------:|
|**`accessKeyId`**|**`{string}`**|**`true`**|-|阿里云控制台创建的 AccessKey|
|**`accessKeySecret`**|**`{string}`**|**`true`**|-|阿里云控制台创建的 AccessKeySecret|
|**`bucket`**|**`{string}`**|**`true`**|-|阿里云控制台创建的 bucket 或通过 putBucket 方法创建的 bucket|
|**`endpoint`**|**`{string}`**|**`false`**|`${bucket}.${region}.aliyuncs.com`|阿里云控制台创建的 AccessKey|
|**`region`**|**`{string}`**|**`true`**|-|数据中心所在地域|
|**`internal`**|**`{boolean}`**|**`false`**|`false`|是否通过内网访问，内网访问不收费|
|**`cname`**|**`{boolean}`**|**`false`**|`false`|是否支持上传自定义域名，如果 cname 为 true ，自定义域名需要先同 bucket 进行绑定|
|**`isRequestPay`**|**`{boolean}`**|**`false`**|`false`|bucket 是否开启请求者付费模式|
|**`secure`**|**`{boolean}`**|**`false`**|`false`|是否启用安全协议|
|**`timeout`**|**`{number}`**|**`false`**|`60000`|请求超时时间|
|**`exclude`**|**`{RegExp}`**|**`false`**|`undefined`|不需要上传的文件规则，是一个正则表达式|
|**`isSilent`**|**`{boolean}`**|**`false`**|`false`|不启用插件|

## License

[MIT](./LICENSE)

[node-badage]: https://img.shields.io/node/v/@xmqd/webpack-oss-plugin.svg
[npm-badage]: https://img.shields.io/npm/v/@xmqd/webpack-oss-plugin.svg
[node-url]: https://nodejs.org/zh-cn/
[npm-url]: https://www.npmjs.com/package/@xmqd/webpack-oss-plugin
[yarn-url]: https://yarn.bootcss.com
[webpack-url]: https://webpack.js.org
[@xmqd/webpack-oss-plugin-url]: https://git.qufenqi.com/wangjun/webpack-oss-plugin
