import { useState } from 'react'
import { Button, Space, Tag, Modal, message, Form, Input, Select } from 'antd'
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import ProTable from '@ant-design/pro-table'
import type { ProColumns } from '@ant-design/pro-table'
import { userApi, type User } from '../../services/index'

const { Option } = Select

export default function UserManage() {
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()

  const fetchUsers = async (params: any) => {
    try {
      const response = await userApi.getList({
        page: params.current,
        pageSize: params.pageSize,
        username: params.username,
        email: params.email,
        role: params.role,
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
    setEditingUser(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: User) => {
    setEditingUser(record)
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      role: record.role,
      status: record.status,
    })
    setModalVisible(true)
  }

  const handleDelete = async (record: User) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 ${record.username} 吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await userApi.delete(record.id)
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
      if (editingUser) {
        await userApi.update(editingUser.id, values)
        message.success('更新成功')
      } else {
        message.info('创建功能需要后端接口支持')
      }
      setModalVisible(false)
    } catch (error) {
      console.error('Submit failed:', error)
    }
  }

  const columns: ProColumns<User>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      hideInSearch: true,
      width: 80,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      valueType: 'select',
      valueEnum: {
        admin: { text: '管理员', status: 'Processing' },
        user: { text: '普通用户', status: 'Default' },
        developer: { text: '开发者', status: 'Success' },
      },
      render: (_, record) => {
        const colors: Record<string, string> = {
          admin: 'blue',
          user: 'default',
          developer: 'purple',
        }
        const labels: Record<string, string> = {
          admin: '管理员',
          user: '普通用户',
          developer: '开发者',
        }
        return <Tag color={colors[record.role]}>{labels[record.role]}</Tag>
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      hideInSearch: true,
      render: (_, record) => (
        <Tag color={record.status === 'active' ? 'green' : 'red'}>
          {record.status === 'active' ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      hideInSearch: true,
      valueType: 'dateTime',
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
      <ProTable<User>
        columns={columns}
        request={fetchUsers}
        rowKey="id"
        pagination={{
          pageSize: 10,
        }}
        toolBarRender={() => [
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} key="add">
            新建用户
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
        title={editingUser ? '编辑用户' : '新建用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="user">普通用户</Option>
              <Option value="developer">开发者</Option>
            </Select>
          </Form.Item>

          {editingUser && (
            <Form.Item name="status" label="状态">
              <Select placeholder="请选择状态">
                <Option value="active">正常</Option>
                <Option value="inactive">禁用</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}