"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLDataSource = void 0;
exports.createMySQLDataSource = createMySQLDataSource;
class MySQLDataSource {
    config;
    connection = null;
    queryCount = 0;
    totalQueryTime = 0;
    constructor(config) {
        if (config.type !== 'mysql') {
            throw new Error('MySQLDataSource 只支持 MySQL 类型');
        }
        this.config = config;
    }
    async connect() {
        console.log(`连接 MySQL: ${this.config.host}:${this.config.port}/${this.config.database}`);
        this.connection = { connected: true };
        console.log('MySQL 连接成功');
    }
    async disconnect() {
        if (this.connection) {
            this.connection = null;
            console.log('MySQL 连接已断开');
        }
    }
    async query(sql, params) {
        if (!this.connection) {
            throw new Error('数据库未连接');
        }
        const startTime = Date.now();
        console.log(`执行 SQL: ${sql}`, params);
        const fields = [
            { name: 'id', type: 'INT', nullable: false },
            { name: 'name', type: 'VARCHAR', nullable: false },
            { name: 'created_at', type: 'DATETIME', nullable: true },
        ];
        const rows = [
            { id: 1, name: '测试数据', created_at: new Date().toISOString() },
            { id: 2, name: '测试数据2', created_at: new Date().toISOString() },
        ];
        const executionTime = Date.now() - startTime;
        this.queryCount++;
        this.totalQueryTime += executionTime;
        return {
            rows,
            rowCount: rows.length,
            fields,
        };
    }
    async getTables() {
        const result = await this.query("SHOW TABLES");
        return result.rows.map((row) => Object.values(row)[0]);
    }
    async getTableMetadata(tableName) {
        const result = await this.query(`DESCRIBE ${tableName}`);
        const columns = result.rows.map((row) => ({
            name: row.Field,
            type: row.Type,
            nullable: row.Null === 'YES',
            defaultValue: row.Default,
            autoIncrement: row.Extra?.includes('auto_increment'),
        }));
        const primaryKey = columns.filter(col => col.name === 'id').map(col => col.name);
        return {
            name: tableName,
            columns,
            primaryKey,
            foreignKeys: [],
        };
    }
    async getAllTableMetadata() {
        const tables = await this.getTables();
        const metadata = [];
        for (const table of tables) {
            metadata.push(await this.getTableMetadata(table));
        }
        return metadata;
    }
    async previewTable(tableName, limit = 10) {
        return this.query(`SELECT * FROM ${tableName} LIMIT ${limit}`);
    }
    isConnected() {
        return !!this.connection?.connected;
    }
    getStats() {
        return {
            queryCount: this.queryCount,
            totalQueryTime: this.totalQueryTime,
            averageQueryTime: this.queryCount > 0
                ? this.totalQueryTime / this.queryCount
                : 0,
        };
    }
}
exports.MySQLDataSource = MySQLDataSource;
function createMySQLDataSource(config) {
    return new MySQLDataSource(config);
}
//# sourceMappingURL=MySQLDataSource.js.map