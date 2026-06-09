'use client'

import { type ReactNode, createContext, useRef, useContext, type MutableRefObject } from 'react'
import { useStore } from 'zustand'
import { createCanvasStore, type CanvasState } from '@/store/canvasStore'

export type CanvasStoreApi = ReturnType<typeof createCanvasStore>

export const CanvasStoreContext = createContext<CanvasStoreApi | undefined>(undefined)

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

export const useCanvasStore = <T,>(selector: (store: CanvasState) => T): T => {
  const canvasStoreContext = useContext(CanvasStoreContext)

  if (!canvasStoreContext) {
    throw new Error(`useCanvasStore must be used within CanvasStoreProvider`)
  }

  return useStore(canvasStoreContext, selector)
}