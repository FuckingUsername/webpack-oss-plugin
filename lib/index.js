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
     * @param {boolean} [options.isSilent=false] - 不启用插件
     */
    constructor(options) {
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
        this.oss = new OSS(this.options)
    }

    apply(compiler) {
        // 不启用插件
        if (!!this.options.isSilent) return;

        compiler.hooks.afterEmit.tapAsync('OSSPlugin', async (compilation, cb) => {
            let assets = this.filterAssets(compilation.assets);
            assets = this.transformAssets(assets);
            await this.oss.uploadFiles(assets);
            cb();
        });
    }

    /**
     * 过滤出合法的 filename
     * 
     * @private
     * @param {Object} assets - compilation.assets
     * @returns {Object}
     */
    filterAssets(assets) {
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
            .reduce((validAssets, filename) => ({
                ...validAssets,
                [filename]: assets[filename]
            }), {});
    }

    /**
     * 转换 assets 为 Objec<string, string>，key 是 filename，value 是文件内容
     * 
     * @private
     * @param {Object} assets - compilation.assets
     * @returns {Object<string, string>}
     */
    transformAssets(assets) {
        if (!assets) throwError('assets must not be empty or undefined');
        if (!isObject(assets)) throwError('assets must be an object');

        return Object.keys(assets)
            .reduce((transformedAssets, filename) => ({
                ...transformedAssets,
                [filename]: assets[filename].source()
            }), {});
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
}

module.exports = OSSPlugin;
