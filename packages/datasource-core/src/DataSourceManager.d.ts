import { DataSourceType, DatabaseConfig, HttpConfig, DataSourceBinding, PreviewResult, QueryConfig } from './types';
export declare class DataSourceManager {
    private dataSources;
    private bindings;
    registerDataSource(id: string, type: DataSourceType, config: DatabaseConfig | HttpConfig): Promise<boolean>;
    getDataSource(id: string): DataSourceInstance | undefined;
    removeDataSource(id: string): Promise<void>;
    listDataSources(): Array<{
        id: string;
        type: DataSourceType;
        config: any;
    }>;
    createBinding(binding: DataSourceBinding): void;
    getComponentBindings(componentId: string): DataSourceBinding[];
    removeBinding(bindingId: string): void;
    previewData(bindingId: string): Promise<PreviewResult>;
    executeQuery(instance: DataSourceInstance, queryConfig: QueryConfig): Promise<any>;
    getTableMetadata(dataSourceId: string, tableName?: string): Promise<any>;
    validateDataSource(type: DataSourceType, config: DatabaseConfig | HttpConfig): Promise<{
        success: boolean;
        error?: string;
    }>;
}
interface DataSourceInstance {
    type: DataSourceType;
    config: DatabaseConfig | HttpConfig;
    connector: any;
}
export declare function createDataSourceManager(): DataSourceManager;
export {};
//# sourceMappingURL=DataSourceManager.d.ts.map