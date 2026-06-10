'use client'

import React from 'react'
import { DataManagementPanel } from '@/components/DataManagementPanel'

export default function DataManagementPage() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">数据管理</h1>
        <p className="text-gray-500 mt-1">管理数据源和数据绑定配置</p>
      </div>

      {/* 数据管理面板 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <DataManagementPanel />
      </div>
    </div>
  )
}
