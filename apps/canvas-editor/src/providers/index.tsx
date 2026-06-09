'use client'

import { ReactNode } from 'react'
import { CanvasStoreProvider } from './canvas-store-provider'

export function Providers({ children }: { children: ReactNode }) {
  return <CanvasStoreProvider>{children}</CanvasStoreProvider>
}