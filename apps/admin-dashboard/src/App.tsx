import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './layouts/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProjectList from './pages/ProjectList'
import UserManage from './pages/UserManage'
import RoleManage from './pages/RoleManage'
import TemplateManage from './pages/TemplateManage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="users" element={<UserManage />} />
          <Route path="roles" element={<RoleManage />} />
          <Route path="templates" element={<TemplateManage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
