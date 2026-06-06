'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  Button,
  Input,
  Select,
  Upload,
  message,
  Modal,
  List,
  Tag,
  Space,
  Spin,
  Empty,
  Pagination,
  Typography,
  Divider,
  Tooltip,
  Popconfirm,
} from 'antd'
import {
  PlusOutlined,
  UploadOutlined,
  SearchOutlined,
  DeleteOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  EyeOutlined,
  ReloadOutlined,
  FolderOutlined,
  FileMarkdownOutlined,
  ApiOutlined,
  FileSearchOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import {
  getKnowledgeBases,
  createKnowledgeBase,
  deleteKnowledgeBase,
  getDocuments,
  uploadDocumentFile,
  deleteDocument,
  searchKnowledge,
  getDocumentChunks,
} from '../../services/knowledgeApi'
import type { KnowledgeBase, KnowledgeDocument, SearchResult, DocumentChunk } from '../../services/knowledgeApi'

const { TextArea } = Input
const { Option } = Select
const { Text, Paragraph } = Typography

/**
 * 知识库面板组件
 * 提供知识库管理、文档上传、检索等功能
 */
export default function KnowledgePanel() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null)
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadModalVisible, setUploadModalVisible] = useState(false)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [searchModalVisible, setSearchModalVisible] = useState(false)
  const [previewModalVisible, setPreviewModalVisible] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [docType, setDocType] = useState<'md' | 'api' | 'requirement'>('md')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [previewChunks, setPreviewChunks] = useState<DocumentChunk[]>([])
  const [previewTotal, setPreviewTotal] = useState(0)
  const [previewPage, setPreviewPage] = useState(1)
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null)
  const [newKBName, setNewKBName] = useState('')
  const [newKBDescription, setNewKBDescription] = useState('')

  // 加载知识库列表
  useEffect(() => {
    loadKnowledgeBases()
  }, [])

  // 加载文档列表
  useEffect(() => {
    if (selectedKnowledgeBase) {
      loadDocuments(selectedKnowledgeBase.id)
    }
  }, [selectedKnowledgeBase])

  const loadKnowledgeBases = async () => {
    setLoading(true)
    try {
      const bases = await getKnowledgeBases()
      setKnowledgeBases(bases)
      if (bases.length > 0 && !selectedKnowledgeBase) {
        setSelectedKnowledgeBase(bases[0])
      }
    } catch (error: any) {
      message.error('加载知识库失败：' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async (knowledgeBaseId: number) => {
    setLoading(true)
    try {
      const docs = await getDocuments(knowledgeBaseId)
      setDocuments(docs)
    } catch (error: any) {
      message.error('加载文档失败：' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleCreateKnowledgeBase = async () => {
    if (!newKBName.trim()) {
      message.error('请输入知识库名称')
      return
    }

    setLoading(true)
    try {
      const kb = await createKnowledgeBase({
        name: newKBName,
        description: newKBDescription,
      })
      message.success('创建成功')
      setCreateModalVisible(false)
      setNewKBName('')
      setNewKBDescription('')
      await loadKnowledgeBases()
      setSelectedKnowledgeBase(kb)
    } catch (error: any) {
      message.error('创建失败：' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteKnowledgeBase = async (id: number) => {
    setLoading(true)
    try {
      await deleteKnowledgeBase(id)
      message.success('删除成功')
      await loadKnowledgeBases()
      if (selectedKnowledgeBase?.id === id) {
        setSelectedKnowledgeBase(knowledgeBases[0] || null)
      }
    } catch (error: any) {
      message.error('删除失败：' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedKnowledgeBase) {
      message.error('请先选择知识库')
      return
    }

    if (fileList.length === 0) {
      message.error('请选择要上传的文件')
      return
    }

    setLoading(true)
    try {
      const file = fileList[0].originFileObj as File
      await uploadDocumentFile(selectedKnowledgeBase.id, docType, file)
      message.success('上传成功，正在处理向量化...')
      setUploadModalVisible(false)
      setFileList([])
      await loadDocuments(selectedKnowledgeBase.id)
    } catch (error: any) {
      message.error('上传失败：' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDocument = async (id: number) => {
    setLoading(true)
    try {
      await deleteDocument(id)
      message.success('删除成功')
      if (selectedKnowledgeBase) {
        await loadDocuments(selectedKnowledgeBase.id)
      }
    } catch (error: any) {
      message.error('删除失败：' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!selectedKnowledgeBase) {
      message.error('请先选择知识库')
      return
    }

    if (!searchQuery.trim()) {
      message.error('请输入查询内容')
      return
    }

    setLoading(true)
    try {
      const results = await searchKnowledge({
        knowledgeBaseId: selectedKnowledgeBase.id,
        query: searchQuery,
        topK: 10,
        threshold: 0.5,
      })
      setSearchResults(results)
      if (results.length === 0) {
        message.info('未找到相关内容')
      }
    } catch (error: any) {
      message.error('检索失败：' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewChunks = async (document: KnowledgeDocument, page: number = 1) => {
    setLoading(true)
    try {
      const { chunks, total } = await getDocumentChunks(document.id, page, 5)
      setPreviewChunks(chunks)
      setPreviewTotal(total)
      setPreviewPage(page)
      setSelectedDocument(document)
      setPreviewModalVisible(true)
    } catch (error: any) {
      message.error('加载分块失败：' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const getStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: '待处理' },
      processing: { color: 'processing', text: '处理中' },
      completed: { color: 'success', text: '已完成' },
      failed: { color: 'error', text: '失败' },
    }
    const config = statusConfig[status] || statusConfig.pending
    return <Tag color={config.color}>{config.text}</Tag>
  }

  const getDocTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      md: <FileMarkdownOutlined />,
      api: <ApiOutlined />,
      requirement: <FileSearchOutlined />,
    }
    return icons[type] || <FileTextOutlined />
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 头部 */}
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong style={{ fontSize: 16 }}>
              <DatabaseOutlined /> 知识库管理
            </Text>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="small"
              onClick={() => setCreateModalVisible(true)}
            >
              新建知识库
            </Button>
          </div>

          <Select
            style={{ width: '100%' }}
            placeholder="选择知识库"
            value={selectedKnowledgeBase?.id}
            onChange={(value) => {
              const kb = knowledgeBases.find((k) => k.id === value)
              setSelectedKnowledgeBase(kb || null)
            }}
          >
            {knowledgeBases.map((kb) => (
              <Option key={kb.id} value={kb.id}>
                <FolderOutlined /> {kb.name} ({kb.documentCount} 个文档)
              </Option>
            ))}
          </Select>

          {selectedKnowledgeBase && (
            <Space>
              <Button
                icon={<UploadOutlined />}
                size="small"
                onClick={() => setUploadModalVisible(true)}
              >
                上传文档
              </Button>
              <Button
                icon={<SearchOutlined />}
                size="small"
                onClick={() => setSearchModalVisible(true)}
              >
                检索知识库
              </Button>
              <Button
                icon={<ReloadOutlined />}
                size="small"
                onClick={() => loadDocuments(selectedKnowledgeBase.id)}
              >
                刷新
              </Button>
              <Popconfirm
                title="确定要删除此知识库吗？"
                onConfirm={() => handleDeleteKnowledgeBase(selectedKnowledgeBase.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                >
                  删除知识库
                </Button>
              </Popconfirm>
            </Space>
          )}
        </Space>
      </div>

      {/* 文档列表 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <Spin spinning={loading}>
          {!selectedKnowledgeBase ? (
            <Empty description="请选择或创建知识库" />
          ) : documents.length === 0 ? (
            <Empty description="暂无文档，请上传" />
          ) : (
            <List
              dataSource={documents}
              renderItem={(doc) => (
                <List.Item
                  actions={[
                    <Tooltip title="查看分块">
                      <Button
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handlePreviewChunks(doc)}
                      />
                    </Tooltip>,
                    <Popconfirm
                      title="确定要删除此文档吗？"
                      onConfirm={() => handleDeleteDocument(doc.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="link"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={getDocTypeIcon(doc.type)}
                    title={
                      <Space>
                        <Text>{doc.name}</Text>
                        {getStatusTag(doc.vectorStatus)}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          类型: {doc.type} | 大小: {((doc.size || 0) / 1024).toFixed(2)} KB | 分块: {doc.chunkCount}
                        </Text>
                        {doc.errorMessage && (
                          <Text type="danger" style={{ fontSize: 12 }}>
                            错误: {doc.errorMessage}
                          </Text>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </div>

      {/* 创建知识库模态框 */}
      <Modal
        title="创建知识库"
        open={createModalVisible}
        onOk={handleCreateKnowledgeBase}
        onCancel={() => setCreateModalVisible(false)}
        okText="创建"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>知识库名称 *</Text>
            <Input
              placeholder="请输入知识库名称"
              value={newKBName}
              onChange={(e) => setNewKBName(e.target.value)}
            />
          </div>
          <div>
            <Text>描述</Text>
            <TextArea
              rows={3}
              placeholder="请输入知识库描述"
              value={newKBDescription}
              onChange={(e) => setNewKBDescription(e.target.value)}
            />
          </div>
        </Space>
      </Modal>

      {/* 上传文档模态框 */}
      <Modal
        title="上传文档"
        open={uploadModalVisible}
        onOk={handleUpload}
        onCancel={() => setUploadModalVisible(false)}
        okText="上传"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>文档类型</Text>
            <Select
              style={{ width: '100%' }}
              value={docType}
              onChange={setDocType}
            >
              <Option value="md">
                <FileMarkdownOutlined /> Markdown 文档
              </Option>
              <Option value="api">
                <ApiOutlined /> API 文档
              </Option>
              <Option value="requirement">
                <FileSearchOutlined /> 需求文档
              </Option>
            </Select>
          </div>
          <div>
            <Text>选择文件</Text>
            <Upload
              fileList={fileList}
              beforeUpload={(file) => {
                setFileList([file as any])
                return false
              }}
              onRemove={() => setFileList([])}
              maxCount={1}
              accept=".md,.txt,.markdown"
            >
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            <Text type="secondary" style={{ fontSize: 12 }}>
              支持 .md, .txt, .markdown 格式，最大 10MB
            </Text>
          </div>
        </Space>
      </Modal>

      {/* 检索知识库模态框 */}
      <Modal
        title="检索知识库"
        open={searchModalVisible}
        onOk={handleSearch}
        onCancel={() => {
          setSearchModalVisible(false)
          setSearchQuery('')
          setSearchResults([])
        }}
        okText="检索"
        cancelText="取消"
        width={800}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>查询内容</Text>
            <TextArea
              rows={3}
              placeholder="请输入要检索的内容"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchResults.length > 0 && (
            <div>
              <Divider>检索结果 ({searchResults.length})</Divider>
              <List
                dataSource={searchResults}
                renderItem={(result, index) => (
                  <List.Item>
                    <List.Item.Meta
                      title={
                        <Space>
                          <Tag color="blue">#{index + 1}</Tag>
                          <Text>相似度: {(result.score * 100).toFixed(1)}%</Text>
                        </Space>
                      }
                      description={
                        <Paragraph
                          ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
                          style={{ marginBottom: 0 }}
                        >
                          {result.content}
                        </Paragraph>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}
        </Space>
      </Modal>

      {/* 文档分块预览模态框 */}
      <Modal
        title={`文档分块预览 - ${selectedDocument?.name || ''}`}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width={800}
      >
        <List
          dataSource={previewChunks}
          renderItem={(chunk) => (
            <List.Item>
              <List.Item.Meta
                title={<Tag>分块 #{chunk.chunkIndex + 1}</Tag>}
                description={
                  <Paragraph
                    ellipsis={{ rows: 5, expandable: true, symbol: '展开' }}
                    style={{ marginBottom: 0 }}
                  >
                    {chunk.content}
                  </Paragraph>
                }
              />
            </List.Item>
          )}
        />
        {previewTotal > 5 && (
          <Pagination
            current={previewPage}
            total={previewTotal}
            pageSize={5}
            onChange={(page) => handlePreviewChunks(selectedDocument!, page)}
            style={{ marginTop: 16, textAlign: 'center' }}
          />
        )}
      </Modal>
    </div>
  )
}
