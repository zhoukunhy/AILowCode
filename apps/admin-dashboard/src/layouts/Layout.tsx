import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Layout as AntLayout, Menu, Avatar, Dropdown } from 'antd'
import {
  DashboardOutlined,
  ProjectOutlined,
  UserOutlined,
  AppstoreOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../services/index'
import { message } from 'antd'

const { Header, Sider, Content } = AntLayout

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">仪表盘</Link>,
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: <Link to="/projects">项目管理</Link>,
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: <Link to="/users">用户管理</Link>,
    },
    {
      key: '/roles',
      icon: <SettingOutlined />,
      label: <Link to="/roles">角色权限</Link>,
    },
    {
      key: '/templates',
      icon: <AppstoreOutlined />,
      label: <Link to="/templates">模板管理</Link>,
    },
  ]

  const handleLogout = async () => {
    try {
      await authApi.logout()
      logout()
      message.success('退出成功')
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider width={240} theme="dark">
        <div 
          style={{ 
            height: 64, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold',
            borderBottom: '1px solid #303030'
          }}
        >
          AI低代码平台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ marginTop: 8 }}
        />
      </Sider>
      <AntLayout>
        <Header 
          style={{ 
            background: 'white', 
            padding: '0 24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <h1 style={{ fontSize: 18, margin: 0, fontWeight: 600 }}>管理后台</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Avatar 
                  icon={<UserOutlined />} 
                  style={{ backgroundColor: '#1890ff', marginRight: 8 }}
                >
                  {user?.username?.charAt(0)?.toUpperCase()}
                </Avatar>
                <span>{user?.username || '管理员'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content 
          style={{ 
            margin: 24, 
            padding: 24, 
            background: 'white', 
            borderRadius: 8,
            minHeight: 'calc(100vh - 112px)'
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
