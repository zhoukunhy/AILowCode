import { DatabaseConfig, QueryResult, TableMetadata } from './types';
export declare class MySQLDataSource {
    private config;
    private connection;
    private queryCount;
    private totalQueryTime;
    constructor(config: DatabaseConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    query(sql: string, params?: any[]): Promise<QueryResult>;
    getTables(): Promise<string[]>;
    getTableMetadata(tableName: string): Promise<TableMetadata>;
    getAllTableMetadata(): Promise<TableMetadata[]>;
    previewTable(tableName: string, limit?: number): Promise<QueryResult>;
    isConnected(): boolean;
    getStats(): {
        queryCount: number;
        totalQueryTime: number;
        averageQueryTime: number;
    };
}
export declare function createMySQLDataSource(config: DatabaseConfig): MySQLDataSource;
//# sourceMappingURL=MySQLDataSource.d.ts.map