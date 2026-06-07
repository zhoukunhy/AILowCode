import { HttpConfig, QueryResult, PreviewResult, EndpointMetadata } from './types';
export declare class HttpDataSource {
    private config;
    private queryCount;
    private totalQueryTime;
    constructor(config: HttpConfig);
    validateConnection(): Promise<{
        success: boolean;
        error?: string;
    }>;
    request(options: {
        method: 'GET' | 'POST' | 'PUT' | 'DELETE';
        path: string;
        queryParams?: Record<string, any>;
        body?: any;
    }): Promise<{
        status: number;
        data: any;
        headers: Record<string, string>;
    }>;
    private buildAuthHeader;
    private mockResponse;
    getEndpoints(): Promise<EndpointMetadata[]>;
    previewData(endpoint: string, method?: string, params?: Record<string, any>): Promise<PreviewResult>;
    fetchData(endpoint: string, method?: string, params?: Record<string, any>, pagination?: {
        page: number;
        pageSize: number;
    }): Promise<QueryResult>;
    getStats(): {
        queryCount: number;
        totalQueryTime: number;
        averageQueryTime: number;
    };
}
export declare function createHttpDataSource(config: HttpConfig): HttpDataSource;
//# sourceMappingURL=HttpDataSource.d.ts.map