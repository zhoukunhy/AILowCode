"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSourceManager = void 0;
exports.createDataSourceManager = createDataSourceManager;
const MySQLDataSource_1 = require("./MySQLDataSource");
const HttpDataSource_1 = require("./HttpDataSource");
class DataSourceManager {
    dataSources = new Map();
    bindings = new Map();
    async registerDataSource(id, type, config) {
        try {
            let instance;
            switch (type) {
                case 'mysql':
                    instance = {
                        type: 'mysql',
                        config: config,
                        connector: new MySQLDataSource_1.MySQLDataSource(config),
                    };
                    await instance.connector.connect();
                    break;
                case 'http':
                case 'rest':
                    instance = {
                        type: 'http',
                        config: config,
                        connector: new HttpDataSource_1.HttpDataSource(config),
                    };
                    break;
                default:
                    throw new Error(`不支持的数据源类型: ${type}`);
            }
            this.dataSources.set(id, instance);
            console.log(`数据源注册成功: ${id}`);
            return true;
        }
        catch (error) {
            console.error(`数据源注册失败: ${id}`, error);
            throw error;
        }
    }
    getDataSource(id) {
        return this.dataSources.get(id);
    }
    async removeDataSource(id) {
        const instance = this.dataSources.get(id);
        if (instance) {
            if (instance.type === 'mysql') {
                await instance.connector.disconnect();
            }
            this.dataSources.delete(id);
            console.log(`数据源已移除: ${id}`);
        }
    }
    listDataSources() {
        const result = [];
        for (const [id, instance] of this.dataSources) {
            result.push({
                id,
                type: instance.type,
                config: instance.config,
            });
        }
        return result;
    }
    createBinding(binding) {
        this.bindings.set(binding.id, binding);
        console.log(`创建数据源绑定: ${binding.id}`);
    }
    getComponentBindings(componentId) {
        return Array.from(this.bindings.values())
            .filter(b => b.componentId === componentId);
    }
    removeBinding(bindingId) {
        this.bindings.delete(bindingId);
        console.log(`移除数据源绑定: ${bindingId}`);
    }
    async previewData(bindingId) {
        const binding = this.bindings.get(bindingId);
        if (!binding) {
            throw new Error(`绑定不存在: ${bindingId}`);
        }
        const instance = this.dataSources.get(binding.dataSourceId);
        if (!instance) {
            throw new Error(`数据源不存在: ${binding.dataSourceId}`);
        }
        const startTime = Date.now();
        try {
            const result = await this.executeQuery(instance, binding.queryConfig);
            const executionTime = Date.now() - startTime;
            return {
                success: true,
                data: result.rows,
                total: result.rowCount,
                fields: result.fields,
                executionTime,
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            return {
                success: false,
                data: [],
                total: 0,
                error: error.message,
                executionTime,
            };
        }
    }
    async executeQuery(instance, queryConfig) {
        if (instance.type === 'mysql') {
            const connector = instance.connector;
            if (queryConfig.type === 'table') {
                return connector.previewTable(queryConfig.tableName, queryConfig.pagination?.pageSize || 10);
            }
            else if (queryConfig.type === 'query') {
                return connector.query(queryConfig.query);
            }
        }
        else if (instance.type === 'http') {
            const connector = instance.connector;
            return connector.fetchData(queryConfig.endpoint, queryConfig.method || 'GET', queryConfig.params, queryConfig.pagination);
        }
        throw new Error('不支持的查询类型');
    }
    async getTableMetadata(dataSourceId, tableName) {
        const instance = this.dataSources.get(dataSourceId);
        if (!instance) {
            throw new Error(`数据源不存在: ${dataSourceId}`);
        }
        if (instance.type === 'mysql') {
            const connector = instance.connector;
            if (tableName) {
                return connector.getTableMetadata(tableName);
            }
            else {
                return connector.getAllTableMetadata();
            }
        }
        else if (instance.type === 'http') {
            const connector = instance.connector;
            return connector.getEndpoints();
        }
        throw new Error('不支持的数据源类型');
    }
    async validateDataSource(type, config) {
        try {
            switch (type) {
                case 'mysql':
                    const mysql = new MySQLDataSource_1.MySQLDataSource(config);
                    await mysql.connect();
                    await mysql.disconnect();
                    return { success: true };
                case 'http':
                    const http = new HttpDataSource_1.HttpDataSource(config);
                    const result = await http.validateConnection();
                    return result;
                default:
                    return { success: true };
            }
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
}
exports.DataSourceManager = DataSourceManager;
function createDataSourceManager() {
    return new DataSourceManager();
}
//# sourceMappingURL=DataSourceManager.js.map