'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface MenuItem {
  id: string
  label: string
  icon: string
  path: string
  children?: MenuItem[]
}

interface ClientMenuItemsProps {
  items: MenuItem[]
  isCollapsed: boolean
  isMobileMenuOpen: boolean
}

export function ClientMenuItems({ items, isCollapsed }: ClientMenuItemsProps) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname.startsWith(path)
  }

  return (
    <nav className="p-4 space-y-1">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => {
            router.push(item.path)
          }}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
            isActive(item.path)
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="text-xl">{item.icon}</span>
          {!isCollapsed && <span className="font-medium">{item.label}</span>}
        </div>
      ))}
    </nav>
  )
}