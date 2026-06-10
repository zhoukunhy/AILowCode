'use client'

import React from 'react'
import { DataModelingPanel } from '@/components/DataModelingPanel'

export default function DataModelingPage() {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">数据建模</h1>
        <p className="text-gray-500 mt-1">设计和管理数据模型</p>
      </div>

      {/* 数据建模面板 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <DataModelingPanel />
      </div>
    </div>
  )
}
