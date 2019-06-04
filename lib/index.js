'use strict';

/**
 * @module OSSPlugin
 */

/**
 * logger 前缀
 * 
 * @type {string}
 * @constant
 */
const LOG_PREFIX = 'OSSPlugin';

const OSS = require('./oss');
const debug = require('debug')(LOG_PREFIX);
const throwError = require('./util').throwError(LOG_PREFIX);
const { URL } = require('url');
const { join } = require('path');

const {
    isObject,
    isRegExp
} = require('./util');

class OSSPlugin {
    /**
     * 构造方法
     * 
     * @constructor
     * @param {Object} options
     * @param {string} options.accessKeyId - 阿里云控制台创建的 AccessKey
     * @param {string} options.accessKeySecret - 阿里云控制台创建的 AccessKeySecret
     * @param {string} options.bucket - 阿里云控制台创建的 bucket 或通过 putBucket 方法创建的 bucket
     * @param {string} [options.endpoint=${bucket}.${region}.aliyuncs.com] - OSS 域名，默认是 `${bucket}.${region}.aliyuncs.com`
     * @param {string} options.region - 数据中心所在地域
     * @param {string} [options.internal=false] - 是否通过内网访问，内网访问不收费
     * @param {string} [options.cname=false] - 是否支持上传自定义域名，如果 cname 为 true ，自定义域名需要先同 bucket 进行绑定
     * @param {string} [options.isRequestPay=false] - bucket 是否开启请求者付费模式
     * @param {string} [options.secure=false] - 是否启用安全协议
     * @param {string} [options.timeout=60000] - 请求超时时间
     * @param {RegExp} [options.exclude] - 不需要上传的文件规则，是一个正则表达式
     * @param {RegExp} [options.include] - 需要上传的文件规则，是一个正则表达式
     * @param {boolean} [options.isSilent=false] - 不启用插件
     */
    constructor(options) {
        // 不启用
        if (options.isSilent) return this;

        // 必传的参数
        this.requiredOptionNames = [
            'accessKeyId',
            'accessKeySecret',
            'bucket',
            'region'
        ];

        // 校验参数
        this.validOptions(options);
        this.options = options;
        debug('plugin options is %o', this.options);
        this.oss = new OSS(this.options);
    }

    apply(compiler) {
        // 不启用插件
        if (!!this.options.isSilent) return;

        compiler.hooks.afterEmit.tapAsync('OSSPlugin', async (compilation, cb) => {
            // 把 assets 转换成 Object<string, string> 然后进行正则过滤
            let transformedAssets = this.transformAssets(compilation.assets, compilation.outputOptions.publicPath);
            transformedAssets = this.filterAssetsByExclude(transformedAssets);
            transformedAssets = this.filterAssetsByInclude(transformedAssets);
            await this.oss.uploadFiles(transformedAssets);
            cb();
        });
    }

    /**
     * 过滤出合法的 ossFilename，通过 this.options.exclude 筛掉不需要的
     * 
     * @private
     * @param {Object<string, string>} assets - key 是 ossFilename，value 是文件内容
     * @returns {Object<string, string>}
     */
    filterAssetsByExclude(assets) {
        if (!this.options.exclude) return assets;
        if (!isRegExp(this.options.exclude)) throwError('options.exclude must be an regular expression');
        if (!assets) throwError('assets must not be empty or undefined');
        if (!isObject(assets)) throwError('assets must be an object');

        return Object.keys(assets)
            .filter(filename => {
                if (this.options.exclude.test(filename)) {
                    debug('%s was ignored', filename);
                    return false;
                }

                return true;
            })
            .reduce((filtedAssets, filename) => ({
                ...filtedAssets,
                [filename]: assets[filename]
            }), {});
    }

    /**
     * 过滤出合法的 ossFilename，通过 this.options.exclude 筛出需要的
     * 
     * @private
     * @param {Object<string, string>} assets - key 是 ossFilename，value 是文件内容
     * @returns {Object<string, string>}
     */
    filterAssetsByInclude(assets) {
        if (!this.options.include) return assets;
        if (!isRegExp(this.options.include)) throwError('options.include must be an regular expression');
        if (!assets) throwError('assets must not be empty or undefined');
        if (!isObject(assets)) throwError('assets must be an object');

        return Object.keys(assets)
            .filter(filename => {
                if (this.options.include.test(filename)) {
                    debug('%s was contained', filename);
                    return true;
                }

                return false;
            })
            .reduce((filtedAssets, filename) => ({
                ...filtedAssets,
                [filename]: assets[filename]
            }), {});
    }

    /**
     * 转换 assets 为 Objec<string, string>，key 是 ossFilename，value 是文件内容
     * 
     * @private
     * @param {Object} assets - compilation.assets
     * @param {string} [publicPath] - output 中配置的 publicPath
     * @returns {Object<string, string>}
     */
    transformAssets(assets, publicPath) {
        if (!assets) throwError('assets must not be empty or undefined');
        if (!isObject(assets)) throwError('assets must be an object');

        return Object.keys(assets)
            .reduce((transformedAssets, filename) => {
                const ossFilename = this.genOSSFilename(filename, publicPath);

                return {
                    ...transformedAssets,
                    [ossFilename]: assets[filename].source()
                }; 
            }, {});
    }

    /**
     * 校验参数，options.accessKeyId、options.accessKeySecret
     * 、options.bucket.region 四个为必传参数
     * 
     * @param {Object} options
     */
    validOptions(options) {
        if (!options) throwError('options was required');
        if (!isObject(options)) throwError('options must be an object');

        for (let key of this.requiredOptionNames) {
            if(!options.hasOwnProperty(key)) throwError('options.%s was required', key);
        }
    }

    /**
     * 生成阿里云上的文件名，主要功能是拼接 publicPath 
     * 和 filename，并且去掉协议和域名
     * 
     * @param {string} filename - webpack 中的 filename
     * @param {string} [publicPath] - webpack 配置中的 output.publicPath
     */
    genOSSFilename(filename, publicPath) {
        if (!filename) throwError('filename must not be empty or undefined');

        // 没有 publicPath 就直接返回 filename 作为阿里云上的文件名
        if (!publicPath) return filename;

        // 如果是省略协议就补上，主要为了方便判断
        if (/^\/\//.test(publicPath)) {
            publicPath = `https:${publicPath}`;
        }

        // 判断 publicPath 末尾是否有 “/”，没有要补上
        if (!/\/$/.test(publicPath)) {
            publicPath = `${publicPath}/`;
        }

        // 判断是否有携带协议，上面补全了这边就可以很方便的判断出来
        if (/^https?:\/\//.test(publicPath)) {
            const url = new URL(publicPath);
            publicPath = url.pathname.substring(1);
        }

        // 去掉开头的 “/”
        if ('/' === publicPath.charAt(0)) {
            publicPath = publicPath.substring(1);
        }

        return join(publicPath, filename);
    }
}

module.exports = OSSPlugin;
