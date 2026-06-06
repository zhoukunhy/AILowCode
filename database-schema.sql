-- ==============================================
-- 低代码平台核心数据库表设计
-- ==============================================

-- ------------------------------
-- 1. 用户表 (users)
-- ------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    avatar_url VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'developer')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- ------------------------------
-- 2. 项目表 (projects)
-- ------------------------------
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'shared')),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    version VARCHAR(20) DEFAULT '1.0.0'
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_visibility ON projects(visibility);

-- ------------------------------
-- 3. 页面画布配置表 (pages)
-- ------------------------------
CREATE TABLE pages (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    width INTEGER DEFAULT 1920,
    height INTEGER DEFAULT 1080,
    grid_size INTEGER DEFAULT 20,
    snap_to_grid BOOLEAN DEFAULT true,
    show_grid BOOLEAN DEFAULT true,
    show_rulers BOOLEAN DEFAULT false,
    background_color VARCHAR(20) DEFAULT '#ffffff',
    canvas_json JSONB NOT NULL DEFAULT '[]'::JSONB,
    sort_order INTEGER DEFAULT 0,
    is_home BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pages_project_id ON pages(project_id);
CREATE INDEX idx_pages_is_home ON pages(is_home);

-- ------------------------------
-- 4. 组件库表 (component_library)
-- ------------------------------
CREATE TABLE component_library (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) DEFAULT 'basic' CHECK (category IN ('basic', 'layout', 'form', 'data', 'feedback', 'navigation')),
    icon VARCHAR(100),
    description TEXT,
    schema JSONB NOT NULL,
    default_props JSONB NOT NULL,
    preview_url VARCHAR(255),
    is_built_in BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_component_library_type ON component_library(type);
CREATE INDEX idx_component_library_category ON component_library(category);
CREATE INDEX idx_component_library_is_active ON component_library(is_active);

-- ------------------------------
-- 5. AI生产记录表 (ai_generation_records)
-- ------------------------------
CREATE TABLE ai_generation_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    page_id INTEGER REFERENCES pages(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    input_type VARCHAR(50) CHECK (input_type IN ('text', 'image', 'code', 'json')),
    output_type VARCHAR(50) CHECK (output_type IN ('component', 'page', 'code', 'json', 'text')),
    output_content TEXT,
    status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'success', 'failed', 'partial')),
    token_usage INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_ai_records_user_id ON ai_generation_records(user_id);
CREATE INDEX idx_ai_records_project_id ON ai_generation_records(project_id);
CREATE INDEX idx_ai_records_status ON ai_generation_records(status);
CREATE INDEX idx_ai_records_created_at ON ai_generation_records(created_at);

-- ------------------------------
-- 6. 环境变量表 (environment_variables)
-- ------------------------------
CREATE TABLE environment_variables (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    is_secret BOOLEAN DEFAULT false,
    description VARCHAR(255),
    environment VARCHAR(20) DEFAULT 'development' CHECK (environment IN ('development', 'staging', 'production')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_env_vars_project_key_env ON environment_variables(project_id, key, environment);
CREATE INDEX idx_env_vars_project_id ON environment_variables(project_id);

-- ------------------------------
-- 7. 插件记录表 (plugins)
-- ------------------------------
CREATE TABLE plugins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    version VARCHAR(20) DEFAULT '1.0.0',
    author VARCHAR(100),
    author_url VARCHAR(255),
    plugin_url VARCHAR(255),
    type VARCHAR(50) DEFAULT 'component' CHECK (type IN ('component', 'action', 'data_source', 'theme', 'tool')),
    status VARCHAR(20) DEFAULT 'installed' CHECK (status IN ('installed', 'enabled', 'disabled', 'uninstalled')),
    settings JSONB DEFAULT '{}'::JSONB,
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plugins_type ON plugins(type);
CREATE INDEX idx_plugins_status ON plugins(status);

-- ------------------------------
-- 8. 用户项目权限表 (user_project_permissions)
-- ------------------------------
CREATE TABLE user_project_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    permission VARCHAR(20) DEFAULT 'view' CHECK (permission IN ('view', 'edit', 'admin', 'owner')),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_user_project_perm ON user_project_permissions(user_id, project_id);
CREATE INDEX idx_user_project_perm_user_id ON user_project_permissions(user_id);
CREATE INDEX idx_user_project_perm_project_id ON user_project_permissions(project_id);

-- ------------------------------
-- 9. 项目部署表 (deployments)
-- ------------------------------
CREATE TABLE deployments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    environment VARCHAR(20) NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'deploying', 'success', 'failed')),
    version VARCHAR(20),
    build_url VARCHAR(255),
    deployed_url VARCHAR(255),
    build_log TEXT,
    deployed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deployments_project_id ON deployments(project_id);
CREATE INDEX idx_deployments_environment ON deployments(environment);
CREATE INDEX idx_deployments_status ON deployments(status);

-- ------------------------------
-- 触发器：自动更新updated_at
-- ------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_update
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_projects_update
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pages_update
BEFORE UPDATE ON pages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_component_library_update
BEFORE UPDATE ON component_library
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ai_generation_records_update
BEFORE UPDATE ON ai_generation_records
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_environment_variables_update
BEFORE UPDATE ON environment_variables
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_plugins_update
BEFORE UPDATE ON plugins
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_deployments_update
BEFORE UPDATE ON deployments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
