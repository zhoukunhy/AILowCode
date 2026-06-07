export type DataSourceType = 'mysql' | 'postgres' | 'mongodb' | 'redis' | 'http' | 'rest' | 'graphql';
export interface DatabaseConfig {
    type: 'mysql' | 'postgres' | 'mongodb' | 'redis';
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    ssl?: boolean;
    poolSize?: number;
    connectionTimeout?: number;
}
export interface HttpConfig {
    type: 'http' | 'rest' | 'graphql';
    baseUrl: string;
    headers?: Record<string, string>;
    auth?: HttpAuthConfig;
    timeout?: number;
}
export interface HttpAuthConfig {
    type: 'none' | 'basic' | 'bearer' | 'apiKey';
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
    apiKeyHeader?: string;
}
export interface QueryResult {
    rows: any[];
    rowCount: number;
    fields?: FieldInfo[];
    error?: string;
}
export interface FieldInfo {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: any;
}
export interface DataSourceBinding {
    id: string;
    dataSourceId: string;
    componentId: string;
    fieldMapping: Record<string, string>;
    queryConfig: QueryConfig;
}
export interface QueryConfig {
    type: 'table' | 'query' | 'endpoint';
    tableName?: string;
    query?: string;
    endpoint?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    params?: Record<string, any>;
    body?: any;
    pagination?: PaginationConfig;
    filters?: FilterConfig[];
    sort?: SortConfig[];
}
export interface PaginationConfig {
    page: number;
    pageSize: number;
    total?: number;
}
export interface FilterConfig {
    field: string;
    operator: '=' | '<>' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN';
    value: any;
}
export interface SortConfig {
    field: string;
    direction: 'ASC' | 'DESC';
}
export interface PreviewResult {
    success: boolean;
    data: any[];
    total: number;
    fields?: FieldInfo[];
    error?: string;
    executionTime: number;
}
export interface DataSourceStatus {
    connected: boolean;
    lastConnected?: Date;
    error?: string;
    stats?: ConnectionStats;
}
export interface ConnectionStats {
    queryCount: number;
    totalQueryTime: number;
    averageQueryTime: number;
}
export interface DataSourceMetadata {
    name: string;
    type: DataSourceType;
    tables?: TableMetadata[];
    endpoints?: EndpointMetadata[];
}
export interface TableMetadata {
    name: string;
    columns: ColumnMetadata[];
    primaryKey?: string[];
    foreignKeys?: ForeignKeyMetadata[];
}
export interface ColumnMetadata {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: any;
    autoIncrement?: boolean;
}
export interface ForeignKeyMetadata {
    column: string;
    referencedTable: string;
    referencedColumn: string;
}
export interface EndpointMetadata {
    path: string;
    method: string;
    description?: string;
    parameters?: ParameterMetadata[];
    response?: any;
}
export interface ParameterMetadata {
    name: string;
    type: string;
    required: boolean;
    location: 'query' | 'path' | 'body';
}
//# sourceMappingURL=types.d.ts.map