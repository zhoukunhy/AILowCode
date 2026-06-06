import { Table, Button, Space, Tag } from 'antd'
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'

const mockData = [
  { id: 1, name: '管理后台模板', category: '后台管理', downloads: 256, status: 'published' },
  { id: 2, name: '企业官网模板', category: '企业站', downloads: 189, status: 'published' },
  { id: 3, name: '电商H5模板', category: '电商', downloads: 342, status: 'draft' },
]

export default function TemplateManage() {
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '模板名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '下载量', dataIndex: 'downloads', key: 'downloads' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'published' ? 'green' : 'orange'}>
          {status === 'published' ? '已发布' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" icon={<EyeOutlined />}>预览</Button>
          <Button type="link" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">模板管理</h2>
      <Table dataSource={mockData} columns={columns} rowKey="id" />
    </div>
  )
}
