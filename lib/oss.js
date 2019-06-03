'use strict';

/**
 * @module OSS
 */

/**
 * logger 前缀
 * 
 * @type {string}
 * @constant
 */
const LOG_PREFIX = 'OSSPlugin:OSS';

const aliOSS = require('ali-oss');
const debug = require('debug')(LOG_PREFIX);
const throwError = require('./util').throwError(LOG_PREFIX);
const { isObject } = require('./util');

class OSS {
    /**
     * 构造方法，生成 oss 配置和 client
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
     */
    constructor(options) {
        // oss 配置
        this.options = {};
        this.options.accessKeyId = options.accessKeyId;
        this.options.accessKeySecret = options.accessKeySecret;
        this.options.bucket = options.bucket;
        this.options.endpoint = options.endpoint || '';
        this.options.region = options.region || '';
        this.options.internal = options.internal || false;
        this.options.cname = options.cname || false;
        this.options.isRequestPay = options.isRequestPay || false;
        this.options.secure = options.secure || true;
        this.options.timeout = options.timeout || 300000;
        debug('oss options is %o', this.options);

        // 生成 oss 客户端实例 
        this.client = aliOSS(this.options);
    }

    /**
     * 从内存中上传文件
     * 
     * @public
     * @param {string} filename - 文件名
     * @param {string} content - 文件内容
     */
    async uploadFile(filename, content) {
        if (!filename) throwError('filename must not be empty or undefined');
        if (!content) throwError('content of %s must not be empty or undefined', filename);
        debug('uploading %s', filename);
        const result = await this.client.put(filename, Buffer.from(content, 'utf8'));
        
        switch (true) {
            case !result:
            case !result.url && !result.res:
            case 200 !== result.res.status:
                throwError('uploaded %s wrong, error is %o', filename, result);
        }

        debug('uploaded %s successfully, url is %s', filename, result.url);
    }

    /**
     * 从内存中上传多个文件
     * 
     * @public
     * @param {Object<string, string>} assets - key 是文件名，value 是文件内容
     */
    async uploadFiles(assets) {
        if (!assets) throwError('assets must not be empty or undefined');
        if (!isObject(assets)) throwError('assets must be an object');
        debug('uploading files');
        const promises = [];
        Object.keys(assets).forEach(filename => promises.push(this.uploadFile(filename, assets[filename])));
        await Promise.all(promises);
        debug('uploaded all files successfully');
    }
}

module.exports = OSS;
