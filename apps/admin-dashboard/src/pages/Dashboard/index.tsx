import { Card, Row, Col, Statistic } from 'antd'
import { ProjectOutlined, UserOutlined, FileOutlined, TeamOutlined } from '@ant-design/icons'

export default function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">仪表盘</h2>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="项目总数"
              value={128}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={1024}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="模板数量"
              value={56}
              prefix={<FileOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="团队数量"
              value={32}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
