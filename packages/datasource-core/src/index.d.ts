export type { DataSourceType, DatabaseConfig, HttpConfig, HttpAuthConfig, QueryResult, FieldInfo, DataSourceBinding, QueryConfig, PaginationConfig, FilterConfig, SortConfig, PreviewResult, DataSourceStatus, ConnectionStats, DataSourceMetadata, TableMetadata, ColumnMetadata, ForeignKeyMetadata, EndpointMetadata, ParameterMetadata, } from './types';
export { MySQLDataSource, createMySQLDataSource } from './MySQLDataSource';
export { HttpDataSource, createHttpDataSource } from './HttpDataSource';
export { DataSourceManager, createDataSourceManager } from './DataSourceManager';
export { WasmSandbox, createWasmSandbox } from './WasmSandbox';
export type { PluginInstance, PluginMetadata, ComponentMetadata, PropDefinition } from './WasmSandbox';
import type { DatabaseConfig, QueryResult } from './types';
export type { DataSourceType as DatabaseType } from './types';
export declare class DataSource {
    private config;
    private connection;
    constructor(config: DatabaseConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    query(sql: string, params?: any[]): Promise<QueryResult>;
    execute(sql: string, params?: any[]): Promise<QueryResult>;
    transaction<T>(callback: (ds: DataSource) => Promise<T>): Promise<T>;
    isConnected(): boolean;
}
export declare class RedisClient {
    private config;
    private _client;
    constructor(config: DatabaseConfig);
    get client(): any;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    expire(key: string, seconds: number): Promise<void>;
    acquireLock(key: string, ttl?: number): Promise<boolean>;
    releaseLock(key: string): Promise<void>;
}
export declare function createDataSource(config: DatabaseConfig): DataSource;
export declare function createRedisClient(config: DatabaseConfig): RedisClient;
//# sourceMappingURL=index.d.ts.map