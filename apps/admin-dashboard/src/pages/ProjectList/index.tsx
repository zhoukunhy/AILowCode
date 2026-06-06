import { useState } from 'react'
import { Button, Space, Tag, Modal, message, Form, Input, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import ProTable from '@ant-design/pro-table'
import type { ProColumns } from '@ant-design/pro-table'
import { projectApi, type Project } from '../../services/index'

const { Option } = Select

export default function ProjectList() {
  const [modalVisible, setModalVisible] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form] = Form.useForm()

  const fetchProjects = async (params: any) => {
    try {
      const response = await projectApi.getList({
        page: params.current,
        pageSize: params.pageSize,
        name: params.name,
        status: params.status,
      })
      return {
        data: Array.isArray(response) ? response : [],
        success: true,
        total: Array.isArray(response) ? response.length : 0,
      }
    } catch (error) {
      return { data: [], success: false, total: 0 }
    }
  }

  const handleAdd = () => {
    setEditingProject(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Project) => {
    setEditingProject(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      status: record.status,
    })
    setModalVisible(true)
  }

  const handleDelete = async (record: Project) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除项目 ${record.name} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await projectApi.delete(record.id)
          message.success('删除成功')
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingProject) {
        await projectApi.update(editingProject.id, values)
        message.success('更新成功')
      } else {
        await projectApi.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
    } catch (error) {
      console.error('Submit failed:', error)
    }
  }

  const columns: ProColumns<Project>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      hideInSearch: true,
      width: 80,
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '项目描述',
      dataIndex: 'description',
      key: 'description',
      hideInSearch: true,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      valueType: 'select',
      valueEnum: {
        draft: { text: '草稿', status: 'Default' },
        published: { text: '已发布', status: 'Success' },
        archived: { text: '已归档', status: 'Error' },
      },
      render: (_, record) => {
        const colors: Record<string, string> = {
          draft: 'orange',
          published: 'green',
          archived: 'red',
        }
        const labels: Record<string, string> = {
          draft: '草稿',
          published: '已发布',
          archived: '已归档',
        }
        return <Tag color={colors[record.status]}>{labels[record.status]}</Tag>
      },
    },
    {
      title: '可见性',
      dataIndex: 'visibility',
      key: 'visibility',
      hideInSearch: true,
      render: (_, record) => (
        <Tag color={record.visibility === 'public' ? 'blue' : 'default'}>
          {record.visibility === 'public' ? '公开' : '私有'}
        </Tag>
      ),
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      hideInSearch: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      hideInSearch: true,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      key: 'action',
      valueType: 'option',
      hideInSearch: true,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <ProTable<Project>
        columns={columns}
        request={fetchProjects}
        rowKey="id"
        pagination={{
          pageSize: 10,
        }}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} key="add">
            新建项目
          </Button>,
        ]}
        search={{
          labelWidth: 'auto',
        }}
        options={{
          setting: {
            listsHeight: 400,
          },
        }}
      />

      <Modal
        title={editingProject ? '编辑项目' : '新建项目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="项目描述"
          >
            <Input.TextArea rows={4} placeholder="请输入项目描述" />
          </Form.Item>

          {editingProject && (
            <>
              <Form.Item name="status" label="状态">
                <Select placeholder="请选择状态">
                  <Option value="draft">草稿</Option>
                  <Option value="published">已发布</Option>
                  <Option value="archived">已归档</Option>
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}