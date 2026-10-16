'use client'

import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { StoreApi } from 'zustand'
import type { CanvasState } from '@/store/canvasStore'

export type CanvasStoreApi = StoreApi<CanvasState>

export const CanvasStoreContext = createContext<CanvasStoreApi | undefined>(undefined)

export const useCanvasStore = <T,>(selector: (store: CanvasState) => T): T => {
  const canvasStoreContext = useContext(CanvasStoreContext)

  if (!canvasStoreContext) {
    throw new Error(`useCanvasStore must be used within CanvasStoreProvider`)
  }

  return useStore(canvasStoreContext, selector)
}
