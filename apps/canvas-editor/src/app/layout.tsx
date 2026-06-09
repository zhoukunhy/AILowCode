import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/providers'

export const metadata: Metadata = {
  title: 'AI低代码平台 - 画布编辑器',
  description: '基于AI的全栈低代码平台画布编辑器',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}