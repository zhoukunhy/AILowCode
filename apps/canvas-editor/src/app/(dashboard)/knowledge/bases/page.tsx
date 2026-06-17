'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function KnowledgeBasesPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/knowledge')
  }, [router])
  
  return null
}