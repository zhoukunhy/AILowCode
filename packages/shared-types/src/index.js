"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WEBHOOK_EVENT_GROUPS = exports.WebhookLogStatus = exports.DEFAULT_RETRY_CONFIG = exports.WebhookSignatureAlgorithm = exports.WebhookTriggerType = exports.WebhookStatus = exports.WebhookEventType = exports.PermissionService = exports.DEFAULT_MENUS = exports.DEFAULT_PERMISSIONS = exports.DEFAULT_ROLES = void 0;
exports.createPermissionService = createPermissionService;
exports.getEventGroupName = getEventGroupName;
exports.DEFAULT_ROLES = [
    {
        name: '超级管理员',
        code: 'super_admin',
        description: '拥有系统所有权限',
        permissions: ['*'],
        isSystem: true,
    },
    {
        name: '管理员',
        code: 'admin',
        description: '拥有大部分管理权限',
        permissions: [
            'user:read', 'user:write', 'user:delete',
            'role:read', 'role:write',
            'project:read', 'project:write', 'project:delete',
            'page:read', 'page:write', 'page:delete',
            'knowledge:read', 'knowledge:write',
            'ai:config',
        ],
        isSystem: true,
    },
    {
        name: '普通用户',
        code: 'user',
        description: '基础用户权限',
        permissions: [
            'project:read', 'project:write',
            'page:read', 'page:write',
            'knowledge:read',
        ],
        isSystem: true,
    },
    {
        name: '访客',
        code: 'guest',
        description: '只读权限',
        permissions: [
            'project:read',
            'page:read',
        ],
        isSystem: true,
    },
];
exports.DEFAULT_PERMISSIONS = [
    { name: '查看用户', code: 'user:read', type: 'button' },
    { name: '编辑用户', code: 'user:write', type: 'button' },
    { name: '删除用户', code: 'user:delete', type: 'button' },
    { name: '查看角色', code: 'role:read', type: 'button' },
    { name: '编辑角色', code: 'role:write', type: 'button' },
    { name: '查看项目', code: 'project:read', type: 'button' },
    { name: '编辑项目', code: 'project:write', type: 'button' },
    { name: '删除项目', code: 'project:delete', type: 'button' },
    { name: '查看页面', code: 'page:read', type: 'button' },
    { name: '编辑页面', code: 'page:write', type: 'button' },
    { name: '删除页面', code: 'page:delete', type: 'button' },
    { name: '查看知识库', code: 'knowledge:read', type: 'button' },
    { name: '编辑知识库', code: 'knowledge:write', type: 'button' },
    { name: 'AI 配置', code: 'ai:config', type: 'button' },
];
exports.DEFAULT_MENUS = [
    {
        name: '仪表盘',
        path: '/dashboard',
        icon: 'dashboard',
        order: 1,
        permissions: ['project:read'],
    },
    {
        name: '项目管理',
        path: '/projects',
        icon: 'folder',
        order: 2,
        permissions: ['project:read', 'project:write'],
        children: [
            { id: 'project-list', name: '项目列表', path: '/projects/list', order: 1, permissions: ['project:read'] },
            { id: 'project-create', name: '创建项目', path: '/projects/create', order: 2, permissions: ['project:write'] },
        ],
    },
    {
        name: '画布编辑',
        path: '/canvas',
        icon: 'edit',
        order: 3,
        permissions: ['page:read', 'page:write'],
    },
    {
        name: '知识库',
        path: '/knowledge',
        icon: 'book',
        order: 4,
        permissions: ['knowledge:read', 'knowledge:write'],
    },
    {
        name: 'AI 助手',
        path: '/ai-assistant',
        icon: 'robot',
        order: 5,
        permissions: ['*'],
    },
    {
        name: '系统管理',
        path: '/admin',
        icon: 'settings',
        order: 6,
        permissions: ['user:read', 'role:read'],
        children: [
            { id: 'admin-users', name: '用户管理', path: '/admin/users', order: 1, permissions: ['user:read', 'user:write'] },
            { id: 'admin-roles', name: '角色管理', path: '/admin/roles', order: 2, permissions: ['role:read', 'role:write'] },
            { id: 'admin-ai-config', name: 'AI 配置', path: '/admin/ai-config', order: 3, permissions: ['ai:config'] },
        ],
    },
];
class PermissionService {
    hasPermission(userPermissions, requiredPermission) {
        if (userPermissions.includes('*')) {
            return true;
        }
        return userPermissions.includes(requiredPermission);
    }
    hasAllPermissions(userPermissions, requiredPermissions) {
        return requiredPermissions.every(p => this.hasPermission(userPermissions, p));
    }
    hasAnyPermission(userPermissions, requiredPermissions) {
        return requiredPermissions.some(p => this.hasPermission(userPermissions, p));
    }
    getAccessibleMenus(menus, userPermissions) {
        const result = [];
        for (const menu of menus) {
            const accessibleChildren = menu.children
                ? this.getAccessibleMenus(menu.children, userPermissions)
                : [];
            if (menu.children) {
                if (accessibleChildren.length > 0) {
                    result.push({
                        ...menu,
                        children: accessibleChildren,
                    });
                }
            }
            else {
                if (this.hasAnyPermission(userPermissions, menu.permissions)) {
                    result.push(menu);
                }
            }
        }
        return result;
    }
    filterMenuPermissions(menus, userPermissions) {
        const accessibleMenus = this.getAccessibleMenus(menus, userPermissions);
        const permissions = [];
        const extractPermissions = (items) => {
            for (const item of items) {
                permissions.push(...item.permissions);
                if (item.children) {
                    extractPermissions(item.children);
                }
            }
        };
        extractPermissions(accessibleMenus);
        return [...new Set(permissions)];
    }
}
exports.PermissionService = PermissionService;
function createPermissionService() {
    return new PermissionService();
}
var WebhookEventType;
(function (WebhookEventType) {
    WebhookEventType["PROJECT_CREATED"] = "project.created";
    WebhookEventType["PROJECT_UPDATED"] = "project.updated";
    WebhookEventType["PROJECT_DELETED"] = "project.deleted";
    WebhookEventType["PAGE_CREATED"] = "page.created";
    WebhookEventType["PAGE_UPDATED"] = "page.updated";
    WebhookEventType["PAGE_DELETED"] = "page.deleted";
    WebhookEventType["PAGE_PUBLISHED"] = "page.published";
    WebhookEventType["PAGE_VERSION_CREATED"] = "page.version.created";
    WebhookEventType["WORKFLOW_STARTED"] = "workflow.started";
    WebhookEventType["WORKFLOW_COMPLETED"] = "workflow.completed";
    WebhookEventType["WORKFLOW_FAILED"] = "workflow.failed";
    WebhookEventType["WORKFLOW_NODE_COMPLETED"] = "workflow.node.completed";
    WebhookEventType["USER_CREATED"] = "user.created";
    WebhookEventType["USER_UPDATED"] = "user.updated";
    WebhookEventType["USER_DELETED"] = "user.deleted";
    WebhookEventType["USER_LOGGED_IN"] = "user.logged_in";
    WebhookEventType["DATASOURCE_CONNECTED"] = "datasource.connected";
    WebhookEventType["DATASOURCE_DISCONNECTED"] = "datasource.disconnected";
    WebhookEventType["DATASOURCE_QUERIED"] = "datasource.queried";
    WebhookEventType["AI_GENERATION_COMPLETED"] = "ai.generation.completed";
    WebhookEventType["AI_GENERATION_FAILED"] = "ai.generation.failed";
    WebhookEventType["CODE_GENERATED"] = "code.generated";
    WebhookEventType["CODE_DEPLOYED"] = "code.deployed";
    WebhookEventType["KNOWLEDGE_ADDED"] = "knowledge.added";
    WebhookEventType["KNOWLEDGE_DELETED"] = "knowledge.deleted";
    WebhookEventType["KNOWLEDGE_VECTORIZED"] = "knowledge.vectorized";
})(WebhookEventType || (exports.WebhookEventType = WebhookEventType = {}));
var WebhookStatus;
(function (WebhookStatus) {
    WebhookStatus["ACTIVE"] = "active";
    WebhookStatus["INACTIVE"] = "inactive";
    WebhookStatus["DISABLED"] = "disabled";
})(WebhookStatus || (exports.WebhookStatus = WebhookStatus = {}));
var WebhookTriggerType;
(function (WebhookTriggerType) {
    WebhookTriggerType["SYNC"] = "sync";
    WebhookTriggerType["ASYNC"] = "async";
})(WebhookTriggerType || (exports.WebhookTriggerType = WebhookTriggerType = {}));
var WebhookSignatureAlgorithm;
(function (WebhookSignatureAlgorithm) {
    WebhookSignatureAlgorithm["HMAC_SHA256"] = "hmac_sha256";
    WebhookSignatureAlgorithm["HMAC_SHA512"] = "hmac_sha512";
})(WebhookSignatureAlgorithm || (exports.WebhookSignatureAlgorithm = WebhookSignatureAlgorithm = {}));
exports.DEFAULT_RETRY_CONFIG = {
    maxRetries: 3,
    delayMs: 1000,
    backoffMultiplier: 2,
};
var WebhookLogStatus;
(function (WebhookLogStatus) {
    WebhookLogStatus["PENDING"] = "pending";
    WebhookLogStatus["SUCCESS"] = "success";
    WebhookLogStatus["FAILED"] = "failed";
    WebhookLogStatus["RETRYING"] = "retrying";
})(WebhookLogStatus || (exports.WebhookLogStatus = WebhookLogStatus = {}));
exports.WEBHOOK_EVENT_GROUPS = {
    project: [
        WebhookEventType.PROJECT_CREATED,
        WebhookEventType.PROJECT_UPDATED,
        WebhookEventType.PROJECT_DELETED,
    ],
    page: [
        WebhookEventType.PAGE_CREATED,
        WebhookEventType.PAGE_UPDATED,
        WebhookEventType.PAGE_DELETED,
        WebhookEventType.PAGE_PUBLISHED,
        WebhookEventType.PAGE_VERSION_CREATED,
    ],
    workflow: [
        WebhookEventType.WORKFLOW_STARTED,
        WebhookEventType.WORKFLOW_COMPLETED,
        WebhookEventType.WORKFLOW_FAILED,
        WebhookEventType.WORKFLOW_NODE_COMPLETED,
    ],
    user: [
        WebhookEventType.USER_CREATED,
        WebhookEventType.USER_UPDATED,
        WebhookEventType.USER_DELETED,
        WebhookEventType.USER_LOGGED_IN,
    ],
    datasource: [
        WebhookEventType.DATASOURCE_CONNECTED,
        WebhookEventType.DATASOURCE_DISCONNECTED,
        WebhookEventType.DATASOURCE_QUERIED,
    ],
    ai: [
        WebhookEventType.AI_GENERATION_COMPLETED,
        WebhookEventType.AI_GENERATION_FAILED,
    ],
    codegen: [
        WebhookEventType.CODE_GENERATED,
        WebhookEventType.CODE_DEPLOYED,
    ],
    knowledge: [
        WebhookEventType.KNOWLEDGE_ADDED,
        WebhookEventType.KNOWLEDGE_DELETED,
        WebhookEventType.KNOWLEDGE_VECTORIZED,
    ],
};
function getEventGroupName(eventType) {
    for (const [groupName, events] of Object.entries(exports.WEBHOOK_EVENT_GROUPS)) {
        if (events.includes(eventType)) {
            return groupName;
        }
    }
    return 'other';
}
//# sourceMappingURL=index.js.map