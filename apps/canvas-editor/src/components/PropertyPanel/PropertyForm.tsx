'use client'

import React from 'react'

interface SchemaFieldProps {
  name: string
  schema: any
  value: any
  onChange: (name: string, value: any) => void
}

function SchemaField({ name, schema, value, onChange }: SchemaFieldProps) {
  switch (schema.type) {
    case 'string':
      if (schema.enum) {
        // 枚举类型 - 下拉选择
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {schema.title || name}
            </label>
            <select
              value={value || ''}
              onChange={(e) => onChange(name, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {schema.enum.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )
      }
      // 普通文本输入
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {schema.title || name}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )

    case 'number':
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {schema.title || name}
          </label>
          <input
            type="number"
            value={value || 0}
            onChange={(e) => onChange(name, Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )

    case 'boolean':
      return (
        <div className="mb-4 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            {schema.title || name}
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(name, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      )

    default:
      return null
  }
}

interface PropertyFormProps {
  schema: any
  values: Record<string, any>
  onChange: (values: Record<string, any>) => void
}

export function PropertyForm({ schema, values, onChange }: PropertyFormProps) {
  const handleFieldChange = (name: string, value: any) => {
    onChange({ ...values, [name]: value })
  }

  if (!schema || !schema.properties) {
    return null
  }

  return (
    <div className="p-4">
      {Object.entries(schema.properties).map(([name, fieldSchema]: [string, any]) => (
        <SchemaField
          key={name}
          name={name}
          schema={fieldSchema}
          value={values[name]}
          onChange={handleFieldChange}
        />
      ))}
    </div>
  )
}
