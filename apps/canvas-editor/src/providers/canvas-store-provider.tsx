'use client'

import { type ReactNode, useRef, type MutableRefObject } from 'react'
import { createCanvasStore } from '@/store/canvasStore'
import { CanvasStoreContext, useCanvasStore, type CanvasStoreApi } from './canvas-store-context'

export { useCanvasStore }
export type { CanvasStoreApi }

export interface CanvasStoreProviderProps {
  children: ReactNode
}

export const CanvasStoreProvider = ({ children }: CanvasStoreProviderProps) => {
  const storeRef = useRef<CanvasStoreApi | null>(null) as MutableRefObject<CanvasStoreApi | null>
  if (!storeRef.current) {
    storeRef.current = createCanvasStore()
  }

  return (
    <CanvasStoreContext.Provider value={storeRef.current}>
      {children}
    </CanvasStoreContext.Provider>
  )
}
