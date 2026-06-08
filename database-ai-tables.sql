-- ==================== AI 相关数据表 ====================

-- 知识库文档表
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT '文档名称',
    content TEXT COMMENT '文档内容',
    type VARCHAR(50) COMMENT '文档类型（pdf, txt, md, html等）',
    size INTEGER COMMENT '文档大小（字节）',
    vector_status VARCHAR(20) DEFAULT 'pending' COMMENT '向量化状态：pending, processing, completed, failed',
    chunk_count INTEGER DEFAULT 0 COMMENT '分块数量',
    metadata JSONB COMMENT '元数据（JSON格式）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_knowledge_documents_status ON knowledge_documents(vector_status);
CREATE INDEX idx_knowledge_documents_type ON knowledge_documents(type);
CREATE INDEX idx_knowledge_documents_created_at ON knowledge_documents(created_at);

COMMENT ON TABLE knowledge_documents IS '知识库文档表';
COMMENT ON COLUMN knowledge_documents.id IS '文档ID';
COMMENT ON COLUMN knowledge_documents.name IS '文档名称';
COMMENT ON COLUMN knowledge_documents.content IS '文档内容';
COMMENT ON COLUMN knowledge_documents.type IS '文档类型（pdf, txt, md, html等）';
COMMENT ON COLUMN knowledge_documents.size IS '文档大小（字节）';
COMMENT ON COLUMN knowledge_documents.vector_status IS '向量化状态：pending, processing, completed, failed';
COMMENT ON COLUMN knowledge_documents.chunk_count IS '分块数量';
COMMENT ON COLUMN knowledge_documents.metadata IS '元数据（JSON格式）';

-- Agent 会话记录表
CREATE TABLE IF NOT EXISTS agent_conversations (
    id SERIAL PRIMARY KEY,
    agent_id VARCHAR(100) NOT NULL COMMENT 'Agent ID',
    user_id INTEGER NOT NULL COMMENT '用户ID',
    title VARCHAR(255) COMMENT '会话标题',
    messages JSONB DEFAULT '[]' COMMENT '消息列表（JSON格式）',
    metadata JSONB COMMENT '元数据（JSON格式）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_agent_conversations_agent_id ON agent_conversations(agent_id);
CREATE INDEX idx_agent_conversations_user_id ON agent_conversations(user_id);
CREATE INDEX idx_agent_conversations_created_at ON agent_conversations(created_at);

COMMENT ON TABLE agent_conversations IS 'Agent 会话记录表';
COMMENT ON COLUMN agent_conversations.id IS '会话ID';
COMMENT ON COLUMN agent_conversations.agent_id IS 'Agent ID';
COMMENT ON COLUMN agent_conversations.user_id IS '用户ID';
COMMENT ON COLUMN agent_conversations.title IS '会话标题';
COMMENT ON COLUMN agent_conversations.messages IS '消息列表（JSON格式）';
COMMENT ON COLUMN agent_conversations.metadata IS '元数据（JSON格式）';

-- 工具调用日志表
CREATE TABLE IF NOT EXISTS tool_call_logs (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER COMMENT '会话ID',
    tool_name VARCHAR(100) NOT NULL COMMENT '工具名称',
    input JSONB COMMENT '输入参数（JSON格式）',
    output JSONB COMMENT '输出结果（JSON格式）',
    success BOOLEAN DEFAULT true COMMENT '是否成功',
    error TEXT COMMENT '错误信息',
    duration INTEGER COMMENT '执行时长（毫秒）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES agent_conversations(id) ON DELETE CASCADE
);

CREATE INDEX idx_tool_call_logs_conversation_id ON tool_call_logs(conversation_id);
CREATE INDEX idx_tool_call_logs_tool_name ON tool_call_logs(tool_name);
CREATE INDEX idx_tool_call_logs_created_at ON tool_call_logs(created_at);
CREATE INDEX idx_tool_call_logs_success ON tool_call_logs(success);

COMMENT ON TABLE tool_call_logs IS '工具调用日志表';
COMMENT ON COLUMN tool_call_logs.id IS '日志ID';
COMMENT ON COLUMN tool_call_logs.conversation_id IS '会话ID';
COMMENT ON COLUMN tool_call_logs.tool_name IS '工具名称';
COMMENT ON COLUMN tool_call_logs.input IS '输入参数（JSON格式）';
COMMENT ON COLUMN tool_call_logs.output IS '输出结果（JSON格式）';
COMMENT ON COLUMN tool_call_logs.success IS '是否成功';
COMMENT ON COLUMN tool_call_logs.error IS '错误信息';
COMMENT ON COLUMN tool_call_logs.duration IS '执行时长（毫秒）';

-- AI 配置表
CREATE TABLE IF NOT EXISTS ai_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '配置名称',
    provider VARCHAR(50) NOT NULL COMMENT '提供商：deepseek, qwen, openai',
    model VARCHAR(100) COMMENT '模型名称',
    api_key TEXT NOT NULL COMMENT 'API密钥（加密存储）',
    base_url VARCHAR(255) COMMENT 'API基础URL',
    config JSONB COMMENT '其他配置（JSON格式）',
    is_active BOOLEAN DEFAULT true COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_ai_configs_provider ON ai_configs(provider);
CREATE INDEX idx_ai_configs_is_active ON ai_configs(is_active);

COMMENT ON TABLE ai_configs IS 'AI 配置表';
COMMENT ON COLUMN ai_configs.id IS '配置ID';
COMMENT ON COLUMN ai_configs.name IS '配置名称';
COMMENT ON COLUMN ai_configs.provider IS '提供商：deepseek, qwen, openai';
COMMENT ON COLUMN ai_configs.model IS '模型名称';
COMMENT ON COLUMN ai_configs.api_key IS 'API密钥（加密存储）';
COMMENT ON COLUMN ai_configs.base_url IS 'API基础URL';
COMMENT ON COLUMN ai_configs.config IS '其他配置（JSON格式）';
COMMENT ON COLUMN ai_configs.is_active IS '是否启用';

-- 向量库配置表
CREATE TABLE IF NOT EXISTS vector_store_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '配置名称',
    url VARCHAR(255) NOT NULL COMMENT 'Chroma URL',
    api_key TEXT COMMENT 'API密钥（加密存储）',
    config JSONB COMMENT '其他配置（JSON格式）',
    is_active BOOLEAN DEFAULT true COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_vector_store_configs_is_active ON vector_store_configs(is_active);

COMMENT ON TABLE vector_store_configs IS '向量库配置表';
COMMENT ON COLUMN vector_store_configs.id IS '配置ID';
COMMENT ON COLUMN vector_store_configs.name IS '配置名称';
COMMENT ON COLUMN vector_store_configs.url IS 'Chroma URL';
COMMENT ON COLUMN vector_store_configs.api_key IS 'API密钥（加密存储）';
COMMENT ON COLUMN vector_store_configs.config IS '其他配置（JSON格式）';
COMMENT ON COLUMN vector_store_configs.is_active IS '是否启用';

-- 知识库表（用于管理多个知识库）
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT '知识库名称',
    description TEXT COMMENT '知识库描述',
    embedding_model VARCHAR(100) COMMENT '嵌入模型',
    dimension INTEGER DEFAULT 1536 COMMENT '向量维度',
    document_count INTEGER DEFAULT 0 COMMENT '文档数量',
    is_active BOOLEAN DEFAULT true COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_knowledge_bases_is_active ON knowledge_bases(is_active);

COMMENT ON TABLE knowledge_bases IS '知识库表';
COMMENT ON COLUMN knowledge_bases.id IS '知识库ID';
COMMENT ON COLUMN knowledge_bases.name IS '知识库名称';
COMMENT ON COLUMN knowledge_bases.description IS '知识库描述';
COMMENT ON COLUMN knowledge_bases.embedding_model IS '嵌入模型';
COMMENT ON COLUMN knowledge_bases.dimension IS '向量维度';
COMMENT ON COLUMN knowledge_bases.document_count IS '文档数量';
COMMENT ON COLUMN knowledge_bases.is_active IS '是否启用';

-- 为 knowledge_documents 表添加知识库关联
ALTER TABLE knowledge_documents ADD COLUMN knowledge_base_id INTEGER REFERENCES knowledge_bases(id) ON DELETE SET NULL;
CREATE INDEX idx_knowledge_documents_base_id ON knowledge_documents(knowledge_base_id);
