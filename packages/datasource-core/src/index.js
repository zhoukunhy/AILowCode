"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisClient = exports.DataSource = exports.createWasmSandbox = exports.WasmSandbox = exports.createDataSourceManager = exports.DataSourceManager = exports.createHttpDataSource = exports.HttpDataSource = exports.createMySQLDataSource = exports.MySQLDataSource = void 0;
exports.createDataSource = createDataSource;
exports.createRedisClient = createRedisClient;
var MySQLDataSource_1 = require("./MySQLDataSource");
Object.defineProperty(exports, "MySQLDataSource", { enumerable: true, get: function () { return MySQLDataSource_1.MySQLDataSource; } });
Object.defineProperty(exports, "createMySQLDataSource", { enumerable: true, get: function () { return MySQLDataSource_1.createMySQLDataSource; } });
var HttpDataSource_1 = require("./HttpDataSource");
Object.defineProperty(exports, "HttpDataSource", { enumerable: true, get: function () { return HttpDataSource_1.HttpDataSource; } });
Object.defineProperty(exports, "createHttpDataSource", { enumerable: true, get: function () { return HttpDataSource_1.createHttpDataSource; } });
var DataSourceManager_1 = require("./DataSourceManager");
Object.defineProperty(exports, "DataSourceManager", { enumerable: true, get: function () { return DataSourceManager_1.DataSourceManager; } });
Object.defineProperty(exports, "createDataSourceManager", { enumerable: true, get: function () { return DataSourceManager_1.createDataSourceManager; } });
var WasmSandbox_1 = require("./WasmSandbox");
Object.defineProperty(exports, "WasmSandbox", { enumerable: true, get: function () { return WasmSandbox_1.WasmSandbox; } });
Object.defineProperty(exports, "createWasmSandbox", { enumerable: true, get: function () { return WasmSandbox_1.createWasmSandbox; } });
class DataSource {
    config;
    connection;
    constructor(config) {
        this.config = config;
    }
    async connect() {
        console.log(`连接数据库: ${this.config.type}://${this.config.host}:${this.config.port}/${this.config.database}`);
        this.connection = true;
    }
    async disconnect() {
        console.log('断开数据库连接');
        this.connection = null;
    }
    async query(sql, params) {
        if (!this.connection) {
            throw new Error('数据库未连接');
        }
        console.log(`执行查询: ${sql}`, params);
        return {
            rows: [],
            rowCount: 0,
        };
    }
    async execute(sql, params) {
        return this.query(sql, params);
    }
    async transaction(callback) {
        console.log('开始事务');
        try {
            const result = await callback(this);
            console.log('提交事务');
            return result;
        }
        catch (error) {
            console.log('回滚事务');
            throw error;
        }
    }
    isConnected() {
        return !!this.connection;
    }
}
exports.DataSource = DataSource;
class RedisClient {
    config;
    _client;
    constructor(config) {
        this.config = config;
    }
    get client() {
        return this._client;
    }
    async connect() {
        console.log(`连接Redis: ${this.config.host}:${this.config.port}`);
        this._client = true;
    }
    async disconnect() {
        console.log('断开Redis连接');
        this._client = null;
    }
    async get(key) {
        console.log(`Redis GET: ${key}`);
        return null;
    }
    async set(key, value, ttl) {
        console.log(`Redis SET: ${key} = ${value}, TTL: ${ttl}`);
    }
    async del(key) {
        console.log(`Redis DEL: ${key}`);
    }
    async expire(key, seconds) {
        console.log(`Redis EXPIRE: ${key}, ${seconds}s`);
    }
    async acquireLock(key, ttl = 10) {
        console.log(`获取分布式锁: ${key}, TTL: ${ttl}s`);
        return true;
    }
    async releaseLock(key) {
        console.log(`释放分布式锁: ${key}`);
    }
}
exports.RedisClient = RedisClient;
function createDataSource(config) {
    return new DataSource(config);
}
function createRedisClient(config) {
    return new RedisClient(config);
}
//# sourceMappingURL=index.js.map