"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpDataSource = void 0;
exports.createHttpDataSource = createHttpDataSource;
class HttpDataSource {
    config;
    queryCount = 0;
    totalQueryTime = 0;
    constructor(config) {
        this.config = config;
    }
    async validateConnection() {
        try {
            const response = await this.request({
                method: 'GET',
                path: '/health'
            });
            return { success: response.status >= 200 && response.status < 300 };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || '连接验证失败'
            };
        }
    }
    async request(options) {
        const startTime = Date.now();
        const url = new URL(this.config.baseUrl + options.path);
        if (options.queryParams) {
            for (const [key, value] of Object.entries(options.queryParams)) {
                url.searchParams.set(key, String(value));
            }
        }
        const requestOptions = {
            method: options.method,
            headers: {
                'Content-Type': 'application/json',
                ...this.config.headers,
            },
        };
        if (this.config.auth) {
            const authHeader = this.buildAuthHeader();
            if (authHeader) {
                requestOptions.headers = {
                    ...requestOptions.headers,
                    ...authHeader,
                };
            }
        }
        if (options.body) {
            requestOptions.body = JSON.stringify(options.body);
        }
        console.log(`HTTP ${options.method}: ${url.toString()}`);
        const data = this.mockResponse(options.path, options.method);
        const executionTime = Date.now() - startTime;
        this.queryCount++;
        this.totalQueryTime += executionTime;
        return {
            status: 200,
            data,
            headers: {},
        };
    }
    buildAuthHeader() {
        const auth = this.config.auth;
        if (!auth || auth.type === 'none')
            return null;
        switch (auth.type) {
            case 'basic':
                if (auth.username && auth.password) {
                    const token = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
                    return { 'Authorization': `Basic ${token}` };
                }
                break;
            case 'bearer':
                if (auth.token) {
                    return { 'Authorization': `Bearer ${auth.token}` };
                }
                break;
            case 'apiKey':
                if (auth.apiKey) {
                    const headerName = auth.apiKeyHeader || 'X-API-Key';
                    return { [headerName]: auth.apiKey };
                }
                break;
        }
        return null;
    }
    mockResponse(path, _method) {
        const mockData = {
            '/users': {
                data: [
                    { id: 1, name: '张三', email: 'zhangsan@example.com' },
                    { id: 2, name: '李四', email: 'lisi@example.com' },
                ],
                total: 2,
            },
            '/items': {
                data: [
                    { id: 1, name: '商品1', price: 100 },
                    { id: 2, name: '商品2', price: 200 },
                ],
                total: 2,
            },
            '/health': { status: 'ok', timestamp: Date.now() },
        };
        return mockData[path] || { success: true, message: '请求成功' };
    }
    async getEndpoints() {
        return [
            {
                path: '/users',
                method: 'GET',
                description: '获取用户列表',
                parameters: [
                    { name: 'page', type: 'number', required: false, location: 'query' },
                    { name: 'pageSize', type: 'number', required: false, location: 'query' },
                ],
                response: { data: [], total: 0 },
            },
            {
                path: '/users/:id',
                method: 'GET',
                description: '获取单个用户',
                parameters: [
                    { name: 'id', type: 'number', required: true, location: 'path' },
                ],
                response: { id: 1, name: '', email: '' },
            },
            {
                path: '/users',
                method: 'POST',
                description: '创建用户',
                parameters: [
                    { name: 'name', type: 'string', required: true, location: 'body' },
                    { name: 'email', type: 'string', required: true, location: 'body' },
                ],
                response: { id: 1, name: '', email: '', createdAt: '' },
            },
        ];
    }
    async previewData(endpoint, method = 'GET', params) {
        const startTime = Date.now();
        try {
            const response = await this.request({
                method: method,
                path: endpoint,
                queryParams: method === 'GET' ? params : undefined,
                body: method !== 'GET' ? params : undefined,
            });
            const executionTime = Date.now() - startTime;
            return {
                success: true,
                data: response.data.data || response.data,
                total: response.data.total || (Array.isArray(response.data) ? response.data.length : 1),
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
    async fetchData(endpoint, method = 'GET', params, pagination) {
        const queryParams = {
            ...params,
            ...pagination,
        };
        const response = await this.request({
            method: method,
            path: endpoint,
            queryParams: method === 'GET' ? queryParams : undefined,
            body: method !== 'GET' ? queryParams : undefined,
        });
        const data = response.data.data || response.data;
        const total = response.data.total || (Array.isArray(data) ? data.length : 1);
        return {
            rows: Array.isArray(data) ? data : [data],
            rowCount: total,
        };
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
exports.HttpDataSource = HttpDataSource;
function createHttpDataSource(config) {
    return new HttpDataSource(config);
}
//# sourceMappingURL=HttpDataSource.js.map